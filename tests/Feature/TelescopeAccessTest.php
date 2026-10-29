<?php

namespace Tests\Feature;

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
}
