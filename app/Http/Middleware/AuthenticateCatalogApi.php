<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCatalogApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = config('catalog.api_token');

        if (! is_string($configuredToken) || strlen($configuredToken) < 32) {
            return new JsonResponse([
                'message' => 'A API do catálogo não está configurada.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $providedToken = $request->bearerToken();

        if (! is_string($providedToken) || ! hash_equals($configuredToken, $providedToken)) {
            return new JsonResponse([
                'message' => 'Não autenticado.',
            ], Response::HTTP_UNAUTHORIZED, [
                'WWW-Authenticate' => 'Bearer',
            ]);
        }

        return $next($request);
    }
}
