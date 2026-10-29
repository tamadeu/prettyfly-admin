<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CustomerResource;
use App\Models\Customer;
use App\Models\CustomerToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

    private function session(User $user, int $status = 200): JsonResponse
    {
        return (new CustomerResource($user))->additional(['token' => CustomerToken::issue($user)])
            ->response()->setStatusCode($status);
    }
}
