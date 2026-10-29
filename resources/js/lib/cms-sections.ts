export type FieldDef =
    | { key: string; label: string; kind: 'text' | 'textarea' | 'number' | 'datetime' | 'image' | 'boolean' | 'collection'; hint?: string }
    | { key: string; label: string; kind: 'list'; itemLabel: string; fields: FieldDef[] }
    | { key: string; label: string; kind: 'strings'; hint?: string }
    | { key: string; label: string; kind: 'images'; hint?: string };

export interface SectionDef {
    type: string;
    label: string;
    description: string;
    fields: FieldDef[];
}

const link = (prefix = ''): FieldDef[] => [
    { key: `${prefix}button_label`, label: 'Texto do botão', kind: 'text' },
    { key: `${prefix}button_url`, label: 'Link do botão', kind: 'text' },
];

export const SECTION_DEFS: SectionDef[] = [
    {
        type: 'hero',
        label: 'Banner principal (Hero)',
        description: 'Slides de destaque no topo da página.',
        fields: [
            {
                key: 'slides',
                label: 'Slides',
                kind: 'list',
                itemLabel: 'Slide',
                fields: [
                    { key: 'title', label: 'Título', kind: 'textarea', hint: 'Use Enter para quebrar a linha.' },
                    { key: 'subtitle', label: 'Subtítulo', kind: 'textarea' },
                    ...link(),
                    { key: 'image', label: 'Imagem', kind: 'image', hint: 'Recomendado: 1780x742' },
                ],
            },
        ],
    },
    {
        type: 'explore_categories',
        label: 'Explorar categorias',
        description: 'Carrossel de categorias com imagem.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            { key: 'link_label', label: 'Texto do link', kind: 'text' },
            { key: 'link_url', label: 'URL do link', kind: 'text' },
            {
                key: 'items',
                label: 'Categorias',
                kind: 'list',
                itemLabel: 'Categoria',
                fields: [
                    { key: 'name', label: 'Nome', kind: 'text' },
                    { key: 'url', label: 'Link', kind: 'text' },
                    { key: 'image', label: 'Imagem', kind: 'image' },
                ],
            },
        ],
    },
    {
        type: 'promo_grid',
        label: 'Grade promocional',
        description: 'Cards promocionais lado a lado.',
        fields: [
            {
                key: 'items',
                label: 'Cards',
                kind: 'list',
                itemLabel: 'Card',
                fields: [
                    { key: 'eyebrow', label: 'Texto superior', kind: 'text' },
                    { key: 'title', label: 'Título', kind: 'text' },
                    { key: 'link_label', label: 'Texto do link', kind: 'text' },
                    { key: 'link_url', label: 'URL do link', kind: 'text' },
                    { key: 'image', label: 'Imagem', kind: 'image', hint: 'Recomendado: 463x580' },
                ],
            },
        ],
    },
    {
        type: 'new_arrivals',
        label: 'Novidades (produtos)',
        description: 'Grade de produtos do catálogo.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            { key: 'collection', label: 'Coleção', kind: 'collection', hint: 'Vazio mostra os produtos padrão da vitrine.' },
            { key: 'limit', label: 'Quantidade de produtos', kind: 'number', hint: 'Os 8 primeiros aparecem de início; o restante após "carregar mais".' },
            { key: 'load_more_label', label: 'Texto do botão "carregar mais"', kind: 'text' },
        ],
    },
    {
        type: 'countdown',
        label: 'Contagem regressiva',
        description: 'Faixa com cronômetro de oferta.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            { key: 'text', label: 'Texto', kind: 'textarea' },
            { key: 'ends_at', label: 'Termina em', kind: 'datetime' },
            ...link(),
        ],
    },
    {
        type: 'tab_content',
        label: 'Imagem com abas',
        description: 'Imagem ao lado de abas com descrição.',
        fields: [
            { key: 'video_url', label: 'Vídeo da 2ª aba (URL de embed)', kind: 'text' },
            ...link(),
            {
                key: 'tabs',
                label: 'Abas',
                kind: 'list',
                itemLabel: 'Aba',
                fields: [
                    { key: 'title', label: 'Título', kind: 'text' },
                    { key: 'description', label: 'Descrição', kind: 'textarea' },
                    { key: 'image', label: 'Imagem', kind: 'image', hint: 'Recomendado: 670x720' },
                ],
            },
        ],
    },
    {
        type: 'testimonials',
        label: 'Depoimentos',
        description: 'Avaliações de clientes.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            {
                key: 'items',
                label: 'Depoimentos',
                kind: 'list',
                itemLabel: 'Depoimento',
                fields: [
                    { key: 'name', label: 'Nome', kind: 'text' },
                    { key: 'role', label: 'Cargo', kind: 'text' },
                    { key: 'text', label: 'Texto', kind: 'textarea' },
                    { key: 'rating', label: 'Nota (1 a 5)', kind: 'number' },
                    { key: 'image', label: 'Foto', kind: 'image' },
                ],
            },
        ],
    },
    {
        type: 'video_banner',
        label: 'Banner com vídeo',
        description: 'Banner de largura total com vídeo ou imagem.',
        fields: [
            { key: 'subtitle', label: 'Subtítulo', kind: 'text' },
            { key: 'title', label: 'Título', kind: 'text' },
            ...link(),
            { key: 'image', label: 'Imagem de capa', kind: 'image' },
            { key: 'video_url', label: 'Vídeo (URL)', kind: 'text', hint: 'Vazio usa o vídeo padrão.' },
        ],
    },
    {
        type: 'shop_the_look',
        label: 'Shop the look',
        description: 'Imagem com produtos marcados.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            { key: 'image', label: 'Imagem', kind: 'image', hint: 'Recomendado: 705x705' },
            { key: 'product_slugs', label: 'Slugs dos produtos', kind: 'strings', hint: 'Um slug por linha.' },
        ],
    },
    {
        type: 'instagram',
        label: 'Instagram',
        description: 'Galeria de fotos.',
        fields: [
            { key: 'title', label: 'Título', kind: 'text' },
            { key: 'subtitle', label: 'Subtítulo', kind: 'text', hint: 'Vazio usa o texto padrão.' },
            { key: 'images', label: 'Imagens', kind: 'images' },
        ],
    },
    {
        type: 'trust_badges',
        label: 'Selos de confiança',
        description: 'Frete, suporte e pagamento.',
        fields: [
            {
                key: 'items',
                label: 'Selos',
                kind: 'list',
                itemLabel: 'Selo',
                fields: [
                    { key: 'title', label: 'Título', kind: 'text' },
                    { key: 'text', label: 'Texto', kind: 'text' },
                ],
            },
        ],
    },
];

export function sectionDef(type: string): SectionDef | undefined {
    return SECTION_DEFS.find((def) => def.type === type);
}
