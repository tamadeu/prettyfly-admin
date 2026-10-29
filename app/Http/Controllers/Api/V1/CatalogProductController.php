<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;

class CatalogProductController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:140'],
            'brand' => ['nullable', 'string', 'max:140'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $products = Product::query()
            ->where('is_active', true)
            ->where('is_visible', true)
            ->with([
                'category:id,name,slug,description',
                'brand',
                'images',
                'specifications',
                'variants.images',
            ])
            ->when($filters['q'] ?? null, fn ($query, $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('variants', fn ($variants) => $variants->where('sku', 'like', "%{$search}%"));
            }))
            ->when($filters['category'] ?? null, fn ($query, $slug) => $query->whereHas(
                'category',
                fn ($category) => $category->where('slug', $slug),
            ))
            ->when($filters['brand'] ?? null, fn ($query, $slug) => $query->whereHas(
                'brand',
                fn ($brand) => $brand->where('slug', $slug),
            ))
            ->latest()
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return ProductResource::collection($products);
    }

    public function show(string $slug): ProductResource
    {
        $product = Product::query()
            ->where('is_active', true)
            ->where('is_visible', true)
            ->where('slug', $slug)
            ->with([
                'category:id,name,slug,description',
                'brand',
                'images',
                'specifications',
                'variants.images',
            ])
            ->firstOrFail();

        return ProductResource::make($product);
    }

    public function categoryProducts(Request $request, string $slug)
    {
        $filters = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $category = Category::query()
            ->where('slug', $slug)
            ->whereHas('products', fn ($products) => $products
                ->where('is_active', true)
                ->where('is_visible', true))
            ->firstOrFail();

        $products = Product::query()
            ->where('is_active', true)
            ->where('is_visible', true)
            ->where('category_id', $category->id)
            ->with([
                'category:id,name,slug,description',
                'brand',
                'images',
                'specifications',
                'variants.images',
            ])
            ->when($filters['q'] ?? null, fn ($query, $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('variants', fn ($variants) => $variants->where('sku', 'like', "%{$search}%"));
            }))
            ->latest()
            ->paginate($filters['per_page'] ?? 20)
            ->withQueryString();

        return ProductResource::collection($products);
    }
}
