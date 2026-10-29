<?php

namespace Tests\Feature;

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_verified_users_can_view_the_sales_dashboard(): void
    {
        $user = User::factory()->make();

        $this->actingAs($user)
            ->get(route('dashboard.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('dashboard/index', false));
    }
}
