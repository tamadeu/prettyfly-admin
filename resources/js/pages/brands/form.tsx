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

interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    hero_image_url: string | null;
}

interface BrandFormData {
    name: string;
    slug: string;
    description: string;
    logo_url: string;
    hero_image_url: string;
}

function BrandFormPage({ brand }: { brand: Brand | null }) {
    const route = useRoute();
    const isEditing = brand !== null;
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const { data, setData, post, put, processing, errors } = useForm<BrandFormData>({
        name: brand?.name ?? '',
        slug: brand?.slug ?? '',
        description: brand?.description ?? '',
        logo_url: brand?.logo_url ?? '',
        hero_image_url: brand?.hero_image_url ?? '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(isEditing ? 'Marca atualizada' : 'Marca criada'),
        };

        if (isEditing) {
            put(route('marcas.update', brand.id), options);
            return;
        }

        post(route('marcas.store'), options);
    }

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Catálogo</p>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Editar marca' : 'Nova marca'}</h1>
                <p className="text-muted-foreground mt-1 text-sm">Cadastre uma marca para vincular aos produtos.</p>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Dados da marca</CardTitle>
                            <CardDescription>Nome, identificador e imagens da marca.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="brand-name">Nome</FieldLabel>
                                <Input
                                    id="brand-name"
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
                                <FieldLabel htmlFor="brand-slug">Slug</FieldLabel>
                                <Input
                                    id="brand-slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        setSlugManuallyEdited(true);
                                        setData('slug', event.target.value);
                                    }}
                                    aria-invalid={Boolean(errors.slug)}
                                    placeholder="nome-da-marca"
                                />
                                <p className="text-muted-foreground text-sm">
                                    Gerado pelo nome. Você também pode personalizá-lo; acentos e espaços viram hífens.
                                </p>
                                <FieldError>{errors.slug}</FieldError>
                            </Field>
                            <Field className="sm:col-span-2" data-invalid={Boolean(errors.description)}>
                                <FieldLabel htmlFor="brand-description">Descrição</FieldLabel>
                                <Textarea
                                    id="brand-description"
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    aria-invalid={Boolean(errors.description)}
                                    rows={4}
                                />
                                <FieldError>{errors.description}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.logo_url)}>
                                <FieldLabel>Logo</FieldLabel>
                                <ImageField value={data.logo_url} onChange={(value) => setData('logo_url', value)} />
                                <p className="text-muted-foreground text-sm">Logo da marca. Sugestão: PNG ou WebP com fundo transparente.</p>
                                <FieldError>{errors.logo_url}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.hero_image_url)}>
                                <FieldLabel>Imagem de hero</FieldLabel>
                                <ImageField value={data.hero_image_url} onChange={(value) => setData('hero_image_url', value)} />
                                <p className="text-muted-foreground text-sm">Banner do topo da página da marca. Sugestão: 1920×600px.</p>
                                <FieldError>{errors.hero_image_url}</FieldError>
                            </Field>
                        </FieldGroup>
                        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                            <Button asChild variant="outline">
                                <Link href={route('marcas.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar marca'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </main>
    );
}

BrandFormPage.layout = (page: React.ReactNode) => {
    const brand = (page as React.ReactElement<{ brand: Brand | null }>).props.brand;

    return (
        <DashboardLayout
            breadcrumb={[
                { title: 'Marcas', href: '/marcas' },
                { title: brand ? 'Editar marca' : 'Nova marca' },
            ]}
        >
            {page}
        </DashboardLayout>
    );
};

export default BrandFormPage;
