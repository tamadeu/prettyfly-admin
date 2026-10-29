<?php

namespace Tests\Feature;

use App\Models\ApplicationSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApplicationSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_users_can_view_application_settings(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('settings.application.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/application', false)
                ->where('settings.primary_color', '#2f2f6b'));
    }

    public function test_authenticated_users_can_update_application_settings(): void
    {
        $settings = [
            'application_name' => 'Minha Aplicação',
            'primary_color' => '#112233',
            'secondary_color' => '#445566',
            'tertiary_color' => '#778899',
        ];

        $this->actingAs(User::factory()->create())
            ->put(route('settings.application.update'), $settings)
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas(ApplicationSetting::class, $settings);
    }

    public function test_colors_must_be_valid_hexadecimal_values(): void
    {
        $this->actingAs(User::factory()->create())
            ->from(route('settings.application.edit'))
            ->put(route('settings.application.update'), [
                'application_name' => 'Minha Aplicação',
                'primary_color' => 'blue',
                'secondary_color' => '#445566',
                'tertiary_color' => '#778899',
            ])
            ->assertRedirect(route('settings.application.edit'))
            ->assertSessionHasErrors('primary_color');
    }
}
