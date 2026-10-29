<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return new JsonResponse(['data' => $this->customer($request)->addresses->map(fn ($a) => $this->payload($a))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $customer = $this->customer($request);

        if ($customer->addresses()->count() >= CustomerAddress::MAX_PER_CUSTOMER) {
            return new JsonResponse(['message' => 'Limite de '.CustomerAddress::MAX_PER_CUSTOMER.' endereços atingido.'], 422);
        }

        $data = $this->validated($request);

        $address = DB::transaction(function () use ($customer, $data) {
            // O primeiro endereço sempre vira o padrão.
            $makeDefault = ($data['is_default'] ?? false) || ! $customer->addresses()->exists();
            if ($makeDefault) {
                $customer->addresses()->update(['is_default' => false]);
            }

            return $customer->addresses()->create(['is_default' => $makeDefault] + $data);
        });

        return new JsonResponse(['data' => $this->payload($address)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = $this->customer($request);
        $address = $customer->addresses()->findOrFail($id);
        $data = $this->validated($request);

        DB::transaction(function () use ($customer, $address, $data) {
            if ($data['is_default'] ?? false) {
                $customer->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            // Não permite remover o padrão sem escolher outro.
            $address->update($data + ['is_default' => $address->is_default]);
        });

        return new JsonResponse(['data' => $this->payload($address->fresh())]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $customer = $this->customer($request);
        $address = $customer->addresses()->findOrFail($id);

        DB::transaction(function () use ($customer, $address) {
            $wasDefault = $address->is_default;
            $address->delete();
            if ($wasDefault) {
                $customer->addresses()->first()?->update(['is_default' => true]);
            }
        });

        return new JsonResponse(null, 204);
    }

    private function customer(Request $request): Customer
    {
        return $request->user()->customer;
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'label' => ['nullable', 'string', 'max:60'],
            'recipient' => ['required', 'string', 'max:120'],
            'zip' => ['required', 'regex:/^\d{5}-?\d{3}$/'],
            'street' => ['required', 'string', 'max:160'],
            'number' => ['required', 'string', 'max:20'],
            'complement' => ['nullable', 'string', 'max:80'],
            'neighborhood' => ['required', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'alpha', 'size:2'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_default' => ['boolean'],
        ], [
            'required' => 'Informe :attribute.',
            'zip.regex' => 'CEP inválido.',
            'state.size' => 'A UF deve ter 2 letras.',
            'state.alpha' => 'A UF deve ter 2 letras.',
        ], [
            'recipient' => 'o destinatário', 'zip' => 'o CEP', 'street' => 'a rua', 'number' => 'o número',
            'neighborhood' => 'o bairro', 'city' => 'a cidade', 'state' => 'a UF',
        ]);

        $data['zip'] = preg_replace('/^(\d{5})-?(\d{3})$/', '$1-$2', $data['zip']);
        $data['state'] = strtoupper($data['state']);

        return $data;
    }

    private function payload(CustomerAddress $a): array
    {
        return $a->only(['id', 'label', 'recipient', 'zip', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'phone', 'is_default']);
    }
}
