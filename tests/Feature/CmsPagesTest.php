<?php

namespace Tests\Feature;

use App\Models\CmsPage;
use App\Models\User;
use Database\Seeders\CmsHomeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CmsPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_manage_pages_and_sections(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('cms.store'), [
                'title' => 'Home',
                'slug' => 'home',
                'is_published' => true,
            ])
            ->assertSessionHasNoErrors();

        $page = CmsPage::query()->where('slug', 'home')->firstOrFail();

        $this->put(route('cms.update', $page), [
            'title' => 'Home',
            'slug' => 'home',
            'is_published' => true,
            'sections' => [
                ['type' => 'trust_badges', 'is_active' => true, 'content' => ['items' => [['title' => 'Frete']]]],
                ['type' => 'hero', 'is_active' => false, 'content' => ['slides' => []]],
            ],
        ])->assertSessionHasNoErrors();

        $this->assertSame(['trust_badges', 'hero'], $page->sections()->pluck('type')->all());

        $this->put(route('cms.update', $page), [
            'title' => 'Home',
            'slug' => 'home',
            'is_published' => true,
            'sections' => [['type' => 'unknown', 'is_active' => true]],
        ])->assertSessionHasErrors('sections.0.type');

        $this->delete(route('cms.destroy', $page))->assertRedirect(route('cms.index'));
        $this->assertDatabaseMissing('cms_pages', ['id' => $page->id]);
    }

    public function test_guests_cannot_access_cms(): void
    {
        $this->get(route('cms.index'))->assertRedirect(route('login'));
    }

    public function test_api_returns_only_active_sections_of_published_pages(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);
        $this->seed(CmsHomeSeeder::class);
        $page = CmsPage::query()->where('slug', 'home')->firstOrFail();
        $page->sections()->where('type', 'hero')->update(['is_active' => false]);

        $response = $this->withToken(str_repeat('a', 40))->getJson('/api/v1/pages/home');

        $response->assertOk()->assertJsonPath('data.slug', 'home');
        $types = collect($response->json('data.sections'))->pluck('type');
        $this->assertFalse($types->contains('hero'));
        $this->assertTrue($types->contains('trust_badges'));

        $page->update(['is_published' => false]);
        $this->withToken(str_repeat('a', 40))->getJson('/api/v1/pages/home')->assertNotFound();
    }

    public function test_users_can_upload_cms_images(): void
    {
        Storage::fake('public');

        $response = $this->actingAs(User::factory()->create())
            ->postJson(route('cms.images.store'), ['image' => UploadedFile::fake()->image('hero.jpg', 800, 600)])
            ->assertCreated();

        $this->assertStringContainsString('/cms/', $response->json('url'));
        Storage::disk('public')->assertExists('cms/'.basename($response->json('url')));
    }

    public function test_cms_image_upload_rejects_non_images_and_guests(): void
    {
        Storage::fake('public');

        $this->postJson(route('cms.images.store'), ['image' => UploadedFile::fake()->image('a.jpg')])
            ->assertUnauthorized();

        $this->actingAs(User::factory()->create())
            ->postJson(route('cms.images.store'), ['image' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')])
            ->assertJsonValidationErrors('image');
    }
}
