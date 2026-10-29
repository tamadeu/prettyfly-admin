<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingSetting extends Model
{
    protected $fillable = ['enabled', 'environment', 'origin_postal_code', 'contact_email', 'token', 'services'];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return ['enabled' => 'boolean', 'token' => 'encrypted', 'services' => 'array'];
    }

    public static function current(): self
    {
        return static::find(1) ?? new static([
            'enabled' => false, 'environment' => 'sandbox', 'origin_postal_code' => '05083010',
            'contact_email' => '', 'services' => ['1', '2'],
        ]);
    }
}
