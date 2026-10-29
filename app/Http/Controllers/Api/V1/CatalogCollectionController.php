<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Collection;
use Illuminate\Http\Request;

class CatalogCollectionController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Collection::query()->live()->orderBy('name')->get()->map(fn (Collection $c) => $this->payload($c)),
        ]);
    }

    public function show(string $slug)
    {
        return response()->json(['data' => $this->payload(Collection::query()->live()->where('slug', $slug)->firstOrFail())]);
    }

    public function products(Request $request, string $slug)
    {
        $perPage = $request->validate(['per_page' => ['nullable', 'integer', 'min:1', 'max:100']])['per_page'] ?? 20;
        $collection = Collection::query()->live()->where('slug', $slug)->firstOrFail();

        return ProductResource::collection(
            $collection->productsQuery()
                ->with(['category:id,name,slug,description', 'brand', 'images', 'specifications', 'variants.images'])
                ->paginate($perPage)
                ->withQueryString()
        );
    }

    private function payload(Collection $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'description' => $c->description,
            'hero_image_url' => $c->hero_image_url,
            'thumbnail_url' => $c->thumbnail_url,
        ];
    }
}
