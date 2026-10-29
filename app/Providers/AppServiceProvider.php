<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Limites por endpoint e por IP do cliente (repassado pelo site em X-Forwarded-For).
        $limits = [
            'customer-login' => 10,
            'customer-register' => 10,
            'customer-forgot' => 5,
            'customer-reset' => 10,
            'customer-verify' => 20,
            'customer-resend' => 3,
        ];

        foreach ($limits as $name => $max) {
            RateLimiter::for($name, fn (Request $request) => Limit::perMinute($max)->by($name.'|'.$request->ip()));
        }
    }
}
