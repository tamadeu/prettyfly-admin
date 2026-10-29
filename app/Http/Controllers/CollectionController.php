<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('collections/index', [
            'collections' => Collection::query()->withCount('products')->orderBy('name')->get()
                ->map(fn (Collection $c) => [
                    ...$c->only(['id', 'name', 'slug', 'type', 'is_active']),
                    'is_live' => $c->isLive(),
                    'products_total' => $c->type === 'manual' ? $c->products_count : $c->productsQuery()->count(),
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('collections/form', ['collection' => null, ...$this->options()]);
    }

    public function store(Request $request): RedirectResponse
    {
        [$data, $productIds] = $this->validated($request);
        $collection = Collection::create($data);
        $this->syncProducts($collection, $productIds);

        return to_route('colecoes.edit', $collection);
    }

    public function edit(Collection $colecao): Response
    {
        return Inertia::render('collections/form', [
            'collection' => [
                ...$colecao->only([
                    'id', 'name', 'slug', 'description', 'hero_image_url', 'thumbnail_url',
                    'type', 'sort', 'is_active',
                ]),
                'starts_at' => $colecao->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $colecao->ends_at?->format('Y-m-d\TH:i'),
                'rules' => $colecao->rules ?? (object) [],
                'products' => $colecao->products()->get(['products.id', 'products.name', 'products.slug'])
                    ->map(fn ($p) => $p->only(['id', 'name', 'slug']))->values(),
            ],
            ...$this->options(),
        ]);
    }

    public function update(Request $request, Collection $colecao): RedirectResponse
    {
        [$data, $productIds] = $this->validated($request, $colecao);
        $colecao->update($data);
        $this->syncProducts($colecao, $productIds);

        return back();
    }

    public function destroy(Collection $colecao): RedirectResponse
    {
        $colecao->delete();

        return to_route('colecoes.index');
    }

    public function searchProducts(Request $request): JsonResponse
    {
        $q = (string) $request->query('q', '');

        return response()->json(
            Product::query()
                ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                    ->where('name', 'like', "%{$q}%")->orWhere('slug', 'like', "%{$q}%")))
                ->orderBy('name')->limit(15)->get(['id', 'name', 'slug'])
        );
    }

    public function preview(Request $request): JsonResponse
    {
        $rules = $request->validate($this->ruleRules())['rules'] ?? [];
        $query = Product::query()->where('is_active', true)->where('is_visible', true);
        Collection::applyRules($query, $rules);

        return response()->json([
            'count' => (clone $query)->count(),
            'sample' => $query->orderBy('name')->limit(8)->pluck('name'),
        ]);
    }

    private function options(): array
    {
        return [
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name']),
        ];
    }

    private function ruleRules(): array
    {
        return [
            'rules' => ['nullable', 'array'],
            'rules.category_ids' => ['nullable', 'array', 'max:50'],
            'rules.category_ids.*' => ['integer', 'exists:categories,id'],
            'rules.brand_ids' => ['nullable', 'array', 'max:50'],
            'rules.brand_ids.*' => ['integer', 'exists:brands,id'],
            'rules.min_price' => ['nullable', 'numeric', 'min:0'],
            'rules.max_price' => ['nullable', 'numeric', 'min:0'],
            'rules.in_stock' => ['nullable', 'boolean'],
            'rules.name_contains' => ['nullable', 'string', 'max:120'],
            'rules.created_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'rules.attributes' => ['nullable', 'array', 'max:20'],
            'rules.attributes.*.name' => ['required', 'string', 'max:80'],
            'rules.attributes.*.value' => ['required', 'string', 'max:120'],
        ];
    }

    private function validated(Request $request, ?Collection $collection = null): array
    {
        $url = ['nullable', 'string', 'max:500', 'regex:/^(\/|https?:\/\/)\S*$/i'];

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('collections', 'slug')->ignore($collection)],
            'description' => ['nullable', 'string', 'max:2000'],
            'hero_image_url' => $url,
            'thumbnail_url' => $url,
            'type' => ['required', Rule::in(Collection::TYPES)],
            'sort' => ['required', Rule::in(Collection::SORTS)],
            'is_active' => ['required', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'product_ids' => ['nullable', 'array', 'max:500'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            ...$this->ruleRules(),
        ]);

        $productIds = $data['product_ids'] ?? [];
        unset($data['product_ids']);

        if ($data['type'] === 'manual') {
            $data['rules'] = null;
        } elseif ($data['sort'] === 'manual') {
            $data['sort'] = 'newest';
        }

        return [$data, $data['type'] === 'manual' ? $productIds : []];
    }

    private function syncProducts(Collection $collection, array $productIds): void
    {
        $collection->products()->sync(
            collect($productIds)->values()->mapWithKeys(fn ($id, $i) => [$id => ['position' => $i]])->all()
        );
    }
}
