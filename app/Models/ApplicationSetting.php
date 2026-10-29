<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationSetting extends Model
{
    protected $fillable = [
        'application_name',
        'primary_color',
        'secondary_color',
        'tertiary_color',
    ];

    public static function defaults(): array
    {
        return [
            'application_name' => config('app.name'),
            'primary_color' => '#2f2f6b',
            'secondary_color' => '#f0a451',
            'tertiary_color' => '#af3348',
        ];
    }

    public static function values(): array
    {
        return static::query()->first()?->only(array_keys(static::defaults()))
            ?? static::defaults();
    }
}
