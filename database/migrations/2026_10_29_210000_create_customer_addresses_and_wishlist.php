<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('label', 60)->nullable();
            $table->string('recipient', 120);
            $table->string('zip', 9);
            $table->string('street', 160);
            $table->string('number', 20);
            $table->string('complement', 80)->nullable();
            $table->string('neighborhood', 100);
            $table->string('city', 100);
            $table->string('state', 2);
            $table->string('phone', 30)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('customer_wishlist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('product_key', 120);
            $table->json('data');
            $table->timestamps();
            $table->unique(['customer_id', 'product_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_wishlist_items');
        Schema::dropIfExists('customer_addresses');
    }
};
