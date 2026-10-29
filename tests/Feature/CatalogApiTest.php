<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    private const API_TOKEN = 'test-catalog-api-token-that-is-at-least-32-characters';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('catalog.api_token', self::API_TOKEN);
    }

    public function test_catalog_api_requires_a_valid_bearer_token(): void
    {
        $this->getJson('/api/v1/products')
            ->assertUnauthorized()
            ->assertHeader('WWW-Authenticate', 'Bearer')
            ->assertJsonPath('message', 'Não autenticado.');

        $this->withToken('incorrect-token')
            ->getJson('/api/v1/categories')
            ->assertUnauthorized();

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/categories')
            ->assertOk();
    }

    public function test_catalog_api_fails_closed_when_no_token_is_configured(): void
    {
        Config::set('catalog.api_token', null);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/products')
            ->assertServiceUnavailable()
            ->assertJsonPath('message', 'A API do catálogo não está configurada.');
    }

    public function test_product_listing_exposes_only_active_visible_products_and_supports_filters(): void
    {
        $category = $this->createCategory();
        $published = $this->createProduct($category, [
            'name' => 'Camiseta azul',
            'slug' => 'camiseta-azul',
            'visible' => true,
            'active' => true,
            'sku' => 'CAM-AZUL-M',
        ]);
        $this->createProduct($category, [
            'name' => 'Produto oculto',
            'slug' => 'produto-oculto',
            'visible' => false,
            'active' => true,
            'sku' => 'OCULTO-001',
        ]);
        $this->createProduct($category, [
            'name' => 'Produto inativo',
            'slug' => 'produto-inativo',
            'visible' => true,
            'active' => false,
            'sku' => 'INATIVO-001',
        ]);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/products?q=CAM-AZUL&category=roupas&per_page=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $published->id)
            ->assertJsonPath('data.0.slug', 'camiseta-azul')
            ->assertJsonPath('data.0.variants.0.sku', 'CAM-AZUL-M')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_product_detail_includes_category_specifications_and_ordered_images(): void
    {
        $category = $this->createCategory();
        $product = $this->createProduct($category, [
            'name' => 'Tênis corrida',
            'slug' => 'tenis-corrida',
            'visible' => true,
            'active' => true,
            'sku' => 'TEN-CORRIDA-40',
        ]);
        $product->specifications()->create(['name' => 'Material', 'value' => 'Mesh']);
        $product->images()->create(['path' => 'products/tenis/cover.webp', 'alt' => 'Capa', 'sort_order' => 0]);
        $product->images()->create(['path' => 'products/tenis/side.webp', 'alt' => 'Lateral', 'sort_order' => 1]);
        $variant = $product->variants()->firstOrFail();
        $variant->update([
            'attributes' => [
                ['name' => 'Tamanho', 'value' => '40'],
                ['name' => 'Cor', 'value' => 'Preto'],
            ],
            'weight' => '0.450',
            'width' => '12.00',
            'height' => '10.00',
            'length' => '30.00',
        ]);
        $variant->images()->create(['path' => 'products/tenis/variant.webp', 'alt' => 'Variação', 'sort_order' => 0]);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/products/tenis-corrida')
            ->assertOk()
            ->assertJsonPath('data.category.slug', 'roupas')
            ->assertJsonPath('data.specifications.0.value', 'Mesh')
            ->assertJsonPath('data.images.0.alt', 'Capa')
            ->assertJsonPath('data.images.1.alt', 'Lateral')
            ->assertJsonPath('data.variants.0.attributes.0.value', '40')
            ->assertJsonPath('data.variants.0.logistics.weight_kg', '0.450')
            ->assertJsonPath('data.variants.0.images.0.alt', 'Variação');
    }

    public function test_categories_and_category_products_only_include_published_catalog_items(): void
    {
        $category = $this->createCategory();
        $this->createProduct($category, [
            'name' => 'Produto público',
            'slug' => 'produto-publico',
            'visible' => true,
            'active' => true,
            'sku' => 'PUBLICO-001',
        ]);
        $this->createProduct($category, [
            'name' => 'Produto não publicado',
            'slug' => 'produto-nao-publicado',
            'visible' => false,
            'active' => true,
            'sku' => 'PRIVADO-001',
        ]);
        $emptyCategory = Category::create(['name' => 'Sem produtos', 'slug' => 'sem-produtos']);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.products_count', 1);

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/categories/roupas')
            ->assertOk()
            ->assertJsonPath('data.slug', 'roupas');

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/categories/sem-produtos')
            ->assertNotFound();

        $this->withToken(self::API_TOKEN)
            ->getJson('/api/v1/categories/roupas/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'produto-publico');

        $this->assertDatabaseHas('categories', ['id' => $emptyCategory->id]);
    }

    private function createCategory(): Category
    {
        return Category::create([
            'name' => 'Roupas',
            'slug' => 'roupas',
            'description' => 'Roupas e acessórios.',
        ]);
    }

    private function createProduct(Category $category, array $attributes): Product
    {
        $product = Product::create([
            'name' => $attributes['name'],
            'slug' => $attributes['slug'],
            'description' => 'Descrição de '.$attributes['name'],
            'category_id' => $category->id,
            'is_visible' => $attributes['visible'],
            'is_active' => $attributes['active'],
        ]);
        $product->variants()->create([
            'name' => 'Padrão',
            'sku' => $attributes['sku'],
            'price' => '99.90',
            'stock' => 5,
            'attributes' => [],
            'weight' => null,
            'width' => null,
            'height' => null,
            'length' => null,
        ]);

        return $product;
    }
}
