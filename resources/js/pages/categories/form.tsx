import { Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { ImageField } from '@/components/cms-image-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { slugify } from '@/lib/slug';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    hero_image_url: string | null;
}

interface CategoryFormData {
    name: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    hero_image_url: string;
}

function CategoryFormPage({ category }: { category: Category | null }) {
    const route = useRoute();
    const isEditing = category !== null;
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const { data, setData, post, put, processing, errors } = useForm<CategoryFormData>({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        description: category?.description ?? '',
        thumbnail_url: category?.thumbnail_url ?? '',
        hero_image_url: category?.hero_image_url ?? '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(isEditing ? 'Categoria atualizada' : 'Categoria criada'),
        };

        if (isEditing) {
            put(route('categorias.update', category.id), options);
            return;
        }

        post(route('categorias.store'), options);
    }

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Parametrizações</p>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Editar categoria' : 'Nova categoria'}</h1>
                <p className="text-muted-foreground mt-1 text-sm">Configure uma categoria para organizar o catálogo.</p>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Dados da categoria</CardTitle>
                            <CardDescription>Nome e identificador da categoria na loja.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="category-name">Nome</FieldLabel>
                                <Input
                                    id="category-name"
                                    value={data.name}
                                    onChange={(event) => {
                                        const name = event.target.value;
                                        setData((current) => ({
                                            ...current,
                                            name,
                                            ...(!slugManuallyEdited ? { slug: slugify(name) } : {}),
                                        }));
                                    }}
                                    aria-invalid={Boolean(errors.name)}
                                    autoFocus
                                />
                                <FieldError>{errors.name}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.slug)}>
                                <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
                                <Input
                                    id="category-slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        setSlugManuallyEdited(true);
                                        setData('slug', event.target.value);
                                    }}
                                    aria-invalid={Boolean(errors.slug)}
                                    placeholder="nome-da-categoria"
                                />
                                <p className="text-muted-foreground text-sm">
                                    Gerado pelo nome. Você também pode personalizá-lo; acentos e espaços viram hífens.
                                </p>
                                <FieldError>{errors.slug}</FieldError>
                            </Field>
                            <Field className="sm:col-span-2" data-invalid={Boolean(errors.description)}>
                                <FieldLabel htmlFor="category-description">Descrição</FieldLabel>
                                <Textarea
                                    id="category-description"
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    aria-invalid={Boolean(errors.description)}
                                    rows={4}
                                />
                                <FieldError>{errors.description}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.thumbnail_url)}>
                                <FieldLabel>Thumbnail</FieldLabel>
                                <ImageField value={data.thumbnail_url} onChange={(value) => setData('thumbnail_url', value)} />
                                <p className="text-muted-foreground text-sm">Imagem do card da categoria. Sugestão: quadrada, 600×600px.</p>
                                <FieldError>{errors.thumbnail_url}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.hero_image_url)}>
                                <FieldLabel>Imagem de hero</FieldLabel>
                                <ImageField value={data.hero_image_url} onChange={(value) => setData('hero_image_url', value)} />
                                <p className="text-muted-foreground text-sm">Banner do topo da página da categoria. Sugestão: 1920×600px.</p>
                                <FieldError>{errors.hero_image_url}</FieldError>
                            </Field>
                        </FieldGroup>
                        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                            <Button asChild variant="outline">
                                <Link href={route('categorias.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </main>
    );
}

CategoryFormPage.layout = (page: React.ReactNode) => {
    const category = (page as React.ReactElement<{ category: Category | null }>).props.category;

    return (
        <DashboardLayout
            breadcrumb={[
                { title: 'Categorias', href: '/categorias' },
                { title: category ? 'Editar categoria' : 'Nova categoria' },
            ]}
        >
            {page}
        </DashboardLayout>
    );
};

export default CategoryFormPage;
