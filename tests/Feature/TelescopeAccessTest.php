<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\Http\Middleware\Authorize;
use Tests\TestCase;

class TelescopeAccessTest extends TestCase
{
    public function test_telescope_routes_require_authentication(): void
    {
        $this->assertSame([
            'web',
            'auth',
            Authorize::class,
        ], config('telescope.middleware'));
    }

    public function test_only_admins_can_view_telescope(): void
    {
        $admin = new User;
        $admin->type = User::TYPE_ADMIN;

        $customer = new User;
        $customer->type = User::TYPE_CUSTOMER;

        $this->assertTrue(Gate::forUser($admin)->allows('viewTelescope'));
        $this->assertFalse(Gate::forUser($customer)->allows('viewTelescope'));
    }
}
