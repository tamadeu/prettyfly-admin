import { useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/layout/dashboard';

interface Settings {
    application_name: string;
    primary_color: string;
    secondary_color: string;
    tertiary_color: string;
}

export default function ApplicationSettingsPage({ settings }: { settings: Settings }) {
    const { data, setData, put, processing, errors, reset } = useForm(settings);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        put(route('settings.application.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Configurações salvas'),
        });
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Personalização</p>
                <h1 className="text-2xl font-semibold">Configurações</h1>
                <p className="text-muted-foreground mt-1 text-sm">Defina a identidade visual usada em toda a aplicação.</p>
            </div>

            <form onSubmit={submit} className="rounded-lg border bg-card px-5 sm:px-7">
                <FormSection title="Aplicação" description="Nome exibido na navegação e no título da página.">
                    <Field data-invalid={Boolean(errors.application_name)}>
                        <FieldLabel htmlFor="application-name">Nome da aplicação</FieldLabel>
                        <Input
                            id="application-name"
                            value={data.application_name}
                            onChange={(event) => setData('application_name', event.target.value)}
                            aria-invalid={Boolean(errors.application_name)}
                        />
                        <FieldError>{errors.application_name}</FieldError>
                    </Field>
                </FormSection>

                <div className="border-t" />

                <FormSection title="Cores da marca" description="As cores são aplicadas imediatamente após salvar.">
                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-3">
                        <ColorField label="Primária" name="primary_color" value={data.primary_color} error={errors.primary_color} onChange={(value) => setData('primary_color', value)} />
                        <ColorField label="Secundária" name="secondary_color" value={data.secondary_color} error={errors.secondary_color} onChange={(value) => setData('secondary_color', value)} />
                        <ColorField label="Terciária" name="tertiary_color" value={data.tertiary_color} error={errors.tertiary_color} onChange={(value) => setData('tertiary_color', value)} />
                    </FieldGroup>
                </FormSection>

                <div className="flex flex-col-reverse gap-2 border-t py-5 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => reset()} disabled={processing}>Descartar</Button>
                    <Button type="submit" disabled={processing}>{processing ? 'Salvando...' : 'Salvar alterações'}</Button>
                </div>
            </form>
        </main>
    );
}

function ColorField({ label, name, value, error, onChange }: { label: string; name: keyof Settings; value: string; error?: string; onChange: (value: string) => void }) {
    return (
        <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <div className="flex gap-2">
                <Input className="h-9 w-12 shrink-0 cursor-pointer p-1" id={name} type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`Selecionar cor ${label.toLowerCase()}`} />
                <Input value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} maxLength={7} />
            </div>
            <FieldDescription>Formato hexadecimal, por exemplo #2f2f6b.</FieldDescription>
            <FieldError>{error}</FieldError>
        </Field>
    );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="grid gap-6 py-8 md:grid-cols-[minmax(0,190px)_minmax(0,1fr)] md:gap-12">
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
            </div>
            <div>{children}</div>
        </section>
    );
}

ApplicationSettingsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Configurações' }]}>{page}</DashboardLayout>
);