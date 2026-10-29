<?php

namespace App\Http\Controllers;

use App\Models\ShippingSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShippingSettingsController extends Controller
{
    public function edit(): Response
    {
        $settings = ShippingSetting::current();

        return Inertia::render('settings/shipping', ['settings' => $settings->only(['enabled', 'environment', 'origin_postal_code', 'contact_email', 'services']) + ['has_token' => filled($settings->token)]]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->merge(['origin_postal_code' => preg_replace('/\D/', '', (string) $request->input('origin_postal_code'))]);
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'environment' => ['required', Rule::in(['sandbox', 'production'])],
            'origin_postal_code' => ['required', 'regex:/^\d{8}$/'],
            'contact_email' => ['nullable', 'required_if:enabled,true', 'email', 'max:254'],
            'token' => ['nullable', 'string', 'max:4096', 'regex:/^[^\s]+$/'],
            'services' => ['required', 'array', 'list', 'min:1', 'max:6'],
            'services.*' => ['required', 'string', 'distinct', Rule::in(['1', '2', '17', '3', '31', '33'])],
        ]);
        $settings = ShippingSetting::current();
        // Tokens são específicos por ambiente. Nunca reutilizar uma credencial no ambiente errado.
        if ($settings->environment !== $data['environment'] && empty($data['token']) && filled($settings->token)) {
            throw ValidationException::withMessages(['token' => 'Informe o token correspondente ao novo ambiente.']);
        }
        if (empty($data['token'])) {
            unset($data['token']);
        }
        if ($data['enabled'] && empty($data['token']) && blank($settings->token)) {
            throw ValidationException::withMessages(['token' => 'Informe o token do SuperFrete para ativar as cotações.']);
        }
        $settings->id = 1;
        $settings->fill($data)->save();

        return back()->with('success', 'Configurações de frete salvas.');
    }
}
