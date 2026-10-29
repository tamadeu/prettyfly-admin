<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeaderSetting extends Model
{
    public const VARIANTS = [
        'default' => 'Padrão (Fashion)',
        'active-wear' => 'Active Wear',
        'fashion-03' => 'Fashion 03',
        'fashion-04' => 'Fashion 04',
        'boutique-fashion' => 'Boutique Fashion',
    ];

    protected $fillable = [
        'variant',
        'logo_url',
        'menu',
        'topbar',
        'contact',
    ];

    protected function casts(): array
    {
        return ['menu' => 'array', 'topbar' => 'array', 'contact' => 'array'];
    }

    public static function current(): self
    {
        return static::query()->orderBy('id')->first() ?? new static(['variant' => 'default']);
    }

    public const SOCIAL_NETWORKS = [
        'twitter' => 'X (Twitter)',
        'facebook' => 'Facebook',
        'instagram' => 'Instagram',
        'tiktok' => 'TikTok',
        'linkedin' => 'LinkedIn',
    ];

    public static function defaultTopbar(): array
    {
        return [
            'enabled' => true,
            'background' => '#000000',
            'text_color' => '#ffffff',
            'autoplay' => false,
            'announcements' => [
                'Welcome to our store →',
                'Free shipping on orders over $150 →',
                'New arrivals just dropped →',
            ],
            'socials' => collect(array_keys(self::SOCIAL_NETWORKS))
                ->map(fn (string $network) => ['network' => $network, 'href' => '#'])
                ->all(),
            'show_currency' => true,
            'currencies' => ['Bangladesh USD $', 'Canada USD $', 'Germany USD $', 'Netherlands USD $', 'Norway USD $', 'United Kingdom USD $', 'United States USD $'],
            'show_language' => true,
            'languages' => ['English', 'Español', 'Português (brasil)', 'Français'],
        ];
    }

    public static function defaultContact(): array
    {
        return [
            'enabled' => true,
            'label' => 'Need help? Call Us:',
            'phone' => '+84 2500 888 33',
        ];
    }

    public static function defaultMenu(): array
    {
        return json_decode(file_get_contents(database_path('data/default-header-menu.json')), true) ?? [];
    }
}
