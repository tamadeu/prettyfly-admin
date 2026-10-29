<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('carts/index', [
            'carts' => Cart::with('user:id,name,email')->latest('updated_at')->paginate(20),
        ]);
    }
}
