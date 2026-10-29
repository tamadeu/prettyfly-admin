<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['title', 'description', 'favicon_url'];

    public static function current(): self
    {
        return static::query()->orderBy('id')->first() ?? new static;
    }
}
