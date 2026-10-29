<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionsTest extends TestCase
{
    use RefreshDatabase;

    private function product(string $name, Category $category, float $price, int $stock, array $attrs = [], ?string $brand = null): Product
    {
        $product = Product::create(['name' => $name, 'slug' => str($name)->slug(), 'category_id' => $category->id, 'is_active' => true, 'is_visible' => true]);
        $product->variants()->create(['name' => 'V', 'sku' => 'SKU-'.$product->id, 'price' => $price, 'stock' => $stock, 'attributes' => $attrs]);
        if ($brand) {
            $product->update(['brand_id' => Brand::firstOrCreate(['slug' => str($brand)->slug()], ['name' => $brand])->id]);
        }

        return $product;
    }

    private function apiAuth()
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        return $this->withHeader('Authorization', 'Bearer '.str_repeat('a', 40));
    }

    public function test_manual_collection_keeps_order_and_is_exposed_by_api(): void
    {
        $cat = Category::create(['name' => 'Top', 'slug' => 'top']);
        $a = $this->product('Alpha', $cat, 10, 1);
        $b = $this->product('Beta', $cat, 20, 1);
        $this->product('Gamma', $cat, 30, 1);

        $this->actingAs(User::factory()->create())->post(route('colecoes.store'), [
            'name' => 'Destaques', 'slug' => 'destaques', 'type' => 'manual', 'sort' => 'manual',
            'is_active' => true, 'product_ids' => [$b->id, $a->id],
        ])->assertRedirect();

        $response = $this->apiAuth()->getJson('/api/v1/collections/destaques/products')->assertOk();
        $this->assertSame(['Beta', 'Alpha'], collect($response->json('data'))->pluck('name')->all());
    }

    public function test_dynamic_collection_filters(): void
    {
        $top = Category::create(['name' => 'Top', 'slug' => 'top']);
        $leg = Category::create(['name' => 'Legging', 'slug' => 'legging']);
        $this->product('Top Rosa', $top, 50, 5, [['name' => 'Cor', 'value' => 'Rosa']], 'Nike');
        $this->product('Top Preto', $top, 150, 0, [['name' => 'Cor', 'value' => 'Preto']], 'Nike');
        $this->product('Legging Rosa', $leg, 80, 3, [['name' => 'Cor', 'value' => 'Rosa']], 'Adidas');

        $count = fn (array $rules) => Collection::create([
            'name' => 'x', 'slug' => 'x'.uniqid(), 'type' => 'dynamic', 'rules' => $rules, 'sort' => 'name',
        ])->productsQuery()->count();

        $this->assertSame(2, $count(['category_ids' => [$top->id]]));
        $this->assertSame(2, $count(['brand_ids' => [Brand::where('slug', 'nike')->value('id')]]));
        $this->assertSame(1, $count(['category_ids' => [$top->id], 'max_price' => 100]));
        $this->assertSame(2, $count(['in_stock' => true]));
        $this->assertSame(2, $count(['attributes' => [['name' => 'cor', 'value' => 'rosa']]]));
        $this->assertSame(1, $count(['name_contains' => 'Preto']));
        $this->assertSame(3, $count(['created_days' => 7]));

        $old = $this->product('Antigo', $top, 10, 1);
        $old->forceFill(['created_at' => now()->subDays(2)->setTime(23, 0)])->save();
        $this->assertSame(3, $count(['created_days' => 1]));
        $this->assertSame(3, $count(['created_days' => 2]));
        $this->assertSame(4, $count(['created_days' => 3]));
    }

    public function test_inactive_or_expired_collection_is_hidden_from_api(): void
    {
        Collection::create(['name' => 'Off', 'slug' => 'off', 'type' => 'manual', 'is_active' => false]);
        Collection::create(['name' => 'Old', 'slug' => 'old', 'type' => 'manual', 'ends_at' => now()->subDay()]);
        Collection::create(['name' => 'On', 'slug' => 'on', 'type' => 'manual']);

        $this->apiAuth()->getJson('/api/v1/collections')->assertOk()->assertJsonCount(1, 'data');
        $this->apiAuth()->getJson('/api/v1/collections/off')->assertNotFound();
    }

    public function test_validation_and_preview(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->post(route('colecoes.store'), [
            'name' => 'X', 'slug' => 'Bad Slug', 'type' => 'dynamic', 'sort' => 'newest', 'is_active' => true,
        ])->assertSessionHasErrors('slug');

        $cat = Category::create(['name' => 'Top', 'slug' => 'top']);
        $this->product('Top Rosa', $cat, 50, 5);
        $this->actingAs($user)->postJson(route('colecoes.preview'), ['rules' => ['category_ids' => [$cat->id]]])
            ->assertOk()->assertJson(['count' => 1]);
    }

    public function test_cms_form_lists_collections_and_section_keeps_collection(): void
    {
        $user = User::factory()->create();
        Collection::create(['name' => 'Verão', 'slug' => 'verao', 'type' => 'manual']);
        $page = \App\Models\CmsPage::create(['title' => 'Home', 'slug' => 'home', 'is_published' => true]);

        $this->actingAs($user)->get(route('cms.edit', $page))
            ->assertInertia(fn ($p) => $p->where('collections.0.slug', 'verao'));

        $this->actingAs($user)->put(route('cms.update', $page), [
            'title' => 'Home', 'slug' => 'home', 'is_published' => true,
            'sections' => [['type' => 'new_arrivals', 'is_active' => true, 'content' => ['collection' => 'verao']]],
        ])->assertRedirect();

        $this->assertSame('verao', $page->sections()->first()->content['collection']);
    }
}
