import { useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { ImageField } from '@/components/cms-image-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

interface Settings {
    title: string | null;
    description: string | null;
    favicon_url: string | null;
}

function SiteSettingsPage({ settings }: { settings: Settings }) {
    const route = useRoute();
    const { data, setData, put, processing, errors } = useForm({
        title: settings.title ?? '',
        description: settings.description ?? '',
        favicon_url: settings.favicon_url ?? '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        put(route('site.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Configurações salvas'),
        });
    }

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Site</p>
                <h1 className="text-2xl font-semibold">Geral</h1>
                <p className="text-muted-foreground mt-1 text-sm">Título, descrição e favicon exibidos no navegador e nos buscadores.</p>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Identidade do site</CardTitle>
                        <CardDescription>Vazio usa os valores padrão do site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <FieldGroup className="gap-5">
                            <Field data-invalid={Boolean(errors.title)}>
                                <FieldLabel htmlFor="site-title">Título do site</FieldLabel>
                                <Input id="site-title" value={data.title} maxLength={80} onChange={(e) => setData('title', e.target.value)} placeholder="PrettyFly Fitness Wear" />
                                <p className="text-muted-foreground text-sm">Aparece na aba do navegador, como “Página | Título”.</p>
                                <FieldError>{errors.title}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.description)}>
                                <FieldLabel htmlFor="site-description">Descrição (SEO)</FieldLabel>
                                <Textarea id="site-description" rows={3} maxLength={300} value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                <FieldError>{errors.description}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.favicon_url)}>
                                <FieldLabel>Favicon</FieldLabel>
                                <ImageField value={data.favicon_url} onChange={(value) => setData('favicon_url', value)} />
                                <p className="text-muted-foreground text-sm">Recomendado: PNG quadrado de 512×512px (ou .ico). O navegador pode demorar para atualizar o ícone.</p>
                                <FieldError>{errors.favicon_url}</FieldError>
                            </Field>
                        </FieldGroup>
                        <div className="flex justify-end border-t pt-5">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Salvando...' : 'Salvar alterações'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </main>
    );
}

SiteSettingsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Site' }, { title: 'Geral' }]}>{page}</DashboardLayout>
);

export default SiteSettingsPage;
