<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_view_products_and_variation_summaries(): void
    {
        $product = $this->createProduct();

        $this->actingAs(User::factory()->create())
            ->get(route('produtos.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index', false)
                ->where('products.data.0.id', $product->id)
                ->where('products.data.0.variants_count', 1)
                ->where('products.data.0.variants_sum_stock', 12)
                ->where('products.data.0.category.name', 'Roupas'));
    }

    public function test_products_can_be_searched_by_variant_sku_and_filtered_by_visibility(): void
    {
        $this->createProduct();
        $hidden = $this->createProduct([
            'name' => 'Tênis casual',
            'slug' => 'tenis-casual',
            'is_visible' => false,
            'variants' => [[
                'name' => 'Azul / 40',
                'sku' => 'TEN-002-AZ40',
            ]],
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('produtos.index', ['search' => 'TEN-002-AZ40', 'status' => 'hidden']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.total', 1)
                ->where('products.data.0.id', $hidden->id)
                ->where('filters.status', 'hidden'));
    }

    public function test_authenticated_users_can_create_update_and_delete_products_with_variants(): void
    {
        $data = $this->productData();

        $this->actingAs(User::factory()->create())
            ->post(route('produtos.store'), $data)
            ->assertRedirect(route('produtos.index'))
            ->assertSessionHasNoErrors();

        $product = Product::query()->where('slug', 'camiseta-basica')->firstOrFail();
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'sku' => 'CAM-M-AZUL',
            'weight' => '0.250',
            'width' => '30.00',
        ]);
        $this->assertSame(
            [['name' => 'Cor', 'value' => 'Azul'], ['name' => 'Tamanho', 'value' => 'M']],
            $product->variants()->firstOrFail()->attributes,
        );
        $this->assertDatabaseHas('product_specifications', [
            'product_id' => $product->id,
            'name' => 'Material',
            'value' => 'Algodão',
        ]);

        $variantId = $product->variants()->firstOrFail()->id;
        $this->put(route('produtos.update', $product), array_merge($data, [
            'name' => 'Camiseta premium',
            'slug' => 'camiseta-premium',
            'is_visible' => false,
            'variants' => [
                array_merge($data['variants'][0], [
                    'id' => $variantId,
                    'name' => 'Preta / G',
                    'sku' => 'CAM-G-PRETA',
                    'stock' => 8,
                ]),
                [
                    'name' => 'Branca / M',
                    'attributes' => [
                        ['name' => 'Cor', 'value' => 'Branca'],
                        ['name' => 'Tamanho', 'value' => 'M'],
                    ],
                    'sku' => 'CAM-M-BRANCA',
                    'price' => '84.90',
                    'stock' => 4,
                    'weight' => '',
                    'width' => '',
                    'height' => '',
                    'length' => '',
                ],
            ],
            'specifications' => [
                ['name' => 'Material', 'value' => 'Algodão orgânico'],
            ],
        ]))
            ->assertRedirect(route('produtos.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Camiseta premium',
            'is_visible' => false,
        ]);
        $this->assertDatabaseHas('product_variants', [
            'id' => $variantId,
            'sku' => 'CAM-G-PRETA',
            'stock' => 8,
        ]);
        $this->assertDatabaseCount('product_variants', 2);

        $this->delete(route('produtos.destroy', $product))
            ->assertRedirect(route('produtos.index'));

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        $this->assertDatabaseCount('product_variants', 0);
        $this->assertDatabaseCount('product_specifications', 0);
    }

    public function test_product_variants_and_specifications_must_be_valid_and_have_unique_skus(): void
    {
        $this->createProduct();

        $this->actingAs(User::factory()->create())
            ->from(route('produtos.create'))
            ->post(route('produtos.store'), $this->productData([
                'name' => '',
                'is_active' => 'not-a-bool',
                'variants' => [
                    [
                        'name' => '',
                        'attributes' => [
                            ['name' => 'Cor', 'value' => 'Azul'],
                            ['name' => 'cor', 'value' => 'Preto'],
                        ],
                        'sku' => 'CAM-M-AZUL',
                        'price' => '0',
                        'stock' => -1,
                        'weight' => '-1',
                        'width' => '',
                        'height' => '',
                        'length' => '',
                    ],
                    [
                        'name' => 'Outra',
                        'sku' => 'CAM-M-AZUL',
                        'price' => '10',
                        'stock' => 1,
                        'weight' => '',
                        'width' => '',
                        'height' => '',
                        'length' => '',
                    ],
                ],
                'specifications' => [
                    ['name' => 'Material', 'value' => 'Algodão'],
                    ['name' => 'material', 'value' => 'Poliéster'],
                ],
            ]))
            ->assertRedirect(route('produtos.create'))
            ->assertSessionHasErrors([
                'name',
                'is_active',
                'variants.0.name',
                'variants.0.price',
                'variants.0.stock',
                'variants.0.weight',
                'variants.0.attributes.1.name',
                'variants.1.sku',
                'specifications.1.name',
            ]);
    }

    public function test_product_form_receives_categories_and_existing_variants(): void
    {
        $product = $this->createProduct();

        $this->actingAs(User::factory()->create())
            ->get(route('produtos.edit', $product))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/form', false)
                ->has('categories', 1)
                ->has('product.variants', 1)
                ->where('product.variants.0.sku', 'CAM-M-AZUL')
                ->where('product.specifications.0.name', 'Material'));
    }

    public function test_product_and_variant_images_can_be_uploaded_and_removed(): void
    {
        Storage::fake('public');

        $data = $this->productData();
        $data['product_images'] = [
            UploadedFile::fake()->image('front.jpg', 800, 800),
            UploadedFile::fake()->image('side.jpg', 800, 800),
        ];
        $data['product_image_order'] = ['new:1', 'new:0'];
        $data['variants'][0]['images'] = [
            UploadedFile::fake()->image('blue-medium.png', 800, 800),
            UploadedFile::fake()->image('blue-medium-side.png', 800, 800),
        ];
        $data['variants'][0]['image_order'] = ['new:1', 'new:0'];

        $this->actingAs(User::factory()->create())
            ->post(route('produtos.store'), $data)
            ->assertRedirect(route('produtos.index'))
            ->assertSessionHasNoErrors();

        $product = Product::query()->where('slug', 'camiseta-basica')->firstOrFail();
        $variant = $product->variants()->firstOrFail();
        $productImage = $product->images()->firstOrFail();
        $variantImage = $variant->images()->firstOrFail();

        Storage::disk('public')->assertExists($productImage->path);
        Storage::disk('public')->assertExists($variantImage->path);
        $this->assertSame('side', $productImage->alt);
        $this->assertSame('blue-medium-side', $variantImage->alt);
        $this->assertSame([0, 1], $product->images()->pluck('sort_order')->all());
        $this->assertSame([0, 1], $variant->images()->pluck('sort_order')->all());

        $this->actingAs(User::factory()->create())
            ->get(route('produtos.edit', $product))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('product.images.0.url', Storage::disk('public')->url($productImage->path))
                ->where('product.variants.0.images.0.url', Storage::disk('public')->url($variantImage->path)));

        $this->actingAs(User::factory()->create())
            ->get(route('produtos.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.data.0.images.0.id', $productImage->id)
                ->where('products.data.0.images.0.alt', 'side'));

        $updateData = $this->productData();
        $updateData['variants'][0]['id'] = $variant->id;
        $updateData['remove_product_image_ids'] = $product->images()->pluck('id')->all();
        $updateData['product_images'] = [
            UploadedFile::fake()->image('back.jpg', 800, 800),
        ];
        $updateData['product_image_order'] = ['new:0'];
        $updateData['variants'][0]['remove_image_ids'] = $variant->images()->pluck('id')->all();
        $updateData['variants'][0]['images'] = [
            UploadedFile::fake()->image('blue-medium-back.jpg', 800, 800),
        ];
        $updateData['variants'][0]['image_order'] = ['new:0'];

        $this->post(route('produtos.update', $product), array_merge($updateData, [
            '_method' => 'put',
        ]))
            ->assertRedirect(route('produtos.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('product_images', 2);
        Storage::disk('public')->assertMissing($productImage->path);
        Storage::disk('public')->assertMissing($variantImage->path);
        Storage::disk('public')->assertExists($product->images()->firstOrFail()->path);
        Storage::disk('public')->assertExists($variant->images()->firstOrFail()->path);
    }

    private function createProduct(array $overrides = []): Product
    {
        $data = $this->productData($overrides);
        $product = Product::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'],
            'category_id' => $data['category_id'],
            'is_visible' => $data['is_visible'],
            'is_active' => $data['is_active'],
        ]);
        $product->variants()->create($data['variants'][0]);
        $product->specifications()->createMany($data['specifications']);

        return $product;
    }

    private function productData(array $overrides = []): array
    {
        $category = Category::query()->firstOrCreate(
            ['slug' => 'roupas'],
            ['name' => 'Roupas'],
        );

        return array_replace_recursive([
            'name' => 'Camiseta básica',
            'slug' => 'camiseta-basica',
            'description' => 'Camiseta de algodão.',
            'category_id' => $category->id,
            'is_visible' => true,
            'is_active' => true,
            'variants' => [
                [
                    'name' => 'Azul / M',
                    'attributes' => [
                        ['name' => 'Cor', 'value' => 'Azul'],
                        ['name' => 'Tamanho', 'value' => 'M'],
                    ],
                    'sku' => 'CAM-M-AZUL',
                    'price' => '79.90',
                    'stock' => 12,
                    'weight' => '0.250',
                    'width' => '30.00',
                    'height' => '4.00',
                    'length' => '25.00',
                ],
            ],
            'specifications' => [
                ['name' => 'Material', 'value' => 'Algodão'],
            ],
        ], $overrides);
    }
}
