<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_settings', function (Blueprint $table) {
            $table->boolean('free_shipping_enabled')->default(false);
            $table->decimal('free_shipping_minimum', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('shipping_settings', fn (Blueprint $table) => $table->dropColumn(['free_shipping_enabled', 'free_shipping_minimum']));
    }
};
