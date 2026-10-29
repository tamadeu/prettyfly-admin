<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HeaderSetting;
use Illuminate\Http\JsonResponse;

class CatalogHeaderController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = HeaderSetting::current();

        return response()->json(['data' => [
            'variant' => $setting->variant,
            'logo_url' => $setting->logo_url,
            'menu' => $setting->menu,
            'topbar' => $setting->topbar,
            'contact' => $setting->contact,
        ]]);
    }
}
