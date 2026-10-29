<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Collection as ProductCollection;
use App\Models\Coupon;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('coupons/index', [
            'coupons' => Coupon::query()->withCount([
                'usages as reserved_count' => fn ($query) => $query->where('status', 'reserved')->where('expires_at', '>', now()),
                'usages as redeemed_count' => fn ($query) => $query->where('status', 'redeemed'),
            ])->orderByDesc('created_at')->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('coupons/form', ['coupon' => null, ...$this->options()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate($this->rules());
        $coupon = Coupon::create($this->attributes($data));
        $this->syncTargets($coupon, $data);

        return to_route('cupons.index')->with('success', 'Cupom criado com sucesso.');
    }

    public function edit(Coupon $cupom): Response
    {
        $cupom->load(['products:id,name', 'categories:id,name', 'collections:id,name']);

        return Inertia::render('coupons/form', ['coupon' => $cupom, ...$this->options()]);
    }

    public function update(Request $request, Coupon $cupom): RedirectResponse
    {
        $data = $request->validate($this->rules($cupom));
        $cupom->update($this->attributes($data));
        $this->syncTargets($cupom, $data);

        return to_route('cupons.index')->with('success', 'Cupom atualizado com sucesso.');
    }

    public function destroy(Coupon $cupom): RedirectResponse
    {
        $cupom->update(['is_active' => false]);
        $cupom->delete();

        return to_route('cupons.index')->with('success', 'Cupom excluído.');
    }

    private function options(): array
    {
        return [
            'products' => Product::query()->orderBy('name')->get(['id', 'name']),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'collections' => ProductCollection::query()->orderBy('name')->get(['id', 'name']),
        ];
    }

    private function rules(?Coupon $coupon = null): array
    {
        return [
            'code' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9_-]+$/', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['required', Rule::in(Coupon::TYPES)],
            'discount_value' => ['required', 'numeric', 'gt:0', 'max:1000000'],
            'minimum_order' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'per_customer_limit' => ['nullable', 'integer', 'min:1', 'max:100000000'],
            'is_active' => ['sometimes', 'boolean'],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['integer', 'distinct', 'exists:products,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],
            'collection_ids' => ['nullable', 'array'],
            'collection_ids.*' => ['integer', 'distinct', 'exists:collections,id'],
        ];
    }

    private function attributes(array $data): array
    {
        if (($data['discount_type'] ?? null) === 'percentage' && (float) $data['discount_value'] > 100) {
            throw \Illuminate\Validation\ValidationException::withMessages(['discount_value' => 'O desconto percentual não pode ultrapassar 100%.']);
        }
        if (! empty($data['starts_at']) && ! empty($data['ends_at']) && strtotime($data['ends_at']) < strtotime($data['starts_at'])) {
            throw \Illuminate\Validation\ValidationException::withMessages(['ends_at' => 'A data final deve ser igual ou posterior à inicial.']);
        }

        return [
            'code' => mb_strtoupper(trim($data['code'])),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'minimum_order' => $data['minimum_order'] ?? 0,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'per_customer_limit' => $data['per_customer_limit'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? false),
        ];
    }

    private function syncTargets(Coupon $coupon, array $data): void
    {
        $coupon->products()->sync($data['product_ids'] ?? []);
        $coupon->categories()->sync($data['category_ids'] ?? []);
        $coupon->collections()->sync($data['collection_ids'] ?? []);
    }
}
