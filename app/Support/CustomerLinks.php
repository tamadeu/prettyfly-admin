<?php

namespace App\Support;

use App\Models\User;

class CustomerLinks
{
    public const VERIFY_TTL_MINUTES = 60 * 24;

    public static function siteUrl(string $path, array $query = []): string
    {
        $base = rtrim((string) config('catalog.site_url'), '/');

        return $base.$path.($query ? '?'.http_build_query($query) : '');
    }

    public static function resetUrl(User $user, string $token): string
    {
        return self::siteUrl('/reset-password', ['token' => $token, 'email' => $user->email]);
    }

    public static function verifyUrl(User $user): string
    {
        $expires = now()->addMinutes(self::VERIFY_TTL_MINUTES)->timestamp;

        return self::siteUrl('/verificar-email', [
            'id' => $user->id,
            'expires' => $expires,
            'signature' => self::signature($user, $expires),
        ]);
    }

    public static function validSignature(User $user, int $expires, string $signature): bool
    {
        return $expires >= now()->timestamp && hash_equals(self::signature($user, $expires), $signature);
    }

    // Inclui o e-mail: trocar o e-mail invalida links antigos.
    private static function signature(User $user, int $expires): string
    {
        return hash_hmac('sha256', "{$user->id}|{$user->email}|{$expires}", (string) config('app.key'));
    }
}
