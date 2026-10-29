import { Link, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { FieldsEditor, emptyItem, type Content } from '@/components/cms-fields-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SECTION_DEFS, sectionDef } from '@/lib/cms-sections';
import { slugify } from '@/lib/slug';
import DashboardLayout from '@/layout/dashboard';

interface Section {
    id?: number;
    type: string;
    is_active: boolean;
    content: Content;
}

interface CmsPage {
    id: number;
    slug: string;
    title: string;
    meta_description: string | null;
    is_published: boolean;
    sections: Section[];
}

interface PageFormData {
    title: string;
    slug: string;
    meta_description: string;
    is_published: boolean;
    sections: Section[];
}

function CmsFormPage({ page }: { page: CmsPage | null }) {
    const route = useRoute();
    const isEditing = page !== null;
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
    const [open, setOpen] = useState<Record<number, boolean>>({});
    const { data, setData, post, put, processing, errors } = useForm<PageFormData>({
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        meta_description: page?.meta_description ?? '',
        is_published: page?.is_published ?? true,
        sections: page?.sections ?? [],
    });

    function updateSection(index: number, patch: Partial<Section>) {
        setData('sections', data.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
    }

    function moveSection(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= data.sections.length) return;
        const next = [...data.sections];
        [next[index], next[target]] = [next[target], next[index]];
        setData('sections', next);
        setOpen({});
    }

    function removeSection(index: number) {
        setData('sections', data.sections.filter((_, i) => i !== index));
        setOpen({});
    }

    function addSection(type: string) {
        const def = sectionDef(type);
        if (!def) return;
        setData('sections', [...data.sections, { type, is_active: true, content: emptyItem(def.fields) }]);
        setOpen({ [data.sections.length]: true });
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isEditing) {
            put(route('cms.update', page.id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Página atualizada'),
            });
            return;
        }

        post(route('cms.store'), { onSuccess: () => toast.success('Página criada') });
    }

    return (
        <main className="mx-auto w-full max-w-4xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">CMS</p>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Editar página' : 'Nova página'}</h1>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Dados da página</CardTitle>
                            <CardDescription>
                                O slug <code>home</code> é usado pela página principal da loja.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.title)}>
                                <FieldLabel htmlFor="cms-title">Título</FieldLabel>
                                <Input
                                    id="cms-title"
                                    value={data.title}
                                    onChange={(event) => {
                                        const title = event.target.value;
                                        setData((current) => ({
                                            ...current,
                                            title,
                                            ...(!slugManuallyEdited ? { slug: slugify(title) } : {}),
                                        }));
                                    }}
                                    aria-invalid={Boolean(errors.title)}
                                />
                                <FieldError>{errors.title}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.slug)}>
                                <FieldLabel htmlFor="cms-slug">Slug</FieldLabel>
                                <Input
                                    id="cms-slug"
                                    value={data.slug}
                                    onChange={(event) => {
                                        setSlugManuallyEdited(true);
                                        setData('slug', event.target.value);
                                    }}
                                    aria-invalid={Boolean(errors.slug)}
                                />
                                <FieldError>{errors.slug}</FieldError>
                            </Field>
                            <Field className="sm:col-span-2" data-invalid={Boolean(errors.meta_description)}>
                                <FieldLabel htmlFor="cms-meta">Meta descrição</FieldLabel>
                                <Textarea
                                    id="cms-meta"
                                    rows={2}
                                    value={data.meta_description}
                                    onChange={(event) => setData('meta_description', event.target.value)}
                                />
                                <FieldError>{errors.meta_description}</FieldError>
                            </Field>
                            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                <Checkbox
                                    checked={data.is_published}
                                    onChange={(event) => setData('is_published', event.target.checked)}
                                />
                                Página publicada
                            </label>
                        </FieldGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Seções</CardTitle>
                            <CardDescription>
                                Reordene, ative/desative e edite o conteúdo. A ordem abaixo é a ordem na página.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-5">
                        {data.sections.map((section, index) => {
                            const def = sectionDef(section.type);
                            const isOpen = open[index] ?? false;
                            return (
                                <div key={`${section.id ?? 'new'}-${index}`} className="rounded-lg border">
                                    <div className="flex items-center gap-2 p-3">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={isOpen ? 'Recolher' : 'Expandir'}
                                            onClick={() => setOpen((current) => ({ ...current, [index]: !isOpen }))}
                                        >
                                            {isOpen ? <ChevronDown /> : <ChevronRight />}
                                        </Button>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium">{def?.label ?? section.type}</div>
                                            <div className="text-muted-foreground truncate text-xs">{def?.description}</div>
                                        </div>
                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={section.is_active}
                                                onChange={(event) => updateSection(index, { is_active: event.target.checked })}
                                            />
                                            Ativa
                                        </label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Mover para cima"
                                            disabled={index === 0}
                                            onClick={() => moveSection(index, -1)}
                                        >
                                            <ArrowUp />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Mover para baixo"
                                            disabled={index === data.sections.length - 1}
                                            onClick={() => moveSection(index, 1)}
                                        >
                                            <ArrowDown />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remover seção"
                                            onClick={() => removeSection(index)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                    {isOpen && def && (
                                        <div className="border-t p-4">
                                            <FieldsEditor
                                                fields={def.fields}
                                                value={section.content}
                                                onChange={(content) => updateSection(index, { content })}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {data.sections.length === 0 && (
                            <p className="text-muted-foreground py-6 text-center text-sm">Nenhuma seção adicionada.</p>
                        )}
                        <FieldError>{errors.sections}</FieldError>

                        <div className="border-t pt-4">
                            <p className="mb-2 text-sm font-medium">Adicionar seção</p>
                            <div className="flex flex-wrap gap-2">
                                {SECTION_DEFS.map((def) => (
                                    <Button
                                        key={def.type}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        title={def.description}
                                        onClick={() => addSection(def.type)}
                                    >
                                        <Plus /> {def.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button asChild variant="outline">
                        <Link href={route('cms.index')}>Voltar</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar página'}
                    </Button>
                </div>
            </form>
        </main>
    );
}

CmsFormPage.layout = (page: React.ReactNode) => {
    const cms = (page as React.ReactElement<{ page: CmsPage | null }>).props.page;

    return (
        <DashboardLayout
            breadcrumb={[{ title: 'CMS', href: '/cms' }, { title: cms ? 'Editar página' : 'Nova página' }]}
        >
            {page}
        </DashboardLayout>
    );
};

export default CmsFormPage;
