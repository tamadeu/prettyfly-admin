<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_visible')->default(false);
            $table->boolean('is_active')->default(true);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120)->default('Padrão');
            $table->json('attributes')->nullable();
            $table->string('sku', 80)->unique();
            $table->decimal('price', 12, 2);
            $table->unsignedInteger('stock')->default(0);
            $table->decimal('weight', 10, 3)->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->decimal('height', 10, 2)->nullable();
            $table->decimal('length', 10, 2)->nullable();
            $table->timestamps();

            $table->index(['product_id', 'name']);
        });

        Schema::create('product_specifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('value', 255);
            $table->timestamps();

            $table->index(['product_id', 'name']);
        });

        DB::table('products')->orderBy('id')->chunk(100, function ($products): void {
            foreach ($products as $product) {
                DB::table('product_variants')->insert([
                    'product_id' => $product->id,
                    'name' => 'Padrão',
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'stock' => $product->stock,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                ]);

                DB::table('products')->where('id', $product->id)->update([
                    'is_visible' => $product->status === 'active',
                    'is_active' => $product->status !== 'archived',
                ]);
            }
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_sku_unique');
            $table->dropIndex(['status', 'created_at']);
            $table->dropColumn(['sku', 'price', 'stock', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku', 80)->nullable()->unique();
            $table->decimal('price', 12, 2)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->string('status', 20)->default('draft');
            $table->index(['status', 'created_at']);
        });

        DB::table('products')->orderBy('id')->chunk(100, function ($products): void {
            foreach ($products as $product) {
                $variant = DB::table('product_variants')
                    ->where('product_id', $product->id)
                    ->orderBy('id')
                    ->first();

                if ($variant) {
                    DB::table('products')->where('id', $product->id)->update([
                        'sku' => $variant->sku,
                        'price' => $variant->price,
                        'stock' => $variant->stock,
                        'status' => $product->is_visible ? 'active' : ($product->is_active ? 'draft' : 'archived'),
                    ]);
                }
            }
        });

        Schema::dropIfExists('product_specifications');
        Schema::dropIfExists('product_variants');

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn(['is_visible', 'is_active']);
        });

        Schema::dropIfExists('categories');
    }
};
