<?php

namespace Tests\Feature;

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DesignSystemPagesTest extends TestCase
{
    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('design-system.tables'))
            ->assertRedirect(route('login'));
    }

    public function test_verified_users_can_view_the_design_system_pages(): void
    {
        $user = User::factory()->make();

        $this->actingAs($user)
            ->get(route('design-system.buttons'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/buttons', false));

        $this->actingAs($user)
            ->get(route('design-system.charts'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/charts', false));

        $this->actingAs($user)
            ->get(route('design-system.modals'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/modals', false));

        $this->actingAs($user)
            ->get(route('design-system.record-details'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/record-details', false));

        $this->actingAs($user)
            ->get(route('design-system.tables'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/tables', false));

        $this->actingAs($user)
            ->get(route('design-system.forms'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('design-system/forms', false));
    }
}
