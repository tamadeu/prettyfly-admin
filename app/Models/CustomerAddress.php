<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    public const MAX_PER_CUSTOMER = 10;

    protected $fillable = [
        'customer_id', 'label', 'recipient', 'zip', 'street', 'number', 'complement',
        'neighborhood', 'city', 'state', 'phone', 'is_default',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
