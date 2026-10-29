<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerWishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerWishlistController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->respond($request);
    }

    // Substitui a lista inteira; o site já envia a união entre a lista local e a da conta.
    public function sync(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['present', 'array', 'max:'.CustomerWishlistItem::MAX_PER_CUSTOMER],
            'items.*.productId' => ['required', 'string', 'max:120'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.slug' => ['required', 'string', 'max:255'],
            'items.*.price' => ['required', 'numeric'],
            'items.*.compareAtPrice' => ['nullable', 'numeric'],
            'items.*.image' => ['nullable', 'string', 'max:1000'],
            'items.*.image2' => ['nullable', 'string', 'max:1000'],
            'items.*.badge' => ['nullable', 'string', 'max:60'],
            'items.*.vendor' => ['nullable', 'string', 'max:255'],
            'items.*.colors' => ['nullable', 'array', 'max:30'],
            'items.*.colors.*.name' => ['nullable', 'string', 'max:60'],
            'items.*.colors.*.value' => ['nullable', 'string', 'max:60'],
        ]);

        $customer = $request->user()->customer;
        $items = collect($data['items'])->unique('productId')->values();

        DB::transaction(function () use ($customer, $items) {
            $customer->wishlistItems()->whereNotIn('product_key', $items->pluck('productId'))->delete();
            foreach ($items as $item) {
                $customer->wishlistItems()->updateOrCreate(['product_key' => $item['productId']], ['data' => $item]);
            }
        });

        return $this->respond($request);
    }

    private function respond(Request $request): JsonResponse
    {
        $items = $request->user()->customer->wishlistItems()->get()->pluck('data')->values();

        return new JsonResponse(['data' => $items]);
    }
}
