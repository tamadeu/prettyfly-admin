<?php

namespace App\Http\Controllers;

use App\Models\ApplicationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('settings/application', [
            'settings' => ApplicationSetting::values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $settings = $request->validate([
            'application_name' => ['required', 'string', 'max:100'],
            'primary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'tertiary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        ApplicationSetting::query()->updateOrCreate(['id' => 1], $settings);

        return back()->with('success', 'Configurações salvas.');
    }
}
