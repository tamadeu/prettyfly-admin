<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BrandsTest extends TestCase
{
    use RefreshDatabase;

    public function test_crud_validation_and_nulling_on_delete(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('marcas.store'), [
            'name' => 'Nike', 'slug' => 'nike', 'logo_url' => 'https://x.test/l.png',
        ])->assertRedirect(route('marcas.index'));

        $this->actingAs($user)->post(route('marcas.store'), ['name' => 'Nike 2', 'slug' => 'nike'])
            ->assertSessionHasErrors('slug');
        $this->actingAs($user)->post(route('marcas.store'), ['name' => 'X', 'slug' => 'x', 'logo_url' => 'javascript:1'])
            ->assertSessionHasErrors('logo_url');

        $brand = Brand::where('slug', 'nike')->firstOrFail();
        $product = Product::create(['name' => 'P', 'slug' => 'p', 'brand_id' => $brand->id, 'is_active' => true, 'is_visible' => true]);

        $this->actingAs($user)->get(route('marcas.index'))->assertOk();
        $this->actingAs($user)->delete(route('marcas.destroy', $brand))->assertRedirect();
        $this->assertNull($product->fresh()->brand_id);
    }

    public function test_api_exposes_brand_and_filters_by_it(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);
        $h = ['Authorization' => 'Bearer '.str_repeat('a', 40)];
        $nike = Brand::create(['name' => 'Nike', 'slug' => 'nike']);
        Product::create(['name' => 'A', 'slug' => 'a', 'brand_id' => $nike->id, 'is_active' => true, 'is_visible' => true]);
        Product::create(['name' => 'B', 'slug' => 'b', 'is_active' => true, 'is_visible' => true]);

        $res = $this->getJson('/api/v1/products?brand=nike', $h)->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertSame('Nike', $res->json('data.0.brand.name'));
        $this->assertNull($this->getJson('/api/v1/products/b', $h)->json('data.brand'));
    }

    public function test_api_exposes_short_description(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);
        Product::create(['name' => 'A', 'slug' => 'a', 'description' => 'Longa', 'short_description' => 'Curta', 'is_active' => true, 'is_visible' => true]);

        $this->getJson('/api/v1/products/a', ['Authorization' => 'Bearer '.str_repeat('a', 40)])
            ->assertOk()->assertJsonPath('data.short_description', 'Curta')->assertJsonPath('data.description', 'Longa');
    }
}
