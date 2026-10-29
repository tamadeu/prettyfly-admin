<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CmsImageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,avif,gif', 'max:5120'],
        ], [
            'image.mimes' => 'Envie uma imagem JPG, PNG, WEBP, AVIF ou GIF.',
            'image.max' => 'A imagem deve ter no máximo 5 MB.',
        ]);

        $path = $request->file('image')->store('cms', config('filesystems.uploads'));

        if ($path === false) {
            return response()->json(['message' => 'Não foi possível armazenar a imagem enviada.'], 500);
        }

        return response()->json(['url' => Storage::disk(config('filesystems.uploads'))->url($path)], 201);
    }
}
