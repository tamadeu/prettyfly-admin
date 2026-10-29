<?php

namespace Tests\Feature;

use App\Models\FooterSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FooterSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $override = []): array
    {
        return array_merge(FooterSetting::defaultContent(), ['copyright' => '© Minha loja'], $override);
    }

    public function test_footer_is_saved_once_and_exposed_by_the_api(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);
        $user = User::factory()->create();

        $this->actingAs($user)->put(route('footer.update'), $this->payload())->assertSessionHasNoErrors();
        $this->put(route('footer.update'), $this->payload(['show_payments' => false]))->assertSessionHasNoErrors();

        $this->assertSame(1, FooterSetting::query()->count());
        $this->withToken(str_repeat('a', 40))->getJson('/api/v1/site/footer')
            ->assertOk()
            ->assertJsonPath('data.copyright', '© Minha loja')
            ->assertJsonPath('data.show_payments', false)
            ->assertJsonPath('data.columns.0.title', 'Quick Links');
    }

    public function test_payment_images_are_saved(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        $this->actingAs(User::factory()->create())
            ->put(route('footer.update'), $this->payload(['payment_images' => [['src' => '/storage/cms/pix.png', 'alt' => 'Pix']]]))
            ->assertSessionHasNoErrors();

        $this->withToken(str_repeat('a', 40))->getJson('/api/v1/site/footer')
            ->assertJsonPath('data.payment_images.0.src', '/storage/cms/pix.png')
            ->assertJsonPath('data.payment_images.0.alt', 'Pix');

        $this->put(route('footer.update'), $this->payload(['payment_images' => [['src' => 'javascript:x', 'alt' => '']]]))
            ->assertSessionHasErrors('payment_images.0.src');
    }

    public function test_unsafe_links_and_bad_colors_are_rejected(): void
    {
        $payload = $this->payload(['background' => 'red']);
        $payload['columns'][0]['links'][0]['href'] = 'javascript:alert(1)';

        $this->actingAs(User::factory()->create())
            ->put(route('footer.update'), $payload)
            ->assertSessionHasErrors(['background', 'columns.0.links.0.href']);
    }

    public function test_api_returns_null_content_when_nothing_is_saved(): void
    {
        config(['catalog.api_token' => str_repeat('a', 40)]);

        $this->withToken(str_repeat('a', 40))->getJson('/api/v1/site/footer')
            ->assertOk()->assertJsonPath('data', null);
    }
}
