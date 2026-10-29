<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Collection extends Model
{
    public const TYPES = ['manual', 'dynamic'];

    public const SORTS = ['manual', 'newest', 'oldest', 'price_asc', 'price_desc', 'name'];

    protected $fillable = [
        'name', 'slug', 'description', 'hero_image_url', 'thumbnail_url',
        'type', 'rules', 'sort', 'is_active', 'starts_at', 'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'rules' => 'array',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot('position')->orderByPivot('position');
    }

    public function scopeLive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }

    public function isLive(): bool
    {
        return $this->is_active
            && (! $this->starts_at || $this->starts_at->isPast())
            && (! $this->ends_at || $this->ends_at->isFuture());
    }

    /** Active and visible products belonging to this collection, already sorted. */
    public function productsQuery(): Builder
    {
        $query = Product::query()->where('is_active', true)->where('is_visible', true);

        if ($this->type === 'manual') {
            $query->whereIn('products.id', $this->products()->pluck('products.id'));
        } else {
            self::applyRules($query, $this->rules ?? []);
        }

        return $this->applySort($query);
    }

    public static function applyRules(Builder $query, array $rules): Builder
    {
        if (! empty($rules['category_ids'])) {
            $query->whereIn('category_id', $rules['category_ids']);
        }

        if (! empty($rules['brand_ids'])) {
            $query->whereIn('brand_id', $rules['brand_ids']);
        }

        if (isset($rules['min_price']) && $rules['min_price'] !== '') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '>=', $rules['min_price']));
        }

        if (isset($rules['max_price']) && $rules['max_price'] !== '') {
            $query->whereHas('variants', fn ($v) => $v->where('price', '<=', $rules['max_price']));
        }

        if (! empty($rules['in_stock'])) {
            $query->whereHas('variants', fn ($v) => $v->where('stock', '>', 0));
        }

        if (! empty($rules['name_contains'])) {
            $query->where('name', 'like', '%'.$rules['name_contains'].'%');
        }

        if (! empty($rules['created_days'])) {
            $query->where('products.created_at', '>=', now()->subDays((int) $rules['created_days'] - 1)->startOfDay());
        }

        foreach ($rules['attributes'] ?? [] as $attribute) {
            $name = mb_strtolower($attribute['name'] ?? '');
            $value = mb_strtolower($attribute['value'] ?? '');
            if ($name === '' || $value === '') {
                continue;
            }

            $ids = ProductVariant::query()->get(['product_id', 'attributes'])
                ->filter(fn ($variant) => collect($variant->getAttribute("attributes") ?? [])->contains(
                    fn ($a) => mb_strtolower($a['name'] ?? '') === $name && mb_strtolower((string) ($a['value'] ?? '')) === $value
                ))
                ->pluck('product_id')->unique()->values();

            $query->whereIn('products.id', $ids);
        }

        return $query;
    }

    private function applySort(Builder $query): Builder
    {
        $minPrice = ProductVariant::query()->selectRaw('min(price)')->whereColumn('product_id', 'products.id');

        return match ($this->sort) {
            'manual' => $this->type === 'manual'
                ? $query->orderBy(
                    \DB::table('collection_product')->select('position')
                        ->whereColumn('product_id', 'products.id')->where('collection_id', $this->id)
                )
                : $query->latest('products.created_at'),
            'oldest' => $query->oldest('products.created_at'),
            'price_asc' => $query->orderBy($minPrice),
            'price_desc' => $query->orderByDesc($minPrice),
            'name' => $query->orderBy('name'),
            default => $query->latest('products.created_at'),
        };
    }
}
