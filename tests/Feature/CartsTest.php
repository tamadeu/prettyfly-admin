<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerToken;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartsTest extends TestCase
{
    use RefreshDatabase;

    private function headers(string $guest = 'a', ?string $customer = null): array
    {
        config(['catalog.api_token' => str_repeat('t', 40)]);

        return ['Authorization' => 'Bearer '.str_repeat('t', 40), 'X-Cart-Token' => str_repeat($guest, 64)] + ($customer ? ['X-Customer-Token' => $customer] : []);
    }

    private function putCart(array $data, array $headers): \Illuminate\Testing\TestResponse
    {
        $user = isset($headers['X-Customer-Token']) ? CustomerToken::findValid($headers['X-Customer-Token'])?->user : null;

        return $this->putJson('/api/v1/cart', $data + ['owner' => $user ? 'customer:'.$user->id : 'guest'], $headers);
    }

    private function item(): array
    {
        $product = Product::create(['name' => 'Blusa', 'slug' => 'blusa', 'is_active' => true, 'is_visible' => true]);
        $variant = $product->variants()->create(['name' => 'Azul', 'sku' => 'BLUSA-M', 'price' => 70, 'stock' => 10, 'attributes' => [['name' => 'Tamanho', 'value' => 'M']]]);

        return ['productId' => (string) $product->id, 'variantId' => (string) $variant->id, 'quantity' => 2, 'price' => 0.01, 'name' => 'Falso'];
    }

    private function customer(): array
    {
        $user = User::factory()->create(['type' => User::TYPE_CUSTOMER]);
        Customer::create(['user_id' => $user->id, 'is_active' => true]);

        return [$user, CustomerToken::issue($user)];
    }

    public function test_guest_recovers_items_and_partial_checkout_and_can_empty_cart(): void
    {
        $h = $this->headers();
        $this->getJson('/api/v1/cart', $h)->assertOk()->assertJsonPath('data.id', null);
        $this->assertDatabaseCount('carts', 0);
        $this->putCart(['version' => 0, 'items' => [$this->item()]], $h)->assertOk()->assertJsonPath('data.items.0.price', 70)->assertJsonPath('data.items.0.name', 'Blusa')->assertJsonPath('data.items.0.size', 'M');
        $this->putCart(['version' => 1, 'checkout' => ['first_name' => 'Ana', 'email' => 'ana@', 'postal_code' => '010']], $h)->assertOk();
        $this->putCart(['version' => 2, 'checkout' => ['street' => 'Praça da Sé', 'number' => '10']], $h)->assertOk();
        $this->getJson('/api/v1/cart', $h)->assertJsonPath('data.checkout.first_name', 'Ana')->assertJsonPath('data.checkout.number', '10')->assertJsonCount(1, 'data.items');
        $this->assertDatabaseHas('carts', ['guest_token_hash' => hash('sha256', str_repeat('a', 64)), 'user_id' => null]);
        $this->getJson('/api/v1/cart', $this->headers('b'))->assertJsonPath('data.id', null);
        $this->putCart(['version' => 3, 'items' => []], $h)->assertOk()->assertJsonCount(0, 'data.items');
        $this->getJson('/api/v1/cart', $h)->assertJsonCount(0, 'data.items');
    }

    public function test_checkout_fields_can_be_cleared_and_are_returned_as_strings(): void
    {
        $h = $this->headers();
        $this->putCart(['version' => 0, 'items' => [$this->item()], 'checkout' => ['first_name' => 'Ana', 'notes' => 'Texto']], $h)->assertOk();
        $this->putCart(['version' => 1, 'checkout' => ['first_name' => '', 'notes' => '']], $h)->assertOk();
        $this->getJson('/api/v1/cart', $h)->assertOk()->assertJsonPath('data.checkout.first_name', '')->assertJsonPath('data.checkout.notes', '');
    }

    public function test_stale_write_does_not_overwrite_newer_data(): void
    {
        $h = $this->headers();
        $this->putCart(['version' => 0, 'items' => [$this->item()]], $h)->assertOk();
        $this->putCart(['version' => 1, 'checkout' => ['city' => 'São Paulo']], $h)->assertOk();
        $this->putCart(['version' => 1, 'items' => []], $h)->assertStatus(409);
        $this->getJson('/api/v1/cart', $h)->assertJsonCount(1, 'data.items')->assertJsonPath('data.checkout.city', 'São Paulo');
    }

    public function test_login_merges_once_and_guests_cannot_access_account_data(): void
    {
        [$user, $token] = $this->customer();
        $item = $this->item();
        $this->putCart(['version' => 0, 'items' => [$item]], $this->headers('b', $token))->assertOk();
        $this->putCart(['version' => 0, 'items' => [$item], 'checkout' => ['email' => 'ana@example.com']], $this->headers())->assertOk();
        $this->getJson('/api/v1/cart', $this->headers('a', $token))->assertOk()->assertJsonPath('data.items.0.quantity', 4)->assertJsonPath('data.checkout.email', 'ana@example.com');
        $this->getJson('/api/v1/cart', $this->headers('a', $token))->assertJsonPath('data.items.0.quantity', 4);
        $this->putCart(['owner' => 'guest', 'version' => 2, 'items' => []], $this->headers('a', $token))->assertStatus(409);
        $this->assertDatabaseCount('carts', 1);
        $this->assertDatabaseHas('carts', ['user_id' => $user->id, 'guest_token_hash' => null]);
        $this->getJson('/api/v1/cart', $this->headers())->assertJsonPath('data.id', null);
        $this->getJson('/api/v1/cart', $this->headers('c', $token))->assertJsonPath('data.checkout.email', 'ana@example.com');
        [, $other] = $this->customer();
        $this->getJson('/api/v1/cart', $this->headers('a', $other))->assertJsonPath('data.id', null);
    }

    public function test_guest_cart_is_claimed_and_invalid_sessions_are_rejected(): void
    {
        [$user, $token] = $this->customer();
        $this->putCart(['version' => 0, 'items' => [$this->item()]], $this->headers())->assertOk();
        $this->getJson('/api/v1/cart', $this->headers('a', $token))->assertOk()->assertJsonPath('data.owner', 'customer:'.$user->id);
        $user->customer->update(['is_active' => false]);
        $this->getJson('/api/v1/cart', $this->headers('a', $token))->assertUnauthorized();
        $this->getJson('/api/v1/cart', $this->headers('a', 'invalid'))->assertUnauthorized();
        $this->getJson('/api/v1/cart', $this->headers())->assertJsonPath('data.id', null);
    }

    public function test_invalid_items_and_unknown_checkout_fields_are_rejected(): void
    {
        $h = $this->headers();
        $item = $this->item();
        foreach ([['quantity' => 0], ['quantity' => 100], ['productId' => 999], ['variantId' => 999]] as $bad) {
            $this->putCart(['version' => 0, 'items' => [array_replace($item, $bad)]], $h)->assertUnprocessable();
        }
        $this->putCart(['version' => 0, 'items' => [$item, $item]], $h)->assertUnprocessable();
        $this->putCart(['version' => 0, 'items' => [$item], 'checkout' => ['payment' => 'bank']], $h)->assertUnprocessable();
        Product::first()->update(['is_visible' => false]);
        $this->putCart(['version' => 0, 'items' => [$item]], $h)->assertUnprocessable();
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_only_admin_can_view_carts(): void
    {
        $this->get('/carrinhos')->assertRedirect('/login');
        [$user] = $this->customer();
        $this->actingAs($user)->get('/carrinhos')->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->get('/carrinhos')->assertOk();
    }
}
