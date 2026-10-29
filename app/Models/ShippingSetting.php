<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingSetting extends Model
{
    protected $fillable = ['enabled', 'environment', 'origin_postal_code', 'contact_email', 'token', 'services', 'free_shipping_enabled', 'free_shipping_minimum'];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean', 'token' => 'encrypted', 'services' => 'array', 'free_shipping_enabled' => 'boolean', 'free_shipping_minimum' => 'decimal:2'];
    }

    public function freeShippingPolicy(): ?array
    {
        return $this->enabled && $this->free_shipping_enabled && $this->free_shipping_minimum !== null
            ? ['minimum' => (float) $this->free_shipping_minimum] : null;
    }

    public static function current(): self
    {
        return static::find(1) ?? new static([
            'enabled' => false, 'environment' => 'sandbox', 'origin_postal_code' => '05083010',
            'contact_email' => '', 'services' => ['1', '2'],
            'free_shipping_enabled' => false, 'free_shipping_minimum' => null,
        ]);
    }
}
