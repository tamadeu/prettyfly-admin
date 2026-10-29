<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerWishlistItem extends Model
{
    public const MAX_PER_CUSTOMER = 200;

    protected $fillable = ['customer_id', 'product_key', 'data'];

    protected function casts(): array
    {
        return ['data' => 'array'];
    }
}
