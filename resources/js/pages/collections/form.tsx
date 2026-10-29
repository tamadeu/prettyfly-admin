import { Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { ImageField } from '@/components/cms-image-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';
import { slugify } from '@/lib/slug';

interface ProductRef {
    id: number;
    name: string;
    slug: string;
}

interface Rules {
    category_ids?: number[];
    brand_ids?: number[];
    min_price?: string | number | null;
    max_price?: string | number | null;
    in_stock?: boolean;
    name_contains?: string | null;
    created_days?: string | number | null;
    attributes?: { name: string; value: string }[];
}

interface Collection {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    hero_image_url: string | null;
    thumbnail_url: string | null;
    type: 'manual' | 'dynamic';
    sort: string;
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    rules: Rules;
    products: ProductRef[];
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    hero_image_url: string;
    thumbnail_url: string;
    type: 'manual' | 'dynamic';
    sort: string;
    is_active: boolean;
    starts_at: string;
    ends_at: string;
    product_ids: number[];
    rules: Rules;
}

interface Props {
    collection: Collection | null;
    categories: { id: number; name: string }[];
    brands: { id: number; name: string }[];
}

const sortLabels: Record<string, string> = {
    manual: 'Ordem manual',
    newest: 'Mais recentes',
    oldest: 'Mais antigos',
    price_asc: 'Menor preço',
    price_desc: 'Maior preço',
    name: 'Nome (A–Z)',
};

function toggle<T>(list: T[] | undefined, value: T): T[] {
    const current = list ?? [];
    return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function ProductPicker({ products, onChange }: { products: ProductRef[]; onChange: (products: ProductRef[]) => void }) {
    const route = useRoute();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductRef[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            axios
                .get<ProductRef[]>(route('colecoes.products'), { params: { q: query } })
                .then(({ data }) => setResults(data))
                .catch(() => setResults([]));
        }, 250);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const selectedIds = new Set(products.map((product) => product.id));

    function move(index: number, delta: number) {
        const next = [...products];
        const target = index + delta;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
                <FieldLabel htmlFor="product-search">Buscar produtos</FieldLabel>
                <Input
                    id="product-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome ou slug do produto"
                />
                <ul className="divide-y rounded-md border">
                    {results.map((product) => (
                        <li key={product.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span className="truncate">{product.name}</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={selectedIds.has(product.id)}
                                onClick={() => onChange([...products, product])}
                            >
                                <Plus /> Adicionar
                            </Button>
                        </li>
                    ))}
                    {results.length === 0 && <li className="text-muted-foreground px-3 py-4 text-sm">Nenhum produto encontrado.</li>}
                </ul>
            </div>
            <div className="space-y-2">
                <FieldLabel>Produtos na coleção ({products.length})</FieldLabel>
                <ul className="divide-y rounded-md border">
                    {products.map((product, index) => (
                        <li key={product.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span className="truncate">
                                {index + 1}. {product.name}
                            </span>
                            <span className="flex shrink-0">
                                <Button type="button" size="icon" variant="ghost" aria-label="Subir" onClick={() => move(index, -1)}>
                                    <ArrowUp />
                                </Button>
                                <Button type="button" size="icon" variant="ghost" aria-label="Descer" onClick={() => move(index, 1)}>
                                    <ArrowDown />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Remover ${product.name}`}
                                    onClick={() => onChange(products.filter((item) => item.id !== product.id))}
                                >
                                    <X />
                                </Button>
                            </span>
                        </li>
                    ))}
                    {products.length === 0 && <li className="text-muted-foreground px-3 py-4 text-sm">Nenhum produto adicionado.</li>}
                </ul>
            </div>
        </div>
    );
}

function RulesEditor({
    rules,
    onChange,
    categories,
    brands,
}: {
    rules: Rules;
    onChange: (rules: Rules) => void;
    categories: Props['categories'];
    brands: Props['brands'];
}) {
    const route = useRoute();
    const [preview, setPreview] = useState<{ count: number; sample: string[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const set = (patch: Partial<Rules>) => onChange({ ...rules, ...patch });
    const attributes = rules.attributes ?? [];

    async function runPreview() {
        setLoading(true);
        try {
            const { data } = await axios.post(route('colecoes.preview'), { rules });
            setPreview(data);
        } catch {
            toast.error('Verifique os filtros informados.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-5">
            <p className="text-muted-foreground text-sm">
                Os produtos entram na coleção automaticamente quando atendem a todos os filtros preenchidos.
            </p>

            <Field>
                <FieldLabel>Categorias</FieldLabel>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={(rules.category_ids ?? []).includes(category.id)}
                                onChange={() => set({ category_ids: toggle(rules.category_ids, category.id) })}
                            />
                            {category.name}
                        </label>
                    ))}
                    {categories.length === 0 && <span className="text-muted-foreground text-sm">Nenhuma categoria cadastrada.</span>}
                </div>
            </Field>

            <Field>
                <FieldLabel>Marcas</FieldLabel>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {brands.map((brand) => (
                        <label key={brand.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={(rules.brand_ids ?? []).includes(brand.id)}
                                onChange={() => set({ brand_ids: toggle(rules.brand_ids, brand.id) })}
                            />
                            {brand.name}
                        </label>
                    ))}
                    {brands.length === 0 && (
                        <span className="text-muted-foreground text-sm">Nenhuma marca cadastrada.</span>
                    )}
                </div>
            </Field>

            <FieldGroup className="gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                <Field>
                    <FieldLabel htmlFor="rule-min">Preço mínimo</FieldLabel>
                    <Input id="rule-min" type="number" min="0" step="0.01" value={rules.min_price ?? ''} onChange={(e) => set({ min_price: e.target.value })} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="rule-max">Preço máximo</FieldLabel>
                    <Input id="rule-max" type="number" min="0" step="0.01" value={rules.max_price ?? ''} onChange={(e) => set({ max_price: e.target.value })} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="rule-days">Criados nos últimos (dias)</FieldLabel>
                    <Input id="rule-days" type="number" min="1" value={rules.created_days ?? ''} onChange={(e) => set({ created_days: e.target.value })} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="rule-name">Nome contém</FieldLabel>
                    <Input id="rule-name" value={rules.name_contains ?? ''} onChange={(e) => set({ name_contains: e.target.value })} />
                </Field>
            </FieldGroup>

            <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={Boolean(rules.in_stock)} onChange={(e) => set({ in_stock: e.target.checked })} />
                Somente produtos em estoque
            </label>

            <Field>
                <FieldLabel>Atributos das variantes (cor, tamanho…)</FieldLabel>
                <div className="space-y-2">
                    {attributes.map((attribute, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                placeholder="Atributo (ex.: Cor)"
                                value={attribute.name}
                                onChange={(e) => set({ attributes: attributes.map((a, i) => (i === index ? { ...a, name: e.target.value } : a)) })}
                            />
                            <Input
                                placeholder="Valor (ex.: Preto)"
                                value={attribute.value}
                                onChange={(e) => set({ attributes: attributes.map((a, i) => (i === index ? { ...a, value: e.target.value } : a)) })}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Remover atributo"
                                onClick={() => set({ attributes: attributes.filter((_, i) => i !== index) })}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => set({ attributes: [...attributes, { name: '', value: '' }] })}>
                        <Plus /> Adicionar atributo
                    </Button>
                </div>
            </Field>

            <div className="bg-muted/40 space-y-2 rounded-md border p-4">
                <Button type="button" variant="outline" size="sm" onClick={runPreview} disabled={loading}>
                    {loading ? 'Calculando...' : 'Pré-visualizar produtos'}
                </Button>
                {preview && (
                    <p className="text-sm">
                        <strong>{preview.count}</strong> produto(s) correspondem.
                        {preview.sample.length > 0 && <span className="text-muted-foreground"> Ex.: {preview.sample.join(', ')}</span>}
                    </p>
                )}
            </div>
        </div>
    );
}

function CollectionFormPage({ collection, categories, brands }: Props) {
    const route = useRoute();
    const isEditing = collection !== null;
    const [slugEdited, setSlugEdited] = useState(isEditing);
    const [products, setProducts] = useState<ProductRef[]>(collection?.products ?? []);
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        name: collection?.name ?? '',
        slug: collection?.slug ?? '',
        description: collection?.description ?? '',
        hero_image_url: collection?.hero_image_url ?? '',
        thumbnail_url: collection?.thumbnail_url ?? '',
        type: collection?.type ?? 'manual',
        sort: collection?.sort ?? 'newest',
        is_active: collection?.is_active ?? true,
        starts_at: collection?.starts_at ?? '',
        ends_at: collection?.ends_at ?? '',
        product_ids: collection?.products.map((product) => product.id) ?? [],
        rules: collection && !Array.isArray(collection.rules) ? collection.rules : {},
    });

    const errorOf = (key: string) => (errors as Record<string, string>)[key];

    function updateProducts(next: ProductRef[]) {
        setProducts(next);
        setData('product_ids', next.map((product) => product.id));
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(isEditing ? 'Coleção atualizada' : 'Coleção criada'),
        };

        if (isEditing) {
            put(route('colecoes.update', collection.id), options);
            return;
        }

        post(route('colecoes.store'), options);
    }

    return (
        <main className="mx-auto w-full max-w-4xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Catálogo</p>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Editar coleção' : 'Nova coleção'}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Página pública: <code>/colecoes/{data.slug || 'slug'}</code>
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados da coleção</CardTitle>
                        <CardDescription>Identificação, imagens e vigência.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="col-name">Nome</FieldLabel>
                                <Input
                                    id="col-name"
                                    value={data.name}
                                    onChange={(event) => {
                                        const name = event.target.value;
                                        setData((current) => ({ ...current, name, ...(!slugEdited ? { slug: slugify(name) } : {}) }));
                                    }}
                                    autoFocus
                                />
                                <FieldError>{errors.name}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.slug)}>
                                <FieldLabel htmlFor="col-slug">Slug</FieldLabel>
                                <Input
                                    id="col-slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        setSlugEdited(true);
                                        setData('slug', event.target.value);
                                    }}
                                />
                                <FieldError>{errors.slug}</FieldError>
                            </Field>
                            <Field className="sm:col-span-2" data-invalid={Boolean(errors.description)}>
                                <FieldLabel htmlFor="col-description">Descrição</FieldLabel>
                                <Textarea id="col-description" rows={3} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                <FieldError>{errors.description}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.thumbnail_url)}>
                                <FieldLabel>Thumbnail</FieldLabel>
                                <ImageField value={data.thumbnail_url} onChange={(value) => setData('thumbnail_url', value)} />
                                <FieldError>{errors.thumbnail_url}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.hero_image_url)}>
                                <FieldLabel>Imagem de hero</FieldLabel>
                                <ImageField value={data.hero_image_url} onChange={(value) => setData('hero_image_url', value)} />
                                <FieldError>{errors.hero_image_url}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.starts_at)}>
                                <FieldLabel htmlFor="col-start">Início da vigência</FieldLabel>
                                <Input id="col-start" type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} />
                                <FieldError>{errors.starts_at}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.ends_at)}>
                                <FieldLabel htmlFor="col-end">Fim da vigência</FieldLabel>
                                <Input id="col-end" type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} />
                                <FieldError>{errors.ends_at}</FieldError>
                            </Field>
                            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                <Checkbox checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                Coleção ativa (visível no site dentro da vigência)
                            </label>
                        </FieldGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Produtos</CardTitle>
                        <CardDescription>Escolha os produtos manualmente ou defina regras.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="col-type">Tipo</FieldLabel>
                                <Select
                                    id="col-type"
                                    value={data.type}
                                    onChange={(e) => {
                                        const type = e.target.value as FormData['type'];
                                        setData((current) => ({ ...current, type, sort: type === 'dynamic' && current.sort === 'manual' ? 'newest' : current.sort }));
                                    }}
                                >
                                    <option value="manual">Manual (escolho os produtos)</option>
                                    <option value="dynamic">Dinâmica (por filtros)</option>
                                </Select>
                            </Field>
                            <Field data-invalid={Boolean(errors.sort)}>
                                <FieldLabel htmlFor="col-sort">Ordenação</FieldLabel>
                                <Select id="col-sort" value={data.sort} onChange={(e) => setData('sort', e.target.value)}>
                                    {Object.entries(sortLabels)
                                        .filter(([value]) => data.type === 'manual' || value !== 'manual')
                                        .map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                </Select>
                                <FieldError>{errors.sort}</FieldError>
                            </Field>
                        </FieldGroup>

                        {data.type === 'manual' ? (
                            <>
                                <ProductPicker products={products} onChange={updateProducts} />
                                <FieldError>{errorOf('product_ids')}</FieldError>
                            </>
                        ) : (
                            <>
                                <RulesEditor rules={data.rules} onChange={(rules) => setData('rules', rules)} categories={categories} brands={brands} />
                                {Object.entries(errors)
                                    .filter(([key]) => key.startsWith('rules'))
                                    .map(([key, message]) => (
                                        <FieldError key={key}>{message}</FieldError>
                                    ))}
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button asChild variant="outline">
                        <Link href={route('colecoes.index')}>Cancelar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar coleção'}
                    </Button>
                </div>
            </form>
        </main>
    );
}

CollectionFormPage.layout = (page: React.ReactNode) => {
    const collection = (page as React.ReactElement<Props>).props.collection;

    return (
        <DashboardLayout
            breadcrumb={[{ title: 'Coleções', href: '/colecoes' }, { title: collection ? 'Editar coleção' : 'Nova coleção' }]}
        >
            {page}
        </DashboardLayout>
    );
};

export default CollectionFormPage;
