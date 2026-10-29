<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSetting extends Model
{
    protected $fillable = ['content'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public static function current(): self
    {
        return static::query()->orderBy('id')->first() ?? new static;
    }

    public static function defaultContent(): array
    {
        return [
            'background' => '#f7f8fc',
            'about_title' => 'About us',
            'about_text' => 'The exciting contemporary brand Suruchi is known for its attention to detail and premium graphics.',
            'socials' => collect(array_keys(HeaderSetting::SOCIAL_NETWORKS))
                ->map(fn (string $network) => ['network' => $network, 'href' => '#'])
                ->all(),
            'columns' => [
                ['title' => 'Quick Links', 'links' => [
                    ['label' => 'FAQ', 'href' => '/pages/faq'],
                    ['label' => 'Find store location', 'href' => '/pages/store-location'],
                    ['label' => 'Privacy Policy', 'href' => '/pages/privacy-policy'],
                    ['label' => 'Refund Policy', 'href' => '/pages/refund-policy'],
                    ['label' => 'Terms of Service', 'href' => '/pages/terms-of-service'],
                ]],
                ['title' => 'Company', 'links' => [
                    ['label' => 'Wishlist', 'href' => '/wishlist'],
                    ['label' => 'My account', 'href' => '/login'],
                    ['label' => 'Product compare', 'href' => '/compare'],
                    ['label' => 'Cart', 'href' => '/cart'],
                    ['label' => 'About us', 'href' => '/pages/about'],
                ]],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Newsletter',
            'newsletter_text' => 'Write your email first to know about any information.',
            'newsletter_placeholder' => 'Enter your email',
            'show_currency' => true,
            'currencies' => HeaderSetting::defaultTopbar()['currencies'],
            'show_language' => true,
            'languages' => HeaderSetting::defaultTopbar()['languages'],
            'copyright' => '© 2026, Powered by HookThemes',
            'show_payments' => true,
            'payment_images' => [],
            'payment_height' => 24,
        ];
    }
}
