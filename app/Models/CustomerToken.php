<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CustomerToken extends Model
{
    public const TTL_DAYS = 30;

    protected $fillable = ['user_id', 'token_hash', 'last_used_at', 'expires_at'];

    protected function casts(): array
    {
        return ['last_used_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Retorna o token em texto puro; só o hash é guardado. */
    public static function issue(User $user): string
    {
        $plain = Str::random(64);

        static::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDays(self::TTL_DAYS),
        ]);

        return $plain;
    }

    public static function findValid(string $plain): ?self
    {
        return static::where('token_hash', hash('sha256', $plain))
            ->where('expires_at', '>', now())
            ->first();
    }
}
