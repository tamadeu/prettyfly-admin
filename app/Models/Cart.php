<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cart extends Model
{
    protected $fillable = ['user_id', 'guest_token_hash', 'items', 'checkout', 'version', 'shipping'];

    protected $hidden = ['guest_token_hash'];

    protected function casts(): array
    {
        return ['items' => 'array', 'checkout' => 'array', 'version' => 'integer', 'shipping' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
