<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use Illuminate\Database\Seeder;

class CmsHomeSeeder extends Seeder
{
    public function run(): void
    {
        $page = CmsPage::firstOrCreate(
            ['slug' => 'home'],
            [
                'title' => 'Início — Moda esportiva',
                'meta_description' => 'Eleve o nível dos seus treinos com roupas esportivas de alto desempenho.',
                'is_published' => true,
            ],
        );

        if ($page->sections()->exists()) {
            return;
        }

        $sections = [
            ['hero', ['slides' => [[
                'title' => "Eleve o nível do seu\ntreino",
                'subtitle' => 'Melhore seu desempenho com roupas esportivas estilosas e de alta qualidade.',
                'button_label' => 'Ver coleção',
                'button_url' => '/shop',
                'image' => '/active-wear/hero-slider/hero-slider-1.webp',
            ], [
                'title' => "Eleve o nível do seu\ntreino",
                'subtitle' => 'Melhore seu desempenho com roupas esportivas estilosas e de alta qualidade.',
                'button_label' => 'Ver coleção',
                'button_url' => '/shop',
                'image' => '/active-wear/hero-slider/hero-slider-2.webp',
            ], [
                'title' => "Eleve o nível do seu\ntreino",
                'subtitle' => 'Melhore seu desempenho com roupas esportivas estilosas e de alta qualidade.',
                'button_label' => 'Ver coleção',
                'button_url' => '/shop',
                'image' => '/active-wear/hero-slider/hero-slider-3.webp',
            ]]]],
            ['explore_categories', [
                'title' => 'Explore todas as opções',
                'link_label' => 'Ver todas as categorias',
                'link_url' => '/shop',
                'items' => [
                    ['name' => 'Roupas esportivas', 'url' => '/shop?category=Active%20Wears', 'image' => '/active-wear/product-categories/product-categories-1.avif'],
                    ['name' => 'Leggings', 'url' => '/shop?category=Leggings', 'image' => '/active-wear/product-categories/product-categories-2.webp'],
                    ['name' => 'Joggers', 'url' => '/shop?category=Joggers', 'image' => '/active-wear/product-categories/product-categories-3.avif'],
                    ['name' => 'Tops esportivos', 'url' => '/shop?category=Sports%20Bras', 'image' => '/active-wear/product-categories/product-categories-4.avif'],
                    ['name' => 'Yoga', 'url' => '/shop?category=Yoga', 'image' => '/active-wear/product-categories/product-categories-5.avif'],
                ],
            ]],
            ['promo_grid', ['items' => [
                ['eyebrow' => 'Novidades', 'title' => 'Coleção masculina', 'link_label' => 'Comprar agora', 'link_url' => '/shop', 'image' => '/active-wear/banners/banner-1.webp'],
                ['eyebrow' => 'Até 70% de desconto', 'title' => 'Estilo de verão', 'link_label' => 'Comprar agora', 'link_url' => '/shop', 'image' => '/active-wear/banners/banner-2.webp'],
                ['eyebrow' => 'Liquidação relâmpago', 'title' => 'Looks modernos', 'link_label' => 'Comprar agora', 'link_url' => '/shop', 'image' => '/active-wear/banners/banner-3.webp'],
            ]]],
            ['new_arrivals', ['title' => 'Novidades', 'limit' => 15, 'load_more_label' => 'Carregar mais']],
            ['countdown', [
                'title' => 'Oferta por tempo limitado',
                'text' => 'Destaque seu produto, coleção ou publicação com uma imagem e uma mensagem especial.',
                'ends_at' => '2029-01-01T00:00',
                'button_label' => 'Comprar agora',
                'button_url' => '/shop',
            ]],
            ['tab_content', [
                'video_url' => 'https://www.youtube.com/embed/_9VUPq3SxOc?autoplay=1&rel=0',
                'button_label' => 'Ver coleção',
                'button_url' => '/shop',
                'tabs' => [
                    ['title' => 'Descubra sua força', 'description' => 'Destaque seu produto, coleção ou publicação com uma imagem e conte mais sobre disponibilidade, estilo ou avaliações.', 'image' => '/active-wear/tab/tab-1.webp'],
                    ['title' => 'Supere seus limites', 'description' => 'Peças essenciais de alto desempenho, feitas para acompanhar seus movimentos: tecidos que afastam o suor e oferecem suporte em cada série e corrida.', 'image' => '/active-wear/tab/tab-2.webp'],
                    ['title' => 'Coleção Glam Fit', 'description' => 'Desempenho com estilo. Modelagens que valorizam o corpo e tecidos premium para você ir do estúdio direto para a rua.', 'image' => '/active-wear/tab/tab-3.webp'],
                ],
            ]],
            ['testimonials', ['title' => 'Depoimentos', 'items' => [
                ['name' => 'Samule Das', 'role' => 'Gerente', 'text' => 'Agradecemos seu comentário. Estamos sempre buscando melhorar nossos produtos e gostaríamos de entender melhor essa questão.', 'rating' => 5, 'image' => '/fashion/testimonials/testimonials3.webp'],
                ['name' => 'Nike sime', 'role' => 'Designer', 'text' => 'Agradecemos seu comentário. Estamos sempre buscando melhorar nossos produtos e gostaríamos de entender melhor essa questão.', 'rating' => 5, 'image' => '/fashion/testimonials/testimonials1.webp'],
                ['name' => 'David Lu', 'role' => 'Diretor executivo', 'text' => 'Agradecemos seu comentário. Estamos sempre buscando melhorar nossos produtos e gostaríamos de entender melhor essa questão.', 'rating' => 5, 'image' => '/fashion/testimonials/testimonials2.avif'],
            ]]],
            ['video_banner', ['subtitle' => 'Momentos de conforto', 'title' => 'VERDE-MEIA-NOITE', 'button_label' => 'Ver ofertas', 'button_url' => '/shop', 'image' => '', 'video_url' => '/active-wear/vedio/vedio-1.mp4']],
            ['shop_the_look', ['title' => 'Compre o look', 'image' => '/active-wear/lookbooks/lookbook-1.webp', 'product_slugs' => ['aw-womens-short-tops', 'aw-short-sleeve-shirt', 'aw-sports-bra-activewear', 'aw-women-sports-yoga-bra', 'aw-fits-long-sleeve-top', 'aw-flexfit-leggings-blouse']]],
            ['instagram', ['title' => 'Compre pelo Instagram', 'subtitle' => '', 'images' => [
                '/active-wear/instagram/instagram-1.avif',
                '/active-wear/instagram/instagram-2.avif',
                '/active-wear/instagram/instagram-3.avif',
                '/active-wear/instagram/instagram-4.avif',
                '/active-wear/instagram/instagram-45avif.avif',
            ]]],
            ['trust_badges', ['items' => [
                ['title' => 'Frete grátis', 'text' => 'Frete grátis em pedidos acima de US$ 100'],
                ['title' => 'Suporte online', 'text' => 'Atendimento 24 horas por dia, 7 dias por semana'],
                ['title' => 'Pagamento seguro', 'text' => 'Pague com diversos cartões de crédito'],
            ]]],
        ];

        foreach ($sections as $position => [$type, $content]) {
            $page->sections()->create([
                'type' => $type,
                'position' => $position,
                'is_active' => true,
                'content' => $content,
            ]);
        }
    }
}
