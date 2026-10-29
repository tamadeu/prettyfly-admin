<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\ProductVariant;
use App\Models\ShippingSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SuperFrete
{
    public function inputKey(Cart $cart): string
    {
        $items = collect($cart->items)->map(fn ($i) => $i['productId'].':'.$i['variantId'].':'.$i['quantity'])->sort()->values()->all();

        return preg_replace('/\D/', '', $cart->checkout['postal_code'] ?? '').'|'.implode('|', $items);
    }

    private function context(Cart $cart): array
    {
        $settings = ShippingSetting::current();
        abort_unless($settings->enabled && filled($settings->token) && filled($settings->contact_email), 503, 'O cálculo de frete ainda não está disponível. Tente novamente mais tarde.');
        $cep = preg_replace('/\D/', '', $cart->checkout['postal_code'] ?? '');
        if (! preg_match('/^\d{8}$/', $cep) || ($cart->checkout['country'] ?? 'BR') !== 'BR') {
            throw ValidationException::withMessages(['postal_code' => 'Informe um CEP brasileiro com 8 dígitos para calcular o frete.']);
        }
        if (! count($cart->items)) {
            throw ValidationException::withMessages(['items' => 'Adicione produtos ao carrinho antes de calcular o frete.']);
        }
        $variants = ProductVariant::with('product')->whereIn('id', array_column($cart->items, 'variantId'))->get()->keyBy('id');
        $products = [];
        $valueCents = 0;
        foreach (collect($cart->items)->sortBy('variantId') as $item) {
            $variant = $variants->get($item['variantId']);
            if (! $variant || $variant->product_id != $item['productId'] || ! $variant->product?->is_active || ! $variant->product?->is_visible) {
                throw ValidationException::withMessages(['items' => 'Um dos produtos não está mais disponível. Atualize seu carrinho.']);
            }
            foreach (['weight', 'height', 'width', 'length'] as $field) {
                if (! is_numeric($variant->$field) || (float) $variant->$field <= 0) {
                    throw ValidationException::withMessages(['items' => 'Não foi possível calcular o envio de '.$variant->product->name.'. Entre em contato com a loja.']);
                }
            }
            $products[] = ['quantity' => (int) $item['quantity'], 'weight' => (float) $variant->weight, 'height' => (float) $variant->height, 'width' => (float) $variant->width, 'length' => (float) $variant->length];
            $valueCents += (int) round((float) $variant->price * 100) * $item['quantity'];
        }
        $services = $settings->services;
        sort($services);
        $payload = [
            'from' => ['postal_code' => $settings->origin_postal_code], 'to' => ['postal_code' => $cep],
            'services' => implode(',', $services),
            'options' => ['own_hand' => false, 'receipt' => false, 'insurance_value' => $valueCents / 100, 'use_insurance_value' => true],
            'products' => $products,
        ];
        $fingerprint = hash('sha256', json_encode([$payload, $this->inputKey($cart), $settings->environment, $settings->contact_email, hash('sha256', $settings->token)]));

        return [$settings, $payload, $fingerprint];
    }

    public function isCurrent(Cart $cart, ?array $shipping): bool
    {
        if (! $shipping || ! isset($shipping['expires_at'], $shipping['fingerprint']) || now()->gte($shipping['expires_at'])) {
            return false;
        }
        try {
            [, , $fingerprint] = $this->context($cart);

            return hash_equals($fingerprint, $shipping['fingerprint']);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException|ValidationException) {
            return false;
        }
    }

    public function quote(Cart $cart): array
    {
        if ($this->isCurrent($cart, $cart->shipping)) {
            return $cart->shipping;
        }
        [$settings, $payload, $fingerprint] = $this->context($cart);
        $quote = Cache::remember('superfrete:quote:'.$fingerprint, 600, function () use ($settings, $payload) {
            $url = $settings->environment === 'production' ? 'https://api.superfrete.com' : 'https://sandbox.superfrete.com';
            try {
                $response = Http::acceptJson()->asJson()->withToken($settings->token)
                    ->withUserAgent('PrettyFly/1.0 ('.$settings->contact_email.')')
                    ->connectTimeout(3)->timeout(10)->withoutRedirecting()->post($url.'/api/v0/calculator', $payload);
            } catch (\Illuminate\Http\Client\ConnectionException) {
                abort(503, 'Não foi possível consultar o frete agora. Tente novamente.');
            }
            // Não repassar mensagens ou detalhes de autenticação do provedor ao visitante.
            abort_unless($response->successful(), 503, 'Não foi possível consultar o frete agora. Tente novamente.');
            $rows = $response->json();
            abort_unless(is_array($rows) && array_is_list($rows), 503, 'O serviço de frete retornou uma resposta inválida. Tente novamente.');
            $options = [];
            foreach ($rows as $row) {
                if (! is_array($row) || ! empty($row['has_error']) || ! empty($row['error'])) {
                    continue;
                }
                $id = (string) ($row['id'] ?? '');
                $price = $row['price'] ?? null;
                $days = $row['delivery_time'] ?? null;
                if (! in_array($id, $settings->services, true) || ! is_numeric($price) || (float) $price < 0 || ! is_numeric($days) || (int) $days < 0 || empty($row['name'])) {
                    continue;
                }
                $options[$id] = [
                    'id' => $id, 'name' => (string) $row['name'], 'company' => (string) ($row['company']['name'] ?? ''),
                    'price' => round((float) $price, 2), 'delivery_days' => (int) $days,
                    // Preservar os volumes calculados para uma futura emissão de etiqueta.
                    'packages' => $row['packages'] ?? [],
                ];
            }
            $options = array_values($options);
            usort($options, fn ($a, $b) => $a['price'] <=> $b['price']);

            return ['options' => $options, 'expires_at' => now()->addMinutes(10)->toIso8601String()];
        });

        return $quote + ['quote_id' => (string) Str::uuid(), 'fingerprint' => $fingerprint, 'input_key' => $this->inputKey($cart), 'environment' => $settings->environment, 'selected_id' => null];
    }

    public function publicQuote(?array $shipping): ?array
    {
        if (! $shipping) {
            return null;
        }

        return collect($shipping)->only(['quote_id', 'input_key', 'environment', 'expires_at', 'selected_id'])->all() + [
            'options' => array_map(fn ($option) => collect($option)->except('packages')->all(), $shipping['options']),
        ];
    }
}
