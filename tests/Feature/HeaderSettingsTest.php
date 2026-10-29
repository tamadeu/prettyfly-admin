<?php

namespace Tests\Feature;

use App\Models\HeaderSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HeaderSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_header_can_be_saved_and_is_exposed_by_the_api(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        $topbar = ['enabled' => true, 'background' => '#111111', 'text_color' => '#ffffff', 'autoplay' => true,
            'announcements' => ['Oi'], 'socials' => [['network' => 'instagram', 'href' => 'https://instagram.com/x']],
            'show_currency' => false, 'currencies' => [], 'show_language' => true, 'languages' => ['Português']];

        $this->actingAs(User::factory()->create())
            ->put(route('header.update'), [
                'contact' => ['enabled' => true, 'label' => 'Fale conosco:', 'phone' => '+55 (11) 99999-0000'],
                'topbar' => $topbar,
                'variant' => 'active-wear',
                'logo_url' => '/storage/cms/logo.png',
                'menu' => [
                    ['label' => 'Loja', 'href' => '/shop', 'type' => 'link'],
                    ['label' => 'Mais', 'href' => '#', 'type' => 'dropdown', 'children' => [['label' => 'Blog', 'href' => '/blog']]],
                    ['label' => 'Mega', 'href' => '/shop', 'type' => 'megamenu', 'megaMenu' => [['title' => 'Col', 'links' => [['label' => 'A', 'href' => '/a']]]]],
                ],
            ])
            ->assertSessionHasNoErrors();

        $this->withToken(str_repeat('a', 40))
            ->getJson('/api/v1/site/header')
            ->assertOk()
            ->assertJsonPath('data.variant', 'active-wear')
            ->assertJsonPath('data.logo_url', '/storage/cms/logo.png')
            ->assertJsonPath('data.contact.phone', '+55 (11) 99999-0000')
            ->assertJsonPath('data.topbar.announcements.0', 'Oi')
            ->assertJsonPath('data.topbar.show_currency', false)
            ->assertJsonPath('data.menu.0.id', 'nav-1')
            ->assertJsonPath('data.menu.1.children.0.label', 'Blog')
            ->assertJsonPath('data.menu.2.megaMenu.0.links.0.href', '/a');
    }

    public function test_invalid_variant_and_unsafe_links_are_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->put(route('header.update'), [
                'variant' => 'nope',
                'topbar' => ['background' => 'red'],
                'contact' => ['phone' => 'abc'],
                'menu' => [['label' => 'X', 'href' => 'javascript:alert(1)', 'type' => 'link']],
            ])
            ->assertSessionHasErrors(['variant', 'menu.0.href', 'topbar.background', 'contact.phone']);

        $this->assertNull(HeaderSetting::query()->first());
    }

    public function test_api_returns_defaults_when_nothing_is_saved(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        $this->withToken(str_repeat('a', 40))
            ->getJson('/api/v1/site/header')
            ->assertOk()
            ->assertJsonPath('data.variant', 'default')
            ->assertJsonPath('data.menu', null);
    }
}
