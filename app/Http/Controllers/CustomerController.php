<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('busca', ''));

        $customers = Customer::query()
            ->with('user:id,name,email')
            ->when($search !== '', fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                    ->orWhere('document', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            }))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('customers/index', ['customers' => $customers, 'search' => $search]);
    }

    public function create(): Response
    {
        return Inertia::render('customers/form', ['customer' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($data) {
            $user = new User(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password']]);
            $user->type = User::TYPE_CUSTOMER;
            $user->email_verified_at = now();
            $user->save();
            Customer::create(['user_id' => $user->id] + $this->profile($data));
        });

        return to_route('clientes.index');
    }

    public function edit(Customer $cliente): Response
    {
        return Inertia::render('customers/form', ['customer' => $this->payload($cliente->load('user'))]);
    }

    public function update(Request $request, Customer $cliente): RedirectResponse
    {
        $data = $request->validate($this->rules($cliente));

        DB::transaction(function () use ($data, $cliente) {
            $user = $cliente->user;
            $user->name = $data['name'];
            $user->email = $data['email'];
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
            $user->save();
            $cliente->update($this->profile($data));

            if (! $cliente->is_active) {
                $user->customerTokens()->delete();
            }
        });

        return to_route('clientes.index');
    }

    public function destroy(Customer $cliente): RedirectResponse
    {
        // Remove o usuário; o cliente e os tokens caem em cascata.
        $cliente->user()->delete();

        return to_route('clientes.index');
    }

    private function profile(array $data): array
    {
        return [
            'phone' => $data['phone'] ?? null,
            'document' => $data['document'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ];
    }

    private function payload(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->user->name,
            'email' => $customer->user->email,
            'phone' => $customer->phone,
            'document' => $customer->document,
            'birth_date' => $customer->birth_date?->format('Y-m-d'),
            'is_active' => $customer->is_active,
        ];
    }

    private function rules(?Customer $customer = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($customer?->user_id)],
            'password' => [$customer ? 'nullable' : 'required', 'string', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:30'],
            'document' => ['nullable', 'string', 'max:20'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'is_active' => ['boolean'],
        ];
    }
}
