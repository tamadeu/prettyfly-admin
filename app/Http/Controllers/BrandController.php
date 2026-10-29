<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('brands/index', [
            'brands' => Brand::query()->withCount('products')->orderBy('name')->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('brands/form', ['brand' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        Brand::create($request->validate($this->rules()));

        return to_route('marcas.index');
    }

    public function edit(Brand $marca): Response
    {
        return Inertia::render('brands/form', ['brand' => $marca]);
    }

    public function update(Request $request, Brand $marca): RedirectResponse
    {
        $marca->update($request->validate($this->rules($marca)));

        return to_route('marcas.index');
    }

    public function destroy(Brand $marca): RedirectResponse
    {
        $marca->delete();

        return to_route('marcas.index');
    }

    private function rules(?Brand $brand = null): array
    {
        $url = ['nullable', 'string', 'max:500', 'regex:/^(\/|https?:\/\/)\S*$/i'];

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('brands', 'slug')->ignore($brand)],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo_url' => $url,
            'hero_image_url' => $url,
        ];
    }
}
