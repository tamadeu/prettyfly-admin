<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SiteSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('site/edit', [
            'settings' => SiteSetting::current()->only(['title', 'description', 'favicon_url']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:300'],
            'favicon_url' => ['nullable', 'string', 'max:500', 'regex:/^(\/|https?:\/\/)\S*$/i'],
        ]);

        SiteSetting::current()->fill($data)->save();

        return back();
    }
}
