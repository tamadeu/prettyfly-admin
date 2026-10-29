<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_manage_categories(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('categorias.store'), [
                'name' => 'Calçados',
                'slug' => 'calcados',
                'description' => 'Calçados para todas as ocasiões.',
            ])
            ->assertRedirect(route('categorias.index'))
            ->assertSessionHasNoErrors();

        $category = Category::query()->where('slug', 'calcados')->firstOrFail();

        $this->put(route('categorias.update', $category), [
            'name' => 'Tênis',
            'slug' => 'tenis',
            'description' => 'Tênis esportivos.',
        ])->assertRedirect(route('categorias.index'));

        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Tênis']);

        $this->delete(route('categorias.destroy', $category))
            ->assertRedirect(route('categorias.index'));
    }

    public function test_deleting_a_category_keeps_products_and_removes_the_category_reference(): void
    {
        $category = Category::create([
            'name' => 'Acessórios',
            'slug' => 'acessorios',
        ]);

        $product = Product::create([
            'name' => 'Bolsa',
            'slug' => 'bolsa',
            'category_id' => $category->id,
            'is_active' => true,
            'is_visible' => false,
        ]);

        $this->actingAs(User::factory()->create())
            ->delete(route('categorias.destroy', $category))
            ->assertRedirect(route('categorias.index'));

        $this->assertDatabaseHas('products', ['id' => $product->id, 'category_id' => null]);
    }
}
