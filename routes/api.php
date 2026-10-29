<?php

use App\Http\Controllers\Api\V1\CatalogCategoryController;
use App\Http\Controllers\Api\V1\CatalogCollectionController;
use App\Http\Controllers\Api\V1\CatalogFooterController;
use App\Http\Controllers\Api\V1\CatalogHeaderController;
use App\Http\Controllers\Api\V1\CatalogPageController;
use App\Http\Controllers\Api\V1\CatalogProductController;
use App\Http\Controllers\Api\V1\CatalogSiteController;
use App\Http\Controllers\Api\V1\CustomerAuthController;
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

        Route::prefix('customers')->group(function (): void {
            Route::post('/register', [CustomerAuthController::class, 'register'])->middleware('throttle:10,1');
            Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:10,1');
            Route::middleware(AuthenticateCustomer::class)->group(function (): void {
                Route::post('/logout', [CustomerAuthController::class, 'logout']);
                Route::get('/me', [CustomerAuthController::class, 'me']);
                Route::put('/me', [CustomerAuthController::class, 'update']);
            });
        });
    });
