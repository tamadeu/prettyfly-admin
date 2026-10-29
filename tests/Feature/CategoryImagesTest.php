<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_images_are_saved_and_validated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('categorias.store'), [
            'name' => 'Leggings',
            'slug' => 'leggings',
            'thumbnail_url' => 'http://x.test/storage/cms/t.jpg',
            'hero_image_url' => '/storage/cms/h.jpg',
        ])->assertRedirect();

        $category = Category::where('slug', 'leggings')->firstOrFail();
        $this->assertSame('http://x.test/storage/cms/t.jpg', $category->thumbnail_url);
        $this->assertSame('/storage/cms/h.jpg', $category->hero_image_url);

        $this->actingAs($user)->put(route('categorias.update', $category), [
            'name' => 'Leggings',
            'slug' => 'leggings',
            'thumbnail_url' => 'javascript:alert(1)',
        ])->assertSessionHasErrors('thumbnail_url');
    }
}
