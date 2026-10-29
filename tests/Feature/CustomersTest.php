<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Notifications\CustomerResetPassword;
use App\Notifications\CustomerVerifyEmail;
use App\Support\CustomerLinks;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
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

    public function test_password_reset_flow_is_customer_only_and_does_not_leak_existence(): void
    {
        Notification::fake();
        $this->registerCustomer();
        $user = User::where('email', 'ana@example.com')->first();
        $admin = User::factory()->create(['email' => 'adm@example.com']);
        $oldToken = $this->postJson('/api/v1/customers/login', ['email' => 'ana@example.com', 'password' => 'segredo123'], $this->api())->json('token');

        $this->postJson('/api/v1/customers/forgot-password', ['email' => 'nao@existe.com'], $this->api())->assertOk();
        $this->postJson('/api/v1/customers/forgot-password', ['email' => 'adm@example.com'], $this->api())->assertOk();
        Notification::assertNothingSentTo($admin);

        $this->postJson('/api/v1/customers/forgot-password', ['email' => 'ana@example.com'], $this->api())->assertOk();
        $token = null;
        Notification::assertSentTo($user, CustomerResetPassword::class, function ($n) use ($user, &$token) {
            $mail = $n->toMail($user);
            $this->assertStringStartsWith(rtrim(config('catalog.site_url'), '/').'/reset-password?token=', $mail->actionUrl);
            parse_str(parse_url($mail->actionUrl, PHP_URL_QUERY), $q);
            $token = $q['token'];

            return true;
        });

        $this->postJson('/api/v1/customers/reset-password', ['token' => 'errado', 'email' => 'ana@example.com', 'password' => 'novasenha1'], $this->api())->assertUnprocessable();
        $this->postJson('/api/v1/customers/reset-password', ['token' => $token, 'email' => 'ana@example.com', 'password' => 'novasenha1'], $this->api())->assertOk();
        $this->postJson('/api/v1/customers/reset-password', ['token' => $token, 'email' => 'ana@example.com', 'password' => 'outrasenha1'], $this->api())->assertUnprocessable();

        $this->getJson('/api/v1/customers/me', $this->api() + ['X-Customer-Token' => $oldToken])->assertUnauthorized();
        $this->postJson('/api/v1/customers/login', ['email' => 'ana@example.com', 'password' => 'novasenha1'], $this->api())->assertOk();
    }

    public function test_admin_token_cannot_reset_a_customer_and_vice_versa(): void
    {
        Notification::fake();
        $this->registerCustomer();
        $customer = User::where('email', 'ana@example.com')->first();
        $token = Password::broker()->createToken($customer);

        $this->post('/password/reset', ['token' => $token, 'email' => 'ana@example.com', 'password' => 'hackeada123', 'password_confirmation' => 'hackeada123'])
            ->assertSessionHasErrors('email');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('segredo123', $customer->fresh()->password));
    }

    public function test_email_verification_flow(): void
    {
        Notification::fake();
        $this->registerCustomer();
        $user = User::where('email', 'ana@example.com')->first();
        Notification::assertSentTo($user, CustomerVerifyEmail::class);
        $this->assertNull($user->email_verified_at);

        $login = $this->postJson('/api/v1/customers/login', ['email' => 'ana@example.com', 'password' => 'segredo123'], $this->api());
        $login->assertJsonPath('data.email_verified', false);
        $h = $this->api() + ['X-Customer-Token' => $login->json('token')];
        $this->postJson('/api/v1/customers/email/resend', [], $h)->assertOk();
        Notification::assertSentToTimes($user, CustomerVerifyEmail::class, 2);

        parse_str(parse_url(CustomerLinks::verifyUrl($user), PHP_URL_QUERY), $q);
        $this->postJson('/api/v1/customers/verify-email', [...$q, 'signature' => 'forjada'], $this->api())->assertUnprocessable();
        $this->postJson('/api/v1/customers/verify-email', [...$q, 'expires' => $q['expires'] - 99999999], $this->api())->assertUnprocessable();
        $this->postJson('/api/v1/customers/verify-email', $q, $this->api())->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->getJson('/api/v1/customers/me', $h)->assertJsonPath('data.email_verified', true);

        // trocar o e-mail invalida links já emitidos
        $user->update(['email' => 'outro@example.com']);
        $this->postJson('/api/v1/customers/verify-email', $q, $this->api())->assertUnprocessable();
    }

    private function loggedHeaders(string $email = 'ana@example.com'): array
    {
        $this->registerCustomer($email);
        $token = $this->postJson('/api/v1/customers/login', ['email' => $email, 'password' => 'segredo123'], $this->api())->json('token');

        return $this->api() + ['X-Customer-Token' => $token];
    }

    private function addr(array $over = []): array
    {
        return $over + [
            'recipient' => 'Ana', 'zip' => '01310100', 'street' => 'Av. Paulista', 'number' => '1000',
            'neighborhood' => 'Bela Vista', 'city' => 'São Paulo', 'state' => 'sp',
        ];
    }

    public function test_addresses_crud_default_rules_and_isolation(): void
    {
        $h = $this->loggedHeaders();

        $this->postJson('/api/v1/customers/me/addresses', $this->addr(['zip' => '123']), $h)->assertUnprocessable()->assertJsonValidationErrors('zip');

        $first = $this->postJson('/api/v1/customers/me/addresses', $this->addr(), $h)->assertCreated()
            ->assertJsonPath('data.zip', '01310-100')->assertJsonPath('data.state', 'SP')->assertJsonPath('data.is_default', true)->json('data.id');
        $second = $this->postJson('/api/v1/customers/me/addresses', $this->addr(['number' => '2']), $h)->assertCreated()
            ->assertJsonPath('data.is_default', false)->json('data.id');

        $this->putJson("/api/v1/customers/me/addresses/$second", $this->addr(['is_default' => true]), $h)->assertOk();
        $list = $this->getJson('/api/v1/customers/me/addresses', $h)->json('data');
        $this->assertSame($second, $list[0]['id']);
        $this->assertCount(1, array_filter($list, fn ($a) => $a['is_default']));

        $other = $this->loggedHeaders('bia@example.com');
        $this->putJson("/api/v1/customers/me/addresses/$first", $this->addr(), $other)->assertNotFound();
        $this->deleteJson("/api/v1/customers/me/addresses/$first", [], $other)->assertNotFound();
        $this->getJson('/api/v1/customers/me/addresses', $other)->assertJsonCount(0, 'data');

        // apagar o padrão promove outro
        $this->deleteJson("/api/v1/customers/me/addresses/$second", [], $h)->assertNoContent();
        $this->getJson('/api/v1/customers/me/addresses', $h)->assertJsonPath('data.0.id', $first)->assertJsonPath('data.0.is_default', true);
    }

    public function test_wishlist_sync_replaces_and_is_per_customer(): void
    {
        $h = $this->loggedHeaders();
        $item = fn (string $id) => ['productId' => $id, 'name' => 'P '.$id, 'slug' => 'p-'.$id, 'price' => 10.5, 'compareAtPrice' => null, 'image' => 'x.jpg', 'colors' => [['name' => 'Preto', 'value' => '#000']]];

        $this->putJson('/api/v1/customers/me/wishlist', ['items' => [$item('1'), $item('aw-2'), $item('1')]], $h)
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('data.1.productId', 'aw-2');
        $this->putJson('/api/v1/customers/me/wishlist', ['items' => [$item('aw-2')]], $h)->assertJsonCount(1, 'data');
        $this->putJson('/api/v1/customers/me/wishlist', ['items' => [['productId' => 'x']]], $h)->assertUnprocessable();
        $this->putJson('/api/v1/customers/me/wishlist', ['items' => []], $h)->assertJsonCount(0, 'data');

        $this->putJson('/api/v1/customers/me/wishlist', ['items' => [$item('9')]], $h);
        $this->getJson('/api/v1/customers/me/wishlist', $this->loggedHeaders('bia@example.com'))->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/customers/me/wishlist', $h)->assertJsonCount(1, 'data');
    }

    public function test_resend_failure_exposes_cause_only_in_debug(): void
    {
        config([
            'catalog.api_token' => str_repeat('a', 40),
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => '127.0.0.1',
            'mail.mailers.smtp.port' => 1,
            'mail.mailers.smtp.timeout' => 2,
        ]);
        $api = ['Authorization' => 'Bearer '.str_repeat('a', 40)];
        $token = $this->postJson('/api/v1/customers/register', [
            'name' => 'Ana', 'email' => 'ana-fail@example.test', 'password' => 'senha-forte-123',
        ], $api)->json('token');
        $h = $api + ['X-Customer-Token' => $token];

        config(['app.debug' => true]);
        $this->postJson('/api/v1/customers/email/resend', [], $h)
            ->assertStatus(503)->assertJsonStructure(['message', 'debug']);

        config(['app.debug' => false]);
        $this->postJson('/api/v1/customers/email/resend', [], $h)
            ->assertStatus(503)->assertJsonMissingPath('debug');
    }
}
