<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'hidden'])],
        ]);

        $search = $validated['search'] ?? '';
        $status = $validated['status'] ?? '';

        $products = Product::query()
            ->with(['category:id,name', 'brand:id,name'])
            ->with(['images' => fn ($query) => $query->limit(1)])
            ->withCount('variants')
            ->withMin('variants', 'price')
            ->withSum('variants', 'stock')
            ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('variants', fn ($variants) => $variants->where('sku', 'like', "%{$search}%"));
            }))
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($status === 'hidden', fn ($query) => $query->where('is_visible', false))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('products/index', [
            'products' => $products,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    private function syncImages(
        Product|ProductVariant $owner,
        array $uploads,
        array $removeIds,
        array $imageOrder,
        string $directory,
        array &$storedPaths,
        array &$deletedPaths,
        string $errorKey,
    ): void {
        $images = $owner->images();
        $existingImages = $images->get();
        $removedImages = $existingImages->whereIn('id', $removeIds);
        $remainingCount = $existingImages->count() - $removedImages->count();

        if ($remainingCount + count($uploads) > 10) {
            throw ValidationException::withMessages([
                $errorKey => 'Cada produto e variação pode ter no máximo 10 imagens.',
            ]);
        }

        $this->deleteImages($removedImages, $deletedPaths);
        $sortableImages = [];

        foreach ($existingImages->reject(fn ($image) => in_array($image->id, $removeIds, true)) as $image) {
            $sortableImages["existing:{$image->id}"] = $image;
        }

        foreach ($uploads as $index => $upload) {
            $path = $upload->store($directory, config('filesystems.uploads'));

            if (! $path) {
                throw new \RuntimeException('Não foi possível armazenar a imagem enviada.');
            }

            $storedPaths[] = $path;
            $image = $images->create([
                'path' => $path,
                'alt' => Str::limit(pathinfo($upload->getClientOriginalName(), PATHINFO_FILENAME), 180, ''),
                'sort_order' => 0,
            ]);
            $sortableImages["new:{$index}"] = $image;
        }

        if ($imageOrder === []) {
            $imageOrder = array_keys($sortableImages);
        }

        if (
            count($imageOrder) !== count($sortableImages)
            || count(array_unique($imageOrder)) !== count($imageOrder)
            || array_diff($imageOrder, array_keys($sortableImages)) !== []
        ) {
            throw ValidationException::withMessages([
                $errorKey => 'A ordem das imagens enviada é inválida. Atualize a página e tente novamente.',
            ]);
        }

        foreach ($imageOrder as $sortOrder => $token) {
            $sortableImages[$token]->update(['sort_order' => $sortOrder]);
        }
    }

    private function deleteImages(iterable $images, array &$deletedPaths): void
    {
        foreach ($images as $image) {
            $deletedPaths[] = $image->path;
            $image->delete();
        }
    }

    private function removeStoredFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if (! Storage::disk(config('filesystems.uploads'))->delete($path)) {
                throw new \RuntimeException('Não foi possível excluir um arquivo de imagem armazenado.');
            }
        }
    }

    public function create(): Response
    {
        return Inertia::render('products/form', [
            'product' => null,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $variants = $request->input('variants');
        $validated = $request->validate($this->rules(null, is_array($variants) ? $variants : []));
        $storedPaths = [];
        $deletedPaths = [];

        try {
            DB::transaction(function () use ($validated, &$storedPaths, &$deletedPaths): void {
                $product = Product::create(Arr::except($validated, [
                    'variants',
                    'specifications',
                    'product_images',
                    'product_image_order',
                    'remove_product_image_ids',
                ]));

                $this->syncImages(
                    $product,
                    $validated['product_images'] ?? [],
                    [],
                    $validated['product_image_order'] ?? [],
                    "products/{$product->id}",
                    $storedPaths,
                    $deletedPaths,
                    'product_images',
                );

                foreach ($validated['variants'] as $variantData) {
                    $variant = $product->variants()->create(Arr::except($variantData, [
                        'images',
                        'image_order',
                        'remove_image_ids',
                    ]));

                    $this->syncImages(
                        $variant,
                        $variantData['images'] ?? [],
                        [],
                        $variantData['image_order'] ?? [],
                        "products/{$product->id}/variants/{$variant->id}",
                        $storedPaths,
                        $deletedPaths,
                        'product_images',
                    );
                }

                $product->specifications()->createMany($validated['specifications'] ?? []);
            });
        } catch (Throwable $exception) {
            $this->removeStoredFiles($storedPaths);

            throw $exception;
        }

        $this->removeStoredFiles($deletedPaths);

        return to_route('produtos.index');
    }

    public function edit(Product $produto): Response
    {
        return Inertia::render('products/form', [
            'product' => $produto->load(['images', 'variants.images', 'specifications']),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Product $produto): RedirectResponse
    {
        $variants = $request->input('variants');
        $validated = $request->validate($this->rules($produto, is_array($variants) ? $variants : []));
        $storedPaths = [];
        $deletedPaths = [];

        try {
            DB::transaction(function () use ($validated, $produto, &$storedPaths, &$deletedPaths): void {
                $produto->update(Arr::except($validated, [
                    'variants',
                    'specifications',
                    'product_images',
                    'product_image_order',
                    'remove_product_image_ids',
                ]));

                $this->syncImages(
                    $produto,
                    $validated['product_images'] ?? [],
                    $validated['remove_product_image_ids'] ?? [],
                    $validated['product_image_order'] ?? [],
                    "products/{$produto->id}",
                    $storedPaths,
                    $deletedPaths,
                    'product_images',
                );

                $variantIds = [];
                foreach ($validated['variants'] as $variantData) {
                    $variantId = $variantData['id'] ?? null;
                    $variantAttributes = Arr::except($variantData, ['images', 'image_order', 'remove_image_ids', 'id']);

                    if ($variantId) {
                        $variant = $produto->variants()->whereKey($variantId)->firstOrFail();
                        $variant->update($variantAttributes);
                    } else {
                        $variant = $produto->variants()->create($variantAttributes);
                    }

                    $variantIds[] = $variant->id;
                    $this->syncImages(
                        $variant,
                        $variantData['images'] ?? [],
                        $variantData['remove_image_ids'] ?? [],
                        $variantData['image_order'] ?? [],
                        "products/{$produto->id}/variants/{$variant->id}",
                        $storedPaths,
                        $deletedPaths,
                        "variants.{$variantId}.images",
                    );
                }

                $removedVariants = $produto->variants()->whereNotIn('id', $variantIds)->with('images')->get();
                foreach ($removedVariants as $removedVariant) {
                    $this->deleteImages($removedVariant->images, $deletedPaths);
                    $removedVariant->delete();
                }

                $produto->specifications()->delete();
                $produto->specifications()->createMany($validated['specifications'] ?? []);
            });
        } catch (Throwable $exception) {
            $this->removeStoredFiles($storedPaths);

            throw $exception;
        }

        $this->removeStoredFiles($deletedPaths);

        return to_route('produtos.index');
    }

    public function destroy(Product $produto): RedirectResponse
    {
        $deletedPaths = [];

        DB::transaction(function () use ($produto, &$deletedPaths): void {
            $produto->load(['images', 'variants.images']);

            $this->deleteImages($produto->images, $deletedPaths);
            foreach ($produto->variants as $variant) {
                $this->deleteImages($variant->images, $deletedPaths);
            }

            $produto->delete();
        });

        $this->removeStoredFiles($deletedPaths);

        return to_route('produtos.index');
    }

    private function rules(?Product $produto = null, array $variants = []): array
    {
        $variantIdRule = $produto
            ? Rule::exists('product_variants', 'id')->where('product_id', $produto->id)
            : Rule::in([]);

        $variantRules = [];

        foreach ($variants as $index => $variant) {
            if (! is_array($variant)) {
                continue;
            }

            $uniqueSku = Rule::unique('product_variants', 'sku');

            if ($produto && ! empty($variant['id'])) {
                $variantId = $produto->variants()->whereKey($variant['id'])->value('id');

                if ($variantId) {
                    $uniqueSku->ignore($variantId);
                }
            }

            $variantRules["variants.{$index}.sku"] = ['required', 'string', 'max:80', $uniqueSku];
            $variantRules["variants.{$index}.images"] = ['nullable', 'array', 'max:10'];
            $variantRules["variants.{$index}.images.*"] = ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];
            $variantRules["variants.{$index}.image_order"] = ['nullable', 'array', 'max:10'];
            $variantRules["variants.{$index}.image_order.*"] = ['string', 'max:80'];
            $variantRules["variants.{$index}.remove_image_ids"] = ['nullable', 'array', 'max:10'];

            $variantImageRule = $produto && ! empty($variant['id'])
                ? Rule::exists('product_images', 'id')
                    ->where('product_variant_id', $variant['id'])
                    ->whereNull('product_id')
                : Rule::in([]);
            $variantRules["variants.{$index}.remove_image_ids.*"] = ['integer', $variantImageRule];
            $attributes = $variant['attributes'] ?? [];

            if (! is_array($attributes)) {
                continue;
            }

            foreach ($attributes as $attributeIndex => $attribute) {
                if (! is_array($attribute)) {
                    continue;
                }

                $variantRules["variants.{$index}.attributes.{$attributeIndex}.name"][] = function ($attributeName, $value, $fail) use ($attributes, $attributeIndex): void {
                    $currentName = is_scalar($value) ? mb_strtolower(trim((string) $value)) : '';

                    foreach ($attributes as $otherIndex => $otherAttribute) {
                        if (
                            $otherIndex !== $attributeIndex
                            && is_array($otherAttribute)
                            && is_scalar($otherAttribute['name'] ?? null)
                            && mb_strtolower(trim((string) $otherAttribute['name'])) === $currentName
                        ) {
                            $fail('Os nomes dos atributos devem ser únicos dentro da mesma variação.');

                            return;
                        }
                    }
                };
            }
        }

        return array_merge([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:180', Rule::unique('products', 'slug')->ignore($produto)],
            'description' => ['nullable', 'string', 'max:10000'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'is_visible' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
            'product_images' => ['nullable', 'array', 'max:10'],
            'product_images.*' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'product_image_order' => ['nullable', 'array', 'max:10'],
            'product_image_order.*' => ['string', 'max:80'],
            'remove_product_image_ids' => ['nullable', 'array', 'max:10'],
            'remove_product_image_ids.*' => [
                'integer',
                Rule::exists('product_images', 'id')
                    ->where('product_id', $produto?->id)
                    ->whereNull('product_variant_id'),
            ],
            'variants' => ['required', 'array', 'min:1', 'max:100'],
            'variants.*.id' => ['nullable', 'integer', $variantIdRule],
            'variants.*.name' => ['required', 'string', 'max:120'],
            'variants.*.attributes' => ['nullable', 'array', 'max:30'],
            'variants.*.attributes.*.name' => ['required', 'string', 'max:80'],
            'variants.*.attributes.*.value' => ['required', 'string', 'max:120'],
            'variants.*.sku' => ['required', 'string', 'max:80', 'distinct:ignore_case'],
            'variants.*.price' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.weight' => ['nullable', 'numeric', 'gt:0', 'decimal:0,3'],
            'variants.*.width' => ['nullable', 'numeric', 'gt:0', 'decimal:0,2'],
            'variants.*.height' => ['nullable', 'numeric', 'gt:0', 'decimal:0,2'],
            'variants.*.length' => ['nullable', 'numeric', 'gt:0', 'decimal:0,2'],
            'specifications' => ['nullable', 'array', 'max:100'],
            'specifications.*.name' => ['required', 'string', 'max:100', 'distinct:ignore_case'],
            'specifications.*.value' => ['required', 'string', 'max:255'],
        ], $variantRules);
    }
}
