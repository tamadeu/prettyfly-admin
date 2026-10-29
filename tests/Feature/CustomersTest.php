<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomersTest extends TestCase
{
    use RefreshDatabase;

    private function api(): array
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        return ['Authorization' => 'Bearer '.str_repeat('a', 40)];
    }

    private function registerCustomer(string $email = 'ana@example.com'): array
    {
        return $this->postJson('/api/v1/customers/register', [
            'name' => 'Ana', 'email' => $email, 'password' => 'segredo123',
        ], $this->api())->assertCreated()->json();
    }

    public function test_register_login_me_update_logout(): void
    {
        $body = $this->registerCustomer();
        $this->assertSame('customer', User::where('email', 'ana@example.com')->value('type'));
        $this->assertDatabaseCount('customers', 1);

        $this->postJson('/api/v1/customers/register', ['name' => 'X', 'email' => 'ana@example.com', 'password' => 'segredo123'], $this->api())
            ->assertUnprocessable();
        $this->postJson('/api/v1/customers/login', ['email' => 'ana@example.com', 'password' => 'errada'], $this->api())
            ->assertUnprocessable();

        $token = $this->postJson('/api/v1/customers/login', ['email' => 'ana@example.com', 'password' => 'segredo123'], $this->api())
            ->assertOk()->json('token');
        $h = $this->api() + ['X-Customer-Token' => $token];

        $this->getJson('/api/v1/customers/me', $this->api())->assertUnauthorized();
        $this->getJson('/api/v1/customers/me', $h)->assertOk()->assertJsonPath('data.email', 'ana@example.com');

        $this->putJson('/api/v1/customers/me', ['name' => 'Ana B', 'phone' => '11999', 'password' => 'novasenha1', 'current_password' => 'x'], $h)
            ->assertUnprocessable();
        $this->putJson('/api/v1/customers/me', ['name' => 'Ana B', 'phone' => '11999', 'password' => 'novasenha1', 'current_password' => 'segredo123'], $h)
            ->assertOk()->assertJsonPath('data.phone', '11999');

        $this->postJson('/api/v1/customers/logout', [], $h)->assertNoContent();
        $this->getJson('/api/v1/customers/me', $h)->assertUnauthorized();
        $this->assertNotEmpty($body['token']);
    }

    public function test_customer_cannot_use_admin_and_admin_cannot_use_customer_api(): void
    {
        $this->assertFalse(\Illuminate\Support\Facades\Route::has('register'));
        $this->registerCustomer();
        $this->post('/login', ['email' => 'ana@example.com', 'password' => 'segredo123'])->assertSessionHasErrors();
        $this->assertGuest();

        $customerUser = User::where('email', 'ana@example.com')->first();
        $this->actingAs($customerUser)->get(route('clientes.index'))->assertRedirect(route('login'));
        $this->assertGuest();

        User::factory()->create(['email' => 'adm@example.com']);
        $this->postJson('/api/v1/customers/login', ['email' => 'adm@example.com', 'password' => 'password'], $this->api())
            ->assertUnprocessable();
    }

    public function test_admin_manages_customers_and_blocking_revokes_access(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post(route('clientes.store'), [
            'name' => 'Bia', 'email' => 'bia@example.com', 'password' => 'segredo123', 'is_active' => true,
        ])->assertRedirect(route('clientes.index'));
        $this->actingAs($admin)->post(route('clientes.store'), ['name' => 'Bia', 'email' => 'bia@example.com', 'password' => 'segredo123'])
            ->assertSessionHasErrors('email');
        $this->actingAs($admin)->get(route('clientes.index', ['busca' => 'bia']))->assertOk();

        $customer = Customer::firstOrFail();
        $token = $this->postJson('/api/v1/customers/login', ['email' => 'bia@example.com', 'password' => 'segredo123'], $this->api())->json('token');

        $this->actingAs($admin)->put(route('clientes.update', $customer), [
            'name' => 'Bia', 'email' => 'bia@example.com', 'is_active' => false,
        ])->assertRedirect(route('clientes.index'));
        $this->getJson('/api/v1/customers/me', $this->api() + ['X-Customer-Token' => $token])->assertUnauthorized();

        $this->actingAs($admin)->delete(route('clientes.destroy', $customer))->assertRedirect();
        $this->assertDatabaseMissing('users', ['email' => 'bia@example.com']);
        $this->assertDatabaseCount('customers', 0);
    }
}
