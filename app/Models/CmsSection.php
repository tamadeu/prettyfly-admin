<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CmsSection extends Model
{
    public const TYPES = [
        'hero',
        'explore_categories',
        'promo_grid',
        'new_arrivals',
        'countdown',
        'tab_content',
        'testimonials',
        'video_banner',
        'shop_the_look',
        'instagram',
        'trust_badges',
    ];

    protected $fillable = [
        'cms_page_id',
        'type',
        'position',
        'is_active',
        'content',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'content' => 'array',
        ];
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(CmsPage::class, 'cms_page_id');
    }
}
