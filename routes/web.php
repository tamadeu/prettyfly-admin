<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SiteSettingController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\CmsImageController;
use App\Http\Controllers\CmsPageController;
use App\Http\Controllers\FooterSettingController;
use App\Http\Controllers\HeaderSettingController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

if (config('app.env') === 'local') {
    Route::mailPreview();
}

/* Authentication routes */
Auth::routes([
    'register' => false,
    'verify' => config('template.enable_verification') ?? true,
]);
Route::get('/email/verified', [\App\Http\Controllers\Auth\VerificationController::class, 'verified'])->name('verification.verified');
Route::get('/password/resetSent', [\App\Http\Controllers\Auth\ForgotPasswordController::class, 'showPasswordMailSentPage'])->name('password.request.sent');
Route::get('/password/resetSuccess', [\App\Http\Controllers\Auth\ResetPasswordController::class, 'showResetSuccessPage'])->name('password.reset.success');

Route::middleware(config('template.enable_verification') ? ['auth', 'admin', 'verified', 'translations'] : ['auth', 'admin', 'translations'])->group(function () {
    Route::get('/', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard.index');
    Route::get('/perfil', [App\Http\Controllers\ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/perfil/nome', [App\Http\Controllers\ProfileController::class, 'updateName'])->name('profile.name.update');
    Route::put('/perfil/senha', [App\Http\Controllers\ProfileController::class, 'updatePassword'])->name('profile.password.update');
    Route::get('/configuracoes/frete', [\App\Http\Controllers\ShippingSettingsController::class, 'edit'])->name('settings.shipping.edit');
    Route::put('/configuracoes/frete', [\App\Http\Controllers\ShippingSettingsController::class, 'update'])->name('settings.shipping.update');
    Route::get('/configuracoes', [App\Http\Controllers\ApplicationSettingsController::class, 'edit'])->name('settings.application.edit');
    Route::put('/configuracoes', [App\Http\Controllers\ApplicationSettingsController::class, 'update'])->name('settings.application.update');
    Route::resource('produtos', ProductController::class)->except(['show']);
    Route::resource('marcas', BrandController::class)->parameters(['marcas' => 'marca'])->except(['show']);
    Route::get('/carrinhos', [\App\Http\Controllers\CartController::class, 'index'])->name('carts.index');
    Route::resource('clientes', \App\Http\Controllers\CustomerController::class)->parameters(['clientes' => 'cliente'])->except(['show']);
    Route::resource('categorias', CategoryController::class)->except(['show']);
    Route::get('/colecoes/produtos', [CollectionController::class, 'searchProducts'])->name('colecoes.products');
    Route::post('/colecoes/preview', [CollectionController::class, 'preview'])->name('colecoes.preview');
    Route::resource('colecoes', CollectionController::class)->parameters(['colecoes' => 'colecao'])->except(['show']);
    Route::get('/site-geral', [SiteSettingController::class, 'edit'])->name('site.edit');
    Route::put('/site-geral', [SiteSettingController::class, 'update'])->name('site.update');
    Route::get('/cabecalho', [HeaderSettingController::class, 'edit'])->name('header.edit');
    Route::put('/cabecalho', [HeaderSettingController::class, 'update'])->name('header.update');
    Route::get('/rodape', [FooterSettingController::class, 'edit'])->name('footer.edit');
    Route::put('/rodape', [FooterSettingController::class, 'update'])->name('footer.update');
    Route::post('/cms-imagens', [CmsImageController::class, 'store'])->name('cms.images.store');
    Route::resource('cms', CmsPageController::class)->parameters(['cms' => 'cm'])->except(['show']);
    Route::get('/design-system/buttons', fn () => Inertia::render('design-system/buttons'))->name('design-system.buttons');
    Route::get('/design-system/charts', fn () => Inertia::render('design-system/charts'))->name('design-system.charts');
    Route::get('/design-system/modals', fn () => Inertia::render('design-system/modals'))->name('design-system.modals');
    Route::get('/design-system/record-details', fn () => Inertia::render('design-system/record-details'))->name('design-system.record-details');
    Route::get('/design-system/tables', fn () => Inertia::render('design-system/tables'))->name('design-system.tables');
    Route::get('/design-system/forms', fn () => Inertia::render('design-system/forms'))->name('design-system.forms');
});
