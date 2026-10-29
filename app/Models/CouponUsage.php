<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CouponUsage extends Model
{
    public const RESERVED = 'reserved';
    public const REDEEMED = 'redeemed';
    public const RELEASED = 'released';

    protected $fillable = ['coupon_id', 'cart_id', 'user_id', 'status', 'discount_amount', 'expires_at', 'redeemed_at'];

    protected function casts(): array
    {
        return ['discount_amount' => 'decimal:2', 'expires_at' => 'datetime', 'redeemed_at' => 'datetime'];
    }

    public function coupon(): BelongsTo { return $this->belongsTo(Coupon::class); }
    public function cart(): BelongsTo { return $this->belongsTo(Cart::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
