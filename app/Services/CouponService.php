<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Collection as ProductCollection;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CouponService
{
    private const RESERVATION_MINUTES = 30;

    public function apply(Cart $cart, string $code, ?User $user): array
    {
        return DB::transaction(function () use ($cart, $code, $user): array {
            $coupon = Coupon::query()->whereRaw('UPPER(code) = ?', [mb_strtoupper(trim($code))])->lockForUpdate()->first();
            if (! $coupon) {
                $this->fail('code', 'Este cupom não existe.');
            }

            $quote = $this->quote($coupon, $cart);
            $usage = CouponUsage::query()->where('coupon_id', $coupon->id)->where('cart_id', $cart->id)->lockForUpdate()->first();
            $this->assertCapacity($coupon, $user, $usage);

            $this->releaseReservation($cart, $coupon->id);
            $cart->coupon_id = $coupon->id;
            $cart->save();

            $usage ??= new CouponUsage(['coupon_id' => $coupon->id, 'cart_id' => $cart->id]);
            $usage->fill([
                'user_id' => $user?->id, 'status' => CouponUsage::RESERVED,
                'discount_amount' => $quote['discount_amount'],
                'expires_at' => now()->addMinutes(self::RESERVATION_MINUTES), 'redeemed_at' => null,
            ])->save();

            return $quote;
        }, 3);
    }

    public function remove(Cart $cart): void
    {
        $this->releaseReservation($cart);
        $cart->coupon_id = null;
        $cart->save();
    }

    public function refreshReservation(Cart $cart, ?User $user): void
    {
        if (! $cart->coupon_id) return;

        try {
            $coupon = Coupon::query()->whereKey($cart->coupon_id)->lockForUpdate()->firstOrFail();
            $quote = $this->quote($coupon, $cart);
            $usage = CouponUsage::query()->where('coupon_id', $coupon->id)->where('cart_id', $cart->id)->lockForUpdate()->first();
            $this->assertCapacity($coupon, $user, $usage);
            $usage ??= new CouponUsage(['coupon_id' => $coupon->id, 'cart_id' => $cart->id]);
            $usage->fill([
                'user_id' => $user?->id, 'status' => CouponUsage::RESERVED,
                'discount_amount' => $quote['discount_amount'],
                'expires_at' => now()->addMinutes(self::RESERVATION_MINUTES), 'redeemed_at' => null,
            ])->save();
        } catch (ValidationException | \Illuminate\Database\Eloquent\ModelNotFoundException) {
            $this->releaseReservation($cart);
            $cart->coupon_id = null;
            $cart->save();
        }
    }

    public function snapshot(Cart $cart): ?array
    {
        if (! $cart->coupon_id) return null;
        $usage = CouponUsage::query()->where('coupon_id', $cart->coupon_id)->where('cart_id', $cart->id)
            ->where('status', CouponUsage::RESERVED)->where('expires_at', '>', now())->first();
        if (! $usage) return null;

        try {
            $coupon = Coupon::query()->active()->whereKey($cart->coupon_id)->firstOrFail();
            $quote = $this->quote($coupon, $cart);

            return [
                'code' => $coupon->code, 'name' => $coupon->name,
                'discount_type' => $coupon->discount_type, 'discount_value' => (float) $coupon->discount_value,
                'subtotal' => $quote['subtotal'], 'eligible_subtotal' => $quote['eligible_subtotal'],
                'discount_amount' => $quote['discount_amount'], 'expires_at' => $usage->expires_at?->toISOString(),
            ];
        } catch (ValidationException | \Illuminate\Database\Eloquent\ModelNotFoundException) {
            return null;
        }
    }

    public function quote(Coupon $coupon, Cart $cart): array
    {
        if (! $coupon->is_active) $this->fail('code', 'Este cupom está desativado.');
        if ($coupon->starts_at && $coupon->starts_at->isFuture()) $this->fail('code', 'Este cupom ainda não está válido.');
        if ($coupon->ends_at && $coupon->ends_at->isPast()) $this->fail('code', 'Este cupom expirou.');

        $items = collect($cart->items ?? []);
        if ($items->isEmpty()) $this->fail('code', 'Adicione produtos ao carrinho antes de aplicar um cupom.');

        $variantIds = $items->pluck('variantId')->filter()->map(fn ($id) => (int) $id)->all();
        $variants = ProductVariant::query()->with('product')->whereIn('id', $variantIds)->get()->keyBy(fn ($variant) => (string) $variant->id);
        $selectedProductIds = $coupon->products()->pluck('products.id')->map(fn ($id) => (int) $id)->all();
        $selectedCategoryIds = $coupon->categories()->pluck('categories.id')->map(fn ($id) => (int) $id)->all();
        $selectedCollectionIds = $coupon->collections()->pluck('collections.id')->map(fn ($id) => (int) $id)->all();
        $collectionProductIds = [];
        foreach (ProductCollection::query()->live()->whereIn('id', $selectedCollectionIds)->get() as $collection) {
            $collectionProductIds = array_merge($collectionProductIds, $collection->productsQuery()->pluck('products.id')->map(fn ($id) => (int) $id)->all());
        }

        $hasRestrictions = $selectedProductIds || $selectedCategoryIds || $selectedCollectionIds;
        $subtotal = 0.0;
        $eligibleSubtotal = 0.0;
        foreach ($items as $item) {
            $variant = $variants->get((string) ($item['variantId'] ?? ''));
            $product = $variant?->product;
            if (! $product || (string) $product->id !== (string) ($item['productId'] ?? '') || ! $product->is_active || ! $product->is_visible) {
                $this->fail('code', 'Um produto do carrinho não está mais disponível.');
            }

            $lineSubtotal = (float) $variant->price * max(0, (int) ($item['quantity'] ?? 0));
            $subtotal += $lineSubtotal;
            $eligible = ! $hasRestrictions
                || in_array((int) $product->id, $selectedProductIds, true)
                || in_array((int) $product->category_id, $selectedCategoryIds, true)
                || in_array((int) $product->id, $collectionProductIds, true);
            if ($eligible) $eligibleSubtotal += $lineSubtotal;
        }

        if ($subtotal < (float) $coupon->minimum_order) $this->fail('code', 'O pedido não atingiu o valor mínimo para este cupom.');
        if ($eligibleSubtotal <= 0) $this->fail('code', 'O cupom não se aplica aos produtos deste carrinho.');

        $discount = $coupon->discount_type === 'percentage'
            ? $eligibleSubtotal * (float) $coupon->discount_value / 100
            : (float) $coupon->discount_value;
        $discount = round(min($eligibleSubtotal, max(0, $discount)), 2);

        return [
            'code' => $coupon->code, 'discount_type' => $coupon->discount_type,
            'discount_value' => (float) $coupon->discount_value, 'subtotal' => round($subtotal, 2),
            'eligible_subtotal' => round($eligibleSubtotal, 2), 'discount_amount' => $discount,
        ];
    }

    private function assertCapacity(Coupon $coupon, ?User $user, ?CouponUsage $currentUsage): void
    {
        $base = CouponUsage::query()->where('coupon_id', $coupon->id)->where(function ($query) {
            $query->where('status', CouponUsage::REDEEMED)
                ->orWhere(fn ($reserved) => $reserved->where('status', CouponUsage::RESERVED)->where('expires_at', '>', now()));
        });
        if ($currentUsage && $currentUsage->status !== CouponUsage::REDEEMED) $base->where('id', '!=', $currentUsage->id);

        if ($coupon->usage_limit !== null && (clone $base)->count() >= $coupon->usage_limit) {
            $this->fail('code', 'Este cupom atingiu o limite de utilizações.');
        }
        if ($user && $coupon->per_customer_limit !== null) {
            $perCustomer = clone $base;
            $perCustomer->where('user_id', $user->id);
            if ($perCustomer->count() >= $coupon->per_customer_limit) $this->fail('code', 'Você atingiu o limite de utilizações deste cupom.');
        }
    }

    private function releaseReservation(Cart $cart, ?int $exceptCouponId = null): void
    {
        $query = CouponUsage::query()->where('cart_id', $cart->id)->where('status', CouponUsage::RESERVED);
        if ($exceptCouponId) $query->where('coupon_id', '!=', $exceptCouponId);
        $query->update(['status' => CouponUsage::RELEASED, 'expires_at' => now()]);
    }

    private function fail(string $key, string $message): never
    {
        throw ValidationException::withMessages([$key => $message]);
    }
}
