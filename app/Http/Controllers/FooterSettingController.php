<?php

namespace App\Http\Controllers;

use App\Models\FooterSetting;
use App\Models\HeaderSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FooterSettingController extends Controller
{
    private const URL_PATTERN = '/^(\/|#|https?:\/\/)\S*$/i';

    public function edit(): Response
    {
        return Inertia::render('footer/edit', [
            'content' => array_merge(FooterSetting::defaultContent(), FooterSetting::current()->content ?? []),
            'defaultContent' => FooterSetting::defaultContent(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $link = ['required', 'string', 'max:500', 'regex:'.self::URL_PATTERN];

        $data = $request->validate([
            'background' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'about_title' => ['nullable', 'string', 'max:80'],
            'about_text' => ['nullable', 'string', 'max:500'],
            'socials' => ['present', 'array', 'max:10'],
            'socials.*.network' => ['required', Rule::in(array_keys(HeaderSetting::SOCIAL_NETWORKS))],
            'socials.*.href' => $link,
            'columns' => ['present', 'array', 'max:2'],
            'columns.*.title' => ['required', 'string', 'max:80'],
            'columns.*.links' => ['present', 'array', 'max:20'],
            'columns.*.links.*.label' => ['required', 'string', 'max:80'],
            'columns.*.links.*.href' => $link,
            'show_newsletter' => ['boolean'],
            'newsletter_title' => ['nullable', 'string', 'max:80'],
            'newsletter_text' => ['nullable', 'string', 'max:300'],
            'newsletter_placeholder' => ['nullable', 'string', 'max:80'],
            'show_currency' => ['boolean'],
            'currencies' => ['present', 'array', 'max:30'],
            'currencies.*' => ['required', 'string', 'max:60'],
            'show_language' => ['boolean'],
            'languages' => ['present', 'array', 'max:30'],
            'languages.*' => ['required', 'string', 'max:60'],
            'copyright' => ['nullable', 'string', 'max:200'],
            'show_payments' => ['boolean'],
            'payment_height' => ['nullable', 'integer', 'min:16', 'max:120'],
            'payment_images' => ['nullable', 'array', 'max:12'],
            'payment_images.*.src' => ['required', 'string', 'max:500', 'regex:'.self::URL_PATTERN],
            'payment_images.*.alt' => ['nullable', 'string', 'max:60'],
        ]);

        FooterSetting::current()->fill(['content' => [
            'background' => $data['background'],
            'about_title' => $data['about_title'] ?? '',
            'about_text' => $data['about_text'] ?? '',
            'socials' => array_values($data['socials']),
            'columns' => array_values(array_map(fn (array $c) => [
                'title' => $c['title'],
                'links' => array_values($c['links']),
            ], $data['columns'])),
            'show_newsletter' => (bool) ($data['show_newsletter'] ?? false),
            'newsletter_title' => $data['newsletter_title'] ?? '',
            'newsletter_text' => $data['newsletter_text'] ?? '',
            'newsletter_placeholder' => $data['newsletter_placeholder'] ?? '',
            'show_currency' => (bool) ($data['show_currency'] ?? false),
            'currencies' => array_values($data['currencies']),
            'show_language' => (bool) ($data['show_language'] ?? false),
            'languages' => array_values($data['languages']),
            'copyright' => $data['copyright'] ?? '',
            'show_payments' => (bool) ($data['show_payments'] ?? false),
            'payment_height' => (int) ($data['payment_height'] ?? 24),
            'payment_images' => array_values(array_map(fn (array $i) => [
                'src' => $i['src'],
                'alt' => $i['alt'] ?? '',
            ], $data['payment_images'] ?? [])),
        ]])->save();

        return back()->with('success', 'Rodapé salvo.');
    }
}
