<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Product;
use App\Models\ShippingSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ShippingTest extends TestCase
{
    use RefreshDatabase;

    private function headers(string $guest = 'a'): array
    {
        config(['catalog.api_token' => str_repeat('t', 40)]);

        return ['Authorization' => 'Bearer '.str_repeat('t', 40), 'X-Cart-Token' => str_repeat($guest, 64)];
    }

    private function setupCart(): Cart
    {
        Http::preventStrayRequests();
        ShippingSetting::create(['id' => 1, 'enabled' => true, 'environment' => 'sandbox', 'origin_postal_code' => '05083010', 'contact_email' => 'integration@example.com', 'token' => 'test-secret', 'services' => ['1', '2']]);
        $product = Product::create(['name' => 'Blusa', 'slug' => 'blusa', 'is_active' => true, 'is_visible' => true]);
        $variant = $product->variants()->create(['name' => 'M', 'sku' => 'B-M', 'price' => 70, 'stock' => 10, 'weight' => .25, 'height' => 2, 'width' => 15, 'length' => 20]);
        $this->putJson('/api/v1/cart', ['version' => 0, 'owner' => 'guest', 'items' => [['productId' => $product->id, 'variantId' => $variant->id, 'quantity' => 2]], 'checkout' => ['postal_code' => '01001-000', 'country' => 'BR']], $this->headers())->assertOk();

        return Cart::firstOrFail();
    }

    private function rates(): array
    {
        return [
            ['id' => 1, 'name' => 'PAC', 'price' => 18.61, 'delivery_time' => 5, 'has_error' => false, 'company' => ['name' => 'Correios'], 'packages' => [['dimensions' => ['height' => 6, 'width' => 17, 'length' => 22], 'weight' => .5]]],
            ['id' => 2, 'name' => 'SEDEX', 'price' => 25.50, 'delivery_time' => 2, 'has_error' => false, 'company' => ['name' => 'Correios']],
        ];
    }

    private function quote(Cart $cart): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/cart/shipping', ['version' => $cart->fresh()->version, 'owner' => 'guest'], $this->headers());
    }

    private function select(Cart $cart, string $id = '1', ?string $quoteId = null): \Illuminate\Testing\TestResponse
    {
        $cart->refresh();

        return $this->postJson('/api/v1/cart/shipping/select', ['version' => $cart->version, 'owner' => 'guest', 'service_id' => $id, 'quote_id' => $quoteId ?? $cart->shipping['quote_id']], $this->headers());
    }

    public function test_quote_uses_catalog_and_configured_origin_and_persists_selection(): void
    {
        $cart = $this->setupCart();
        Http::fake(['sandbox.superfrete.com/*' => Http::response($this->rates())]);
        $this->quote($cart)->assertOk()->assertJsonPath('data.shipping.options.0.price', 18.61)->assertJsonPath('data.shipping.environment', 'sandbox');
        Http::assertSent(fn (Request $r) => $r->url() === 'https://sandbox.superfrete.com/api/v0/calculator'
            && $r->hasHeader('Authorization', 'Bearer test-secret') && $r->hasHeader('User-Agent', 'PrettyFly/1.0 (integration@example.com)')
            && $r['from']['postal_code'] === '05083010' && $r['to']['postal_code'] === '01001000'
            && $r['products'][0]['quantity'] === 2 && $r['products'][0]['weight'] === .25
            && $r['options']['insurance_value'] === 140 && $r['options']['use_insurance_value'] === true);
        $this->assertNotEmpty($cart->fresh()->shipping['options'][0]['packages']);
        $this->select($cart)->assertOk()->assertJsonPath('data.shipping.selected_id', '1');
        $this->getJson('/api/v1/cart', $this->headers())->assertOk()->assertJsonPath('data.shipping.selected_id', '1')->assertJsonMissingPath('data.shipping.fingerprint')->assertJsonMissingPath('data.shipping.options.0.packages');
        $this->getJson('/api/v1/cart', $this->headers('b'))->assertJsonPath('data.shipping', null);
        $this->quote($cart)->assertOk();
        Http::assertSentCount(1);
    }

    public function test_changes_to_cep_quantity_catalog_or_settings_invalidate_quotes(): void
    {
        $cart = $this->setupCart();
        Http::fake(['*' => Http::response($this->rates())]);
        $this->quote($cart)->assertOk();
        $this->select($cart)->assertOk();
        $this->putJson('/api/v1/cart', ['version' => $cart->fresh()->version, 'owner' => 'guest', 'checkout' => ['first_name' => 'Ana']], $this->headers())->assertOk()->assertJsonPath('data.shipping.selected_id', '1');
        $this->putJson('/api/v1/cart', ['version' => $cart->fresh()->version, 'owner' => 'guest', 'checkout' => ['postal_code' => '20020-050']], $this->headers())->assertOk()->assertJsonPath('data.shipping', null);
        $this->quote($cart)->assertOk();
        $items = $cart->fresh()->items;
        $items[0]['quantity'] = 3;
        $this->putJson('/api/v1/cart', ['version' => $cart->fresh()->version, 'owner' => 'guest', 'items' => $items], $this->headers())->assertOk()->assertJsonPath('data.shipping', null);
        $this->quote($cart)->assertOk();
        Product::first()->variants()->first()->update(['weight' => .5]);
        $this->getJson('/api/v1/cart', $this->headers())->assertJsonPath('data.shipping', null);
        $this->quote($cart)->assertOk();
        ShippingSetting::first()->update(['origin_postal_code' => '20020050']);
        $this->getJson('/api/v1/cart', $this->headers())->assertJsonPath('data.shipping', null);
    }

    public function test_expired_and_forged_quotes_are_rejected(): void
    {
        $cart = $this->setupCart();
        Http::fake(['*' => Http::response($this->rates())]);
        $this->quote($cart)->assertOk();
        $this->select($cart, '999')->assertUnprocessable();
        $this->select($cart, '1', '00000000-0000-4000-8000-000000000000')->assertStatus(409);
        $this->travel(11)->minutes();
        $this->select($cart)->assertStatus(409);
        $this->getJson('/api/v1/cart', $this->headers())->assertJsonPath('data.shipping', null);
    }

    public function test_missing_configuration_cep_or_measurements_does_not_call_provider(): void
    {
        $cart = $this->setupCart();
        ShippingSetting::first()->update(['enabled' => false]);
        $this->quote($cart)->assertServiceUnavailable();
        ShippingSetting::first()->update(['enabled' => true]);
        $cart->update(['checkout' => ['postal_code' => '123']]);
        $this->quote($cart)->assertUnprocessable();
        $cart->update(['checkout' => ['postal_code' => '01001000']]);
        Product::first()->variants()->first()->update(['weight' => null]);
        $this->quote($cart)->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_provider_errors_are_safe_and_unavailable_services_are_filtered(): void
    {
        $cart = $this->setupCart();
        Http::fake(['*' => Http::sequence()
            ->push(['error' => 'test-secret invalid token'], 401)
            ->push(['unexpected' => 'response'])
            ->push([
                ['id' => 1, 'name' => 'PAC', 'price' => 20, 'delivery_time' => 3, 'has_error' => true],
                ['id' => 2, 'name' => 'SEDEX', 'price' => -1, 'delivery_time' => 2],
                ['id' => 31, 'name' => 'Loggi', 'price' => 10, 'delivery_time' => 2],
            ])]);
        $this->quote($cart)->assertServiceUnavailable()->assertDontSee('test-secret');
        $this->quote($cart)->assertServiceUnavailable();
        $this->quote($cart)->assertOk()->assertJsonCount(0, 'data.shipping.options');
    }

    public function test_late_quote_cannot_overwrite_changed_cart(): void
    {
        $cart = $this->setupCart();
        Http::fake(function () use ($cart) {
            $cart->increment('version');

            return Http::response($this->rates());
        });
        $this->quote($cart)->assertStatus(409);
        $this->assertNull($cart->fresh()->shipping);
    }

    public function test_admin_settings_encrypt_token_and_preserve_it_when_left_blank(): void
    {
        $this->get('/configuracoes/frete')->assertRedirect('/login');
        $admin = User::factory()->create();
        $settings = ['enabled' => true, 'environment' => 'sandbox', 'origin_postal_code' => '05083-010', 'contact_email' => 'dev@example.com', 'token' => 'private-test-token', 'services' => ['1', '2']];
        $this->actingAs($admin)->put('/configuracoes/frete', $settings)->assertSessionHasNoErrors();
        $this->assertSame('private-test-token', ShippingSetting::first()->token);
        $this->assertNotSame('private-test-token', DB::table('shipping_settings')->value('token'));
        $this->actingAs($admin)->get('/configuracoes/frete')->assertOk()->assertDontSee('private-test-token');
        $this->actingAs($admin)->put('/configuracoes/frete', array_replace($settings, ['token' => '']))->assertSessionHasNoErrors();
        $this->assertSame('private-test-token', ShippingSetting::first()->token);
        $this->actingAs($admin)->put('/configuracoes/frete', array_replace($settings, ['environment' => 'production', 'token' => '']))->assertSessionHasErrors('token');
        $this->actingAs($admin)->put('/configuracoes/frete', array_replace($settings, ['contact_email' => 'invalid']))->assertSessionHasErrors('contact_email');
        $this->assertNull(session('_old_input.token'));
    }
}
