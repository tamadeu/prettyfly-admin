<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Collection as ProductCollection;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\CustomerToken;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponsTest extends TestCase
{
    use RefreshDatabase;

    private function headers(string $guest = 'a', ?string $customer = null): array
    {
        config(['catalog.api_token' => str_repeat('t', 40)]);

        return ['Authorization' => 'Bearer '.str_repeat('t', 40), 'X-Cart-Token' => str_repeat($guest, 64)] + ($customer ? ['X-Customer-Token' => $customer] : []);
    }

    private function item(Product $product, float $price = 100): array
    {
        $variant = $product->variants()->create(['name' => 'Padrão', 'sku' => 'SKU-'.$product->id.'-'.uniqid(), 'price' => $price, 'stock' => 10]);

        return ['productId' => (string) $product->id, 'variantId' => (string) $variant->id, 'quantity' => 1];
    }

    private function createCart(array $items, array $headers): array
    {
        $this->putJson('/api/v1/cart', ['version' => 0, 'owner' => 'guest', 'items' => $items], $headers)->assertOk();

        return $this->getJson('/api/v1/cart', $headers)->assertOk()->json('data');
    }

    public function test_admin_can_create_coupon_and_scope_it_to_products_categories_and_collections(): void
    {
        $user = User::factory()->create();
        $category = Category::create(['name' => 'Fitness', 'slug' => 'fitness']);
        $product = Product::create(['name' => 'Legging', 'slug' => 'legging', 'category_id' => $category->id, 'is_active' => true, 'is_visible' => true]);
        $collection = ProductCollection::create(['name' => 'Novidades', 'slug' => 'novidades', 'type' => 'manual', 'is_active' => true]);
        $collection->products()->attach($product->id);

        $data = [
            'code' => 'fit10', 'name' => 'Fitness 10%', 'discount_type' => 'percentage', 'discount_value' => 10,
            'minimum_order' => 50, 'usage_limit' => 100, 'per_customer_limit' => 1, 'is_active' => true,
            'product_ids' => [$product->id], 'category_ids' => [$category->id], 'collection_ids' => [$collection->id],
        ];

        $this->actingAs($user)->post(route('cupons.store'), $data)->assertRedirect(route('cupons.index'))->assertSessionHasNoErrors();
        $coupon = Coupon::where('code', 'FIT10')->firstOrFail();
        $this->assertSame([$product->id], $coupon->products()->pluck('products.id')->all());
        $this->assertSame([$category->id], $coupon->categories()->pluck('categories.id')->all());
        $this->assertSame([$collection->id], $coupon->collections()->pluck('collections.id')->all());
        $this->actingAs($user)->get(route('cupons.index'))->assertOk();
    }

    public function test_coupon_applies_percentage_discount_to_eligible_products_only_and_can_be_removed(): void
    {
        $category = Category::create(['name' => 'Fitness', 'slug' => 'fitness']);
        $eligible = Product::create(['name' => 'Legging', 'slug' => 'legging', 'category_id' => $category->id, 'is_active' => true, 'is_visible' => true]);
        $other = Product::create(['name' => 'Camiseta', 'slug' => 'camiseta', 'is_active' => true, 'is_visible' => true]);
        $h = $this->headers();
        $cart = $this->createCart([$this->item($eligible, 100), $this->item($other, 50)], $h);
        $coupon = Coupon::create(['code' => 'FIT10', 'name' => 'Fitness', 'discount_type' => 'percentage', 'discount_value' => 10, 'minimum_order' => 100, 'is_active' => true]);
        $coupon->categories()->attach($category->id);

        $response = $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'guest', 'code' => 'fit10'], $h)
            ->assertOk()->assertJsonPath('data.coupon.code', 'FIT10')->assertJsonPath('data.discount', 10)->assertJsonPath('data.subtotal', 150)->assertJsonPath('data.total', 140);
        $data = $response->json('data');
        $this->deleteJson('/api/v1/cart/coupon', ['version' => $data['version'], 'owner' => 'guest'], $h)
            ->assertOk()->assertJsonPath('data.coupon', null)->assertJsonPath('data.discount', 0)->assertJsonPath('data.total', 150);
    }

    public function test_fixed_discount_is_capped_at_eligible_subtotal_and_invalid_coupons_are_rejected(): void
    {
        $product = Product::create(['name' => 'Top', 'slug' => 'top', 'is_active' => true, 'is_visible' => true]);
        $h = $this->headers();
        $cart = $this->createCart([$this->item($product, 20)], $h);
        $coupon = Coupon::create(['code' => 'FIXED50', 'name' => 'R$ 50', 'discount_type' => 'fixed', 'discount_value' => 50, 'is_active' => true]);

        $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'guest', 'code' => $coupon->code], $h)
            ->assertOk()->assertJsonPath('data.discount', 20)->assertJsonPath('data.total', 0);
        $cart = $this->getJson('/api/v1/cart', $h)->json('data');
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'guest', 'code' => 'INVALID'], $h)->assertUnprocessable();
    }

    public function test_usage_limit_and_minimum_order_are_enforced_with_active_reservations(): void
    {
        $product = Product::create(['name' => 'Top', 'slug' => 'top', 'is_active' => true, 'is_visible' => true]);
        $coupon = Coupon::create(['code' => 'ONE', 'name' => 'Uso único', 'discount_type' => 'fixed', 'discount_value' => 5, 'minimum_order' => 100, 'usage_limit' => 1, 'is_active' => true]);
        $h1 = $this->headers('a');
        $cart1 = $this->createCart([$this->item($product, 50)], $h1);
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart1['version'], 'owner' => 'guest', 'code' => 'ONE'], $h1)->assertUnprocessable();
        $cart1 = $this->putJson('/api/v1/cart', ['version' => $cart1['version'], 'owner' => 'guest', 'items' => [$this->item($product, 150)]], $h1)->assertOk()->json('data');
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart1['version'], 'owner' => 'guest', 'code' => 'ONE'], $h1)->assertOk();
        $h2 = $this->headers('b');
        $cart2 = $this->createCart([$this->item($product, 150)], $h2);
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart2['version'], 'owner' => 'guest', 'code' => 'ONE'], $h2)->assertUnprocessable();
    }

    public function test_per_customer_limit_is_checked_against_existing_redemptions(): void
    {
        $product = Product::create(['name' => 'Top', 'slug' => 'top', 'is_active' => true, 'is_visible' => true]);
        $user = User::factory()->create(['type' => User::TYPE_CUSTOMER]);
        Customer::create(['user_id' => $user->id, 'is_active' => true]);
        $token = CustomerToken::issue($user);
        $coupon = Coupon::create(['code' => 'CUSTOMER1', 'name' => 'Um por cliente', 'discount_type' => 'percentage', 'discount_value' => 5, 'per_customer_limit' => 1, 'is_active' => true]);

        $h = $this->headers('c', $token);
        $cart = $this->createCart([$this->item($product)], $h);
        $otherCart = Cart::create(['user_id' => null, 'guest_token_hash' => hash('sha256', str_repeat('d', 64)), 'items' => [], 'version' => 1]);
        CouponUsage::create(['coupon_id' => $coupon->id, 'cart_id' => $otherCart->id, 'user_id' => $user->id, 'status' => CouponUsage::REDEEMED, 'discount_amount' => 5, 'redeemed_at' => now()]);

        $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'customer:'.$user->id, 'code' => 'CUSTOMER1'], $h)->assertUnprocessable();
    }

    public function test_future_and_expired_coupons_are_rejected(): void
    {
        $product = Product::create(['name' => 'Top', 'slug' => 'top', 'is_active' => true, 'is_visible' => true]);
        $h = $this->headers();
        $cart = $this->createCart([$this->item($product)], $h);
        $coupon = Coupon::create(['code' => 'FUTURE', 'name' => 'Futuro', 'discount_type' => 'percentage', 'discount_value' => 5, 'starts_at' => now()->addDay(), 'is_active' => true]);
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'guest', 'code' => $coupon->code], $h)->assertUnprocessable();
        $coupon->update(['starts_at' => null, 'ends_at' => now()->subDay(), 'code' => 'EXPIRED']);
        $cart = $this->getJson('/api/v1/cart', $h)->json('data');
        $this->postJson('/api/v1/cart/coupon', ['version' => $cart['version'], 'owner' => 'guest', 'code' => 'EXPIRED'], $h)->assertUnprocessable();
    }

    public function test_coupon_admin_routes_require_authentication(): void
    {
        $this->get(route('cupons.index'))->assertRedirect('/login');
        $this->actingAs(User::factory()->create())->get(route('cupons.index'))->assertOk();
    }
}
