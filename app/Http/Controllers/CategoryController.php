<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('categories/index', [
            'categories' => Category::query()
                ->withCount('products')
                ->orderBy('name')
                ->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('categories/form', ['category' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        Category::create($request->validate($this->rules()));

        return to_route('categorias.index');
    }

    public function edit(Category $categoria): Response
    {
        return Inertia::render('categories/form', ['category' => $categoria]);
    }

    public function update(Request $request, Category $categoria): RedirectResponse
    {
        $categoria->update($request->validate($this->rules($categoria)));

        return to_route('categorias.index');
    }

    public function destroy(Category $categoria): RedirectResponse
    {
        $categoria->delete();

        return to_route('categorias.index');
    }

    private function rules(?Category $category = null): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', Rule::unique('categories', 'slug')->ignore($category)],
            'description' => ['nullable', 'string', 'max:2000'],
            'thumbnail_url' => ['nullable', 'string', 'max:500', 'regex:/^(\/|https?:\/\/)\S*$/i'],
            'hero_image_url' => ['nullable', 'string', 'max:500', 'regex:/^(\/|https?:\/\/)\S*$/i'],
        ];
    }
}
