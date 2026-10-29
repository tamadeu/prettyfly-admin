import { useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/layout/dashboard';

interface Profile {
    name: string;
    email: string;
}

export default function ProfilePage({ profile }: { profile: Profile }) {
    const nameForm = useForm({ name: profile.name });
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function updateName(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        nameForm.put(route('profile.name.update'), {
            preserveScroll: true,
            errorBag: 'updateName',
            onSuccess: () => toast.success('Nome atualizado'),
        });
    }

    function updatePassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        passwordForm.put(route('profile.password.update'), {
            preserveScroll: true,
            errorBag: 'updatePassword',
            onSuccess: () => {
                passwordForm.reset();
                toast.success('Senha atualizada');
            },
        });
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Sua conta</p>
                <h1 className="text-2xl font-semibold">Perfil</h1>
                <p className="text-muted-foreground mt-1 text-sm">Atualize suas informações pessoais e credenciais de acesso.</p>
            </div>

            <form onSubmit={updateName} className="rounded-lg border bg-card px-5 sm:px-7">
                <FormSection title="Informações pessoais" description="O nome aparece na navegação e identifica sua conta.">
                    <FieldGroup className="gap-5">
                        <Field data-invalid={Boolean(nameForm.errors.name)}>
                            <FieldLabel htmlFor="name">Nome</FieldLabel>
                            <Input
                                id="name"
                                value={nameForm.data.name}
                                onChange={(event) => nameForm.setData('name', event.target.value)}
                                aria-invalid={Boolean(nameForm.errors.name)}
                                autoComplete="name"
                            />
                            <FieldError>{nameForm.errors.name}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="email">E-mail</FieldLabel>
                            <Input id="email" type="email" value={profile.email} disabled readOnly />
                            <FieldDescription>O e-mail não pode ser alterado nesta página.</FieldDescription>
                        </Field>
                    </FieldGroup>
                </FormSection>

                <FormActions processing={nameForm.processing} onReset={() => nameForm.reset()} />
            </form>

            <form onSubmit={updatePassword} className="rounded-lg border bg-card px-5 sm:px-7">
                <FormSection title="Alterar senha" description="Confirme sua senha atual antes de definir uma nova.">
                    <FieldGroup className="gap-5">
                        <PasswordField
                            id="current-password"
                            label="Senha atual"
                            value={passwordForm.data.current_password}
                            error={passwordForm.errors.current_password}
                            autoComplete="current-password"
                            onChange={(value) => passwordForm.setData('current_password', value)}
                        />
                        <div className="grid gap-5 sm:grid-cols-2">
                            <PasswordField
                                id="new-password"
                                label="Nova senha"
                                value={passwordForm.data.password}
                                error={passwordForm.errors.password}
                                autoComplete="new-password"
                                onChange={(value) => passwordForm.setData('password', value)}
                            />
                            <PasswordField
                                id="password-confirmation"
                                label="Confirmar nova senha"
                                value={passwordForm.data.password_confirmation}
                                error={passwordForm.errors.password_confirmation}
                                autoComplete="new-password"
                                onChange={(value) => passwordForm.setData('password_confirmation', value)}
                            />
                        </div>
                    </FieldGroup>
                </FormSection>

                <FormActions processing={passwordForm.processing} onReset={() => passwordForm.reset()} />
            </form>
        </main>
    );
}

function PasswordField({ id, label, value, error, autoComplete, onChange }: { id: string; label: string; value: string; error?: string; autoComplete: string; onChange: (value: string) => void }) {
    return (
        <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input id={id} type="password" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} autoComplete={autoComplete} />
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

function FormActions({ processing, onReset }: { processing: boolean; onReset: () => void }) {
    return (
        <div className="flex flex-col-reverse gap-2 border-t py-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onReset} disabled={processing}>Descartar</Button>
            <Button type="submit" disabled={processing}>{processing ? 'Salvando...' : 'Salvar alterações'}</Button>
        </div>
    );
}

ProfilePage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Perfil' }]}>{page}</DashboardLayout>
);