<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use Illuminate\Http\JsonResponse;

class CatalogFooterController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => FooterSetting::current()->content]);
    }
}
