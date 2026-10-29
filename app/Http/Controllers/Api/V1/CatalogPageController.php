<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CmsPage;
use App\Models\CmsSection;
use Illuminate\Http\JsonResponse;

class CatalogPageController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $page = CmsPage::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->json(['data' => [
            'slug' => $page->slug,
            'title' => $page->title,
            'meta_description' => $page->meta_description,
            'sections' => $page->sections()
                ->where('is_active', true)
                ->get()
                ->map(fn (CmsSection $section) => [
                    'id' => $section->id,
                    'type' => $section->type,
                    'content' => $section->content ?: (object) [],
                ])->values(),
        ]]);
    }
}
