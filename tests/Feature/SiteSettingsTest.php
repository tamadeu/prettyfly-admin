<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_saves_without_duplicating_and_api_exposes_it(): void
    {
        $user = User::factory()->create();
        $payload = ['title' => 'PrettyFly', 'description' => 'Moda fitness', 'favicon_url' => 'https://x.test/f.png'];

        $this->actingAs($user)->put(route('site.update'), $payload)->assertRedirect();
        $this->actingAs($user)->put(route('site.update'), [...$payload, 'title' => 'Novo'])->assertRedirect();

        $this->assertSame(1, SiteSetting::count());

        config(['catalog.api_token' => str_repeat('a', 40)]);
        $this->getJson('/api/v1/site/settings', ['Authorization' => 'Bearer '.str_repeat('a', 40)])
            ->assertOk()->assertJsonPath('data.title', 'Novo')->assertJsonPath('data.favicon_url', 'https://x.test/f.png');
    }

    public function test_rejects_unsafe_favicon(): void
    {
        $this->actingAs(User::factory()->create())
            ->put(route('site.update'), ['favicon_url' => 'javascript:alert(1)'])
            ->assertSessionHasErrors('favicon_url');
    }
}
