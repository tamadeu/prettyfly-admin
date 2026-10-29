<?php

namespace App\Http\Controllers;

use App\Models\HeaderSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HeaderSettingController extends Controller
{
    // Only site-relative paths, anchors and http(s) URLs: blocks javascript:/data: links.
    private const URL_PATTERN = '/^(\/|#|https?:\/\/)\S*$/i';

    public function edit(): Response
    {
        $setting = HeaderSetting::current();

        return Inertia::render('header/edit', [
            'setting' => [
                'variant' => $setting->variant,
                'logo_url' => $setting->logo_url ?? '',
                'menu' => $setting->menu ?? HeaderSetting::defaultMenu(),
                'topbar' => $setting->topbar ?? HeaderSetting::defaultTopbar(),
                'contact' => $setting->contact ?? HeaderSetting::defaultContact(),
            ],
            'defaultMenu' => HeaderSetting::defaultMenu(),
            'defaultTopbar' => HeaderSetting::defaultTopbar(),
            'defaultContact' => HeaderSetting::defaultContact(),
            'variants' => collect(HeaderSetting::VARIANTS)
                ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
                ->values(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $url = ['nullable', 'string', 'max:500', 'regex:'.self::URL_PATTERN];
        $text = ['nullable', 'string', 'max:160'];
        $link = ['required', 'string', 'max:500', 'regex:'.self::URL_PATTERN];

        $data = $request->validate([
            'variant' => ['required', Rule::in(array_keys(HeaderSetting::VARIANTS))],
            'logo_url' => $url,
            'contact' => ['required', 'array'],
            'contact.enabled' => ['boolean'],
            'contact.label' => ['nullable', 'string', 'max:80'],
            'contact.phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+()\-.\s]*$/'],
            'topbar' => ['required', 'array'],
            'topbar.enabled' => ['boolean'],
            'topbar.background' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'topbar.text_color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'topbar.autoplay' => ['boolean'],
            'topbar.announcements' => ['present', 'array', 'max:10'],
            'topbar.announcements.*' => ['required', 'string', 'max:160'],
            'topbar.socials' => ['present', 'array', 'max:10'],
            'topbar.socials.*.network' => ['required', Rule::in(array_keys(HeaderSetting::SOCIAL_NETWORKS))],
            'topbar.socials.*.href' => $link,
            'topbar.show_currency' => ['boolean'],
            'topbar.currencies' => ['present', 'array', 'max:30'],
            'topbar.currencies.*' => ['required', 'string', 'max:60'],
            'topbar.show_language' => ['boolean'],
            'topbar.languages' => ['present', 'array', 'max:30'],
            'topbar.languages.*' => ['required', 'string', 'max:60'],
            'menu' => ['present', 'array', 'max:12'],
            'menu.*.label' => ['required', 'string', 'max:60'],
            'menu.*.href' => $link,
            'menu.*.type' => ['required', Rule::in(['link', 'dropdown', 'megamenu'])],
            'menu.*.children' => ['nullable', 'array', 'max:30'],
            'menu.*.children.*.label' => ['required', 'string', 'max:80'],
            'menu.*.children.*.href' => $link,
            'menu.*.children.*.comingSoon' => ['nullable', 'boolean'],
            'menu.*.megaMenu' => ['nullable', 'array', 'max:6'],
            'menu.*.megaMenu.*.title' => ['required', 'string', 'max:80'],
            'menu.*.megaMenu.*.links' => ['nullable', 'array', 'max:30'],
            'menu.*.megaMenu.*.links.*.label' => ['required', 'string', 'max:80'],
            'menu.*.megaMenu.*.links.*.href' => $link,
            'menu.*.megaImage' => ['nullable', 'array'],
            'menu.*.megaImage.src' => $url,
            'menu.*.megaImage.alt' => $text,
            'menu.*.megaImage.title' => $text,
            'menu.*.megaImage.subtitle' => $text,
            'menu.*.megaProductSlider' => ['nullable', 'boolean'],
            'menu.*.megaCategoryCards' => ['nullable', 'array', 'max:20'],
            'menu.*.megaCategoryCards.*.label' => ['required', 'string', 'max:80'],
            'menu.*.megaCategoryCards.*.href' => $link,
            'menu.*.megaCategoryCards.*.image' => $url,
            'menu.*.megaCategoryCards.*.itemCount' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);

        HeaderSetting::current()->fill([
            'variant' => $data['variant'],
            'logo_url' => $data['logo_url'] ?: null,
            'menu' => $this->normalizeMenu($data['menu']),
            'contact' => [
                'enabled' => (bool) ($data['contact']['enabled'] ?? false),
                'label' => $data['contact']['label'] ?? '',
                'phone' => $data['contact']['phone'] ?? '',
            ],
            'topbar' => [
                'enabled' => (bool) ($data['topbar']['enabled'] ?? false),
                'background' => $data['topbar']['background'],
                'text_color' => $data['topbar']['text_color'],
                'autoplay' => (bool) ($data['topbar']['autoplay'] ?? false),
                'announcements' => array_values($data['topbar']['announcements']),
                'socials' => array_values($data['topbar']['socials']),
                'show_currency' => (bool) ($data['topbar']['show_currency'] ?? false),
                'currencies' => array_values($data['topbar']['currencies']),
                'show_language' => (bool) ($data['topbar']['show_language'] ?? false),
                'languages' => array_values($data['topbar']['languages']),
            ],
        ])->save();

        return back()->with('success', 'Cabeçalho salvo.');
    }

    private function normalizeMenu(array $menu): array
    {
        return array_map(function (array $item, int $index): array {
            $id = 'nav-'.($index + 1);
            $out = ['id' => $id, 'label' => $item['label'], 'href' => $item['href'], 'type' => $item['type']];

            if ($item['type'] === 'dropdown') {
                $out['children'] = array_map(function (array $child, int $i) use ($id): array {
                    $clean = ['id' => "$id-c".($i + 1), 'label' => $child['label'], 'href' => $child['href']];

                    return ! empty($child['comingSoon']) ? $clean + ['comingSoon' => true] : $clean;
                }, $item['children'] ?? [], array_keys($item['children'] ?? []));
            }

            if ($item['type'] === 'megamenu') {
                $columns = array_map(fn (array $column, int $c): array => [
                    'title' => $column['title'],
                    'links' => array_map(fn (array $link, int $l): array => [
                        'id' => "$id-l".($c + 1).'-'.($l + 1),
                        'label' => $link['label'],
                        'href' => $link['href'],
                    ], $column['links'] ?? [], array_keys($column['links'] ?? [])),
                ], $item['megaMenu'] ?? [], array_keys($item['megaMenu'] ?? []));

                if ($columns !== []) {
                    $out['megaMenu'] = $columns;
                }

                $image = $item['megaImage'] ?? [];
                if (! empty($image['src'])) {
                    $out['megaImage'] = [
                        'src' => $image['src'],
                        'alt' => $image['alt'] ?? '',
                        'title' => $image['title'] ?? '',
                        'subtitle' => $image['subtitle'] ?? '',
                    ];
                }

                if (! empty($item['megaProductSlider'])) {
                    $out['megaProductSlider'] = true;
                }

                $cards = array_map(function (array $card, int $i) use ($id): array {
                    $clean = [
                        'id' => "$id-card".($i + 1),
                        'label' => $card['label'],
                        'image' => $card['image'] ?? '',
                        'href' => $card['href'],
                    ];

                    return isset($card['itemCount']) ? $clean + ['itemCount' => (int) $card['itemCount']] : $clean;
                }, $item['megaCategoryCards'] ?? [], array_keys($item['megaCategoryCards'] ?? []));

                if ($cards !== []) {
                    $out['megaCategoryCards'] = $cards;
                }
            }

            return $out;
        }, $menu, array_keys($menu));
    }
}
