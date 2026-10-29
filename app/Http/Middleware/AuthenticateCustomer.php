<?php

namespace App\Http\Middleware;

use App\Models\CustomerToken;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCustomer
{
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->header('X-Customer-Token');
        $token = is_string($plain) && $plain !== '' ? CustomerToken::findValid($plain) : null;
        $user = $token?->user;

        if (! $user || ! $user->isCustomer() || ! $user->customer?->is_active) {
            return new JsonResponse(['message' => 'Sessão inválida.'], Response::HTTP_UNAUTHORIZED);
        }

        $token->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('customer_token', $token);

        return $next($request);
    }
}
