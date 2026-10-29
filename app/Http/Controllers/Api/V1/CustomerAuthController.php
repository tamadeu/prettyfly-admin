<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Customer;
use App\Models\CustomerToken;
use App\Models\User;
use App\Notifications\CustomerResetPassword;
use App\Notifications\CustomerVerifyEmail;
use App\Support\CustomerLinks;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class CustomerAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $user = new User(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password']]);
            $user->type = User::TYPE_CUSTOMER;
            $user->save();
            Customer::create(['user_id' => $user->id, 'phone' => $data['phone'] ?? null, 'last_login_at' => now()]);

            return $user;
        });

        $this->sendVerification($user);

        return $this->session($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->where('type', User::TYPE_CUSTOMER)->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || ! $user->customer?->is_active) {
            return new JsonResponse(['message' => 'E-mail ou senha inválidos.'], 422);
        }

        $user->customer->forceFill(['last_login_at' => now()])->save();

        return $this->session($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->attributes->get('customer_token')->delete();

        return new JsonResponse(null, 204);
    }

    public function me(Request $request): CustomerResource
    {
        return new CustomerResource($request->user());
    }

    public function update(Request $request): CustomerResource|JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'document' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'password' => ['nullable', 'string', Password::min(8)],
            'current_password' => ['required_with:password', 'string'],
        ]);

        if (! empty($data['password']) && ! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Senha atual incorreta.', 'errors' => ['current_password' => ['Senha atual incorreta.']]], 422);
        }

        $user->name = $data['name'];
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();
        $user->customer->fill(collect($data)->only(['phone', 'document', 'birth_date'])->all())->save();

        return new CustomerResource($user->fresh('customer'));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);

        try {
            PasswordBroker::sendResetLink(
                ['email' => $data['email'], 'type' => User::TYPE_CUSTOMER],
                function (User $user, string $token) {
                    if ($user->customer?->is_active) {
                        $user->notify(new CustomerResetPassword($token));
                    }
                },
            );
        } catch (\Throwable $e) {
            $this->logMailFailure('redefinição de senha', $e, ['email' => $data['email']]);
        }

        // Resposta idêntica para existir ou não: evita descobrir e-mails cadastrados.
        return new JsonResponse(['message' => 'Se o e-mail estiver cadastrado, enviaremos as instruções.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', Password::min(8)],
        ]);

        $status = PasswordBroker::reset(
            $data + ['type' => User::TYPE_CUSTOMER],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
                $user->customerTokens()->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            return new JsonResponse(['message' => 'Link inválido ou expirado. Peça um novo.'], 422);
        }

        return new JsonResponse(['message' => 'Senha redefinida. Faça login com a nova senha.']);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'integer'],
            'expires' => ['required', 'integer'],
            'signature' => ['required', 'string'],
        ]);

        $user = User::where('id', $data['id'])->where('type', User::TYPE_CUSTOMER)->first();

        if (! $user || ! CustomerLinks::validSignature($user, (int) $data['expires'], $data['signature'])) {
            return new JsonResponse(['message' => 'Link inválido ou expirado.'], 422);
        }

        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return new JsonResponse(['message' => 'E-mail confirmado.']);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return new JsonResponse(['message' => 'E-mail já confirmado.']);
        }

        if (! $this->sendVerification($user, $error)) {
            return new JsonResponse(array_filter([
                'message' => 'Não foi possível enviar o e-mail agora.',
                'debug' => config('app.debug') ? $error : null,
            ]), 503);
        }

        return new JsonResponse(['message' => 'E-mail de confirmação enviado.']);
    }

    private function sendVerification(User $user, ?string &$error = null): bool
    {
        try {
            $user->notify(new CustomerVerifyEmail);

            return true;
        } catch (\Throwable $e) {
            $error = $this->logMailFailure('verificação de e-mail', $e, ['user_id' => $user->id]);

            return false;
        }
    }

    /** Registra a falha com a cadeia de causas e a config SMTP (sem senha) e devolve um resumo. */
    private function logMailFailure(string $what, \Throwable $e, array $context = []): string
    {
        $chain = [];
        for ($t = $e; $t; $t = $t->getPrevious()) {
            $chain[] = get_class($t).': '.$t->getMessage();
        }

        $mailer = config('mail.default');
        $smtp = config("mail.mailers.$mailer", []);

        Log::error("Falha ao enviar e-mail de $what", $context + [
            'causes' => $chain,
            'mailer' => $mailer,
            'host' => $smtp['host'] ?? null,
            'port' => $smtp['port'] ?? null,
            'scheme' => $smtp['scheme'] ?? null,
            'username' => $smtp['username'] ?? null,
            'timeout' => $smtp['timeout'] ?? null,
            'from' => config('mail.from.address'),
            'trace' => $e->getTraceAsString(),
        ]);

        return implode(' <- ', $chain);
    }

    private function session(User $user, int $status = 200): JsonResponse
    {
        return (new CustomerResource($user))->additional(['token' => CustomerToken::issue($user)])
            ->response()->setStatusCode($status);
    }
}
