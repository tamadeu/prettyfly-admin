<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property \App\Models\User $resource */
class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customer = $this->resource->customer;

        return [
            'id' => $customer?->id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'email_verified' => $this->resource->email_verified_at !== null,
            'phone' => $customer?->phone,
            'document' => $customer?->document,
            'birth_date' => $customer?->birth_date?->format('Y-m-d'),
        ];
    }
}
