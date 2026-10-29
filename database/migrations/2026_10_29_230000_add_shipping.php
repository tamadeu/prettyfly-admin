<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(false);
            $table->string('environment')->default('sandbox');
            $table->string('origin_postal_code', 8)->default('05083010');
            $table->string('contact_email')->nullable();
            $table->text('token')->nullable();
            $table->json('services');
            $table->timestamps();
        });
        Schema::table('carts', fn (Blueprint $table) => $table->json('shipping')->nullable());
    }

    public function down(): void
    {
        Schema::table('carts', fn (Blueprint $table) => $table->dropColumn('shipping'));
        Schema::dropIfExists('shipping_settings');
    }
};
