<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CustomerToken;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return $this->handle($request, false);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->handle($request, true);
    }

    private function handle(Request $request, bool $write): JsonResponse
    {
        $plain = $request->header('X-Cart-Token', '');
        abort_unless(is_string($plain) && preg_match('/^[a-f0-9]{64}$/', $plain), 422, 'Identificador do carrinho inválido.');
        $user = null;
        if ($request->hasHeader('X-Customer-Token')) {
            $user = CustomerToken::findValid($request->header('X-Customer-Token'))?->user;
            abort_unless($user?->isCustomer() && $user->customer?->is_active, 401, 'Sessão inválida.');
        }
        $data = $write ? $request->validate([
            'version' => ['required', 'integer', 'min:0'],
            'owner' => ['required', 'string', 'max:80'],
            'items' => ['sometimes', 'array', 'list', 'max:100'],
            'items.*.productId' => ['required', 'integer', 'min:1'],
            'items.*.variantId' => ['required', 'integer', 'min:1', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'checkout' => ['sometimes', 'array:first_name,last_name,country,postal_code,street,number,complement,neighborhood,city,state,phone,email,notes'],
            ...collect(['first_name' => 100, 'last_name' => 150, 'country' => 2, 'postal_code' => 9, 'street' => 255, 'number' => 30, 'complement' => 150, 'neighborhood' => 150, 'city' => 150, 'state' => 2, 'phone' => 30, 'email' => 254, 'notes' => 2000])
                ->mapWithKeys(fn ($max, $key) => ["checkout.$key" => ['sometimes', 'nullable', 'string', "max:$max"]])->all(),
        ]) : [];

        try {
            return DB::transaction(function () use ($plain, $user, $data, $write) {
                // Serializa criação/união para a mesma conta; o índice único protege visitantes.
                if ($user) {
                    User::whereKey($user->id)->lockForUpdate()->first();
                }
                $hash = hash('sha256', $plain);
                $guest = Cart::whereNull('user_id')->where('guest_token_hash', $hash)->lockForUpdate()->first();
                $cart = $user ? Cart::where('user_id', $user->id)->lockForUpdate()->first() : $guest;
                if ($user && $guest) {
                    if ($cart) {
                        $items = collect($cart->items)->keyBy('variantId');
                        foreach ($guest->items as $item) {
                            $item['quantity'] = min(99, $item['quantity'] + ($items->get($item['variantId'])['quantity'] ?? 0));
                            $items->put($item['variantId'], $item);
                        }
                        $cart->update(['items' => $items->values()->all(), 'checkout' => array_replace($cart->checkout ?? [], $guest->checkout ?? []), 'version' => $cart->version + 1]);
                        $guest->delete();
                    } else {
                        $guest->update(['user_id' => $user->id, 'guest_token_hash' => null, 'version' => $guest->version + 1]);
                        $cart = $guest;
                    }
                }
                $owner = $user ? 'customer:'.$user->id : 'guest';
                if ($write) {
                    if ($data['owner'] !== $owner || ($cart?->version ?? 0) !== $data['version']) {
                        return response()->json(['message' => 'O carrinho foi alterado em outra sessão. Recarregue para continuar.', 'data' => $this->payload($cart, $owner)], 409);
                    }
                    $items = array_key_exists('items', $data) ? $this->items($data['items']) : ($cart?->items ?? []);
                    if ($cart || count($items)) {
                        $cart ??= new Cart(['user_id' => $user?->id, 'guest_token_hash' => $user ? null : $hash]);
                        $cart->fill(['items' => $items, 'checkout' => array_replace($cart->checkout ?? [], $data['checkout'] ?? []), 'version' => ($cart->version ?? 0) + 1])->save();
                    }
                }

                return response()->json(['data' => $this->payload($cart, $owner)]);
            }, 3);
        } catch (\Illuminate\Database\UniqueConstraintViolationException) {
            return response()->json(['message' => 'O carrinho foi alterado em outra sessão. Recarregue para continuar.'], 409);
        }
    }

    private function items(array $items): array
    {
        $variants = ProductVariant::with(['product.images', 'images'])->whereIn('id', array_column($items, 'variantId'))->get()->keyBy('id');

        return array_map(function ($item) use ($variants) {
            $variant = $variants->get($item['variantId']);
            $product = $variant?->product;
            if (! $product || $product->id != $item['productId'] || ! $product->is_active || ! $product->is_visible) {
                throw ValidationException::withMessages(['items' => 'Um produto não está mais disponível. Remova-o do carrinho para continuar.']);
            }

            // O rascunho não reserva estoque. Valores e descrições vêm sempre do catálogo.
            return [
                'productId' => (string) $product->id, 'variantId' => (string) $variant->id,
                'name' => $product->name, 'slug' => $product->slug,
                'image' => $variant->images->first()?->url ?? $product->images->first()?->url ?? '',
                'color' => $variant->name,
                'size' => collect($variant->attributes)->first(fn ($a) => preg_match('/tamanho|size/i', $a['name']))['value'] ?? '',
                'price' => (float) $variant->price, 'compareAtPrice' => null,
                'quantity' => $item['quantity'], 'vendor' => '',
            ];
        }, $items);
    }

    private function payload(?Cart $cart, string $owner): array
    {
        return ['id' => $cart?->id, 'version' => $cart?->version ?? 0, 'owner' => $owner, 'items' => $cart?->items ?? [], 'checkout' => (object) array_map(fn ($value) => $value ?? '', $cart?->checkout ?? [])];
    }
}
