<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;

class CatalogCategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()
            ->whereHas('products', fn ($products) => $products
                ->where('is_active', true)
                ->where('is_visible', true))
            ->withCount(['products' => fn ($products) => $products
                ->where('is_active', true)
                ->where('is_visible', true)])
            ->orderBy('name')
            ->paginate(50);

        return CategoryResource::collection($categories);
    }

    public function show(string $slug): CategoryResource
    {
        $category = Category::query()
            ->where('slug', $slug)
            ->whereHas('products', fn ($products) => $products
                ->where('is_active', true)
                ->where('is_visible', true))
            ->withCount(['products' => fn ($products) => $products
                ->where('is_active', true)
                ->where('is_visible', true)])
            ->firstOrFail();

        return CategoryResource::make($category);
    }
}
