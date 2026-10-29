<?php

use App\Http\Controllers\Api\V1\CatalogCategoryController;
use App\Http\Controllers\Api\V1\CatalogCollectionController;
use App\Http\Controllers\Api\V1\CatalogFooterController;
use App\Http\Controllers\Api\V1\CatalogHeaderController;
use App\Http\Controllers\Api\V1\CatalogPageController;
use App\Http\Controllers\Api\V1\CatalogProductController;
use App\Http\Controllers\Api\V1\CatalogSiteController;
use App\Http\Controllers\Api\V1\CustomerAddressController;
use App\Http\Controllers\Api\V1\CustomerAuthController;
use App\Http\Controllers\Api\V1\CustomerWishlistController;
use App\Http\Middleware\AuthenticateCatalogApi;
use App\Http\Middleware\AuthenticateCustomer;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware(['throttle:60,1', AuthenticateCatalogApi::class])
    ->group(function (): void {
        Route::get('/categories', [CatalogCategoryController::class, 'index']);
        Route::get('/categories/{slug}', [CatalogCategoryController::class, 'show']);
        Route::get('/categories/{slug}/products', [CatalogProductController::class, 'categoryProducts']);
        Route::get('/collections', [CatalogCollectionController::class, 'index']);
        Route::get('/collections/{slug}', [CatalogCollectionController::class, 'show']);
        Route::get('/collections/{slug}/products', [CatalogCollectionController::class, 'products']);
        Route::get('/site/settings', [CatalogSiteController::class, 'show']);
        Route::get('/site/footer', [CatalogFooterController::class, 'show']);
        Route::get('/site/header', [CatalogHeaderController::class, 'show']);
        Route::get('/pages/{slug}', [CatalogPageController::class, 'show']);
        Route::get('/products', [CatalogProductController::class, 'index']);
        Route::get('/products/{slug}', [CatalogProductController::class, 'show']);
    });

Route::prefix('v1/customers')
    ->middleware(AuthenticateCatalogApi::class)
    ->group(function (): void {
        Route::post('/register', [CustomerAuthController::class, 'register'])->middleware('throttle:customer-register');
        Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:customer-login');
        Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword'])->middleware('throttle:customer-forgot');
        Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword'])->middleware('throttle:customer-reset');
        Route::post('/verify-email', [CustomerAuthController::class, 'verifyEmail'])->middleware('throttle:customer-verify');

        Route::middleware(AuthenticateCustomer::class)->group(function (): void {
            Route::post('/email/resend', [CustomerAuthController::class, 'resendVerification'])->middleware('throttle:customer-resend');
            Route::post('/logout', [CustomerAuthController::class, 'logout']);
            Route::get('/me', [CustomerAuthController::class, 'me']);
            Route::put('/me', [CustomerAuthController::class, 'update']);
            Route::get('/me/addresses', [CustomerAddressController::class, 'index']);
            Route::post('/me/addresses', [CustomerAddressController::class, 'store']);
            Route::put('/me/addresses/{id}', [CustomerAddressController::class, 'update'])->whereNumber('id');
            Route::delete('/me/addresses/{id}', [CustomerAddressController::class, 'destroy'])->whereNumber('id');
            Route::get('/me/wishlist', [CustomerWishlistController::class, 'show']);
            Route::put('/me/wishlist', [CustomerWishlistController::class, 'sync']);
        });
    });
