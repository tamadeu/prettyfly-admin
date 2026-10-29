<?php

namespace App\Http\Controllers;

use App\Models\CmsPage;
use App\Models\Collection;
use App\Models\CmsSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CmsPageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('cms/index', [
            'pages' => CmsPage::query()->withCount('sections')->orderBy('title')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('cms/form', ['page' => null, 'collections' => $this->collections()]);
    }

    public function store(Request $request): RedirectResponse
    {
        $page = CmsPage::create($this->validatePage($request));

        return to_route('cms.edit', $page);
    }

    public function edit(CmsPage $cm): Response
    {
        return Inertia::render('cms/form', [
            'collections' => $this->collections(),
            'page' => [
                ...$cm->only(['id', 'slug', 'title', 'meta_description', 'is_published']),
                'sections' => $cm->sections->map(fn (CmsSection $section) => [
                    'id' => $section->id,
                    'type' => $section->type,
                    'is_active' => $section->is_active,
                    'content' => $section->content ?? (object) [],
                ])->values(),
            ],
        ]);
    }

    private function collections()
    {
        return Collection::query()->orderBy('name')->get(['name', 'slug']);
    }

    public function update(Request $request, CmsPage $cm): RedirectResponse
    {
        $data = $this->validatePage($request, $cm);
        $sections = $request->validate([
            'sections' => ['present', 'array', 'max:60'],
            'sections.*.type' => ['required', Rule::in(CmsSection::TYPES)],
            'sections.*.is_active' => ['required', 'boolean'],
            'sections.*.content' => ['nullable', 'array'],
        ])['sections'];

        DB::transaction(function () use ($cm, $data, $sections) {
            $cm->update($data);
            $cm->sections()->delete();
            foreach (array_values($sections) as $position => $section) {
                $cm->sections()->create([
                    'type' => $section['type'],
                    'is_active' => $section['is_active'],
                    'position' => $position,
                    'content' => $section['content'] ?? [],
                ]);
            }
        });

        return to_route('cms.edit', $cm);
    }

    public function destroy(CmsPage $cm): RedirectResponse
    {
        $cm->delete();

        return to_route('cms.index');
    }

    private function validatePage(Request $request, ?CmsPage $page = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:140', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('cms_pages', 'slug')->ignore($page)],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'is_published' => ['required', 'boolean'],
        ]);
    }
}
