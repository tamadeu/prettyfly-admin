<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;

class CatalogSiteController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => SiteSetting::current()->only(['title', 'description', 'favicon_url'])]);
    }
}
