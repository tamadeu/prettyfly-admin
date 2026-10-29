import { Link, useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/layout/dashboard';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
    birth_date: string | null;
    is_active: boolean;
}

interface CustomerFormData {
    name: string;
    email: string;
    password: string;
    phone: string;
    document: string;
    birth_date: string;
    is_active: boolean;
}

function CustomerFormPage({ customer }: { customer: Customer | null }) {
    const route = useRoute();
    const isEditing = customer !== null;
    const { data, setData, post, put, processing, errors } = useForm<CustomerFormData>({
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        password: '',
        phone: customer?.phone ?? '',
        document: customer?.document ?? '',
        birth_date: customer?.birth_date ?? '',
        is_active: customer?.is_active ?? true,
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => toast.success(isEditing ? 'Cliente atualizado' : 'Cliente criado'),
        };

        if (isEditing) {
            put(route('clientes.update', customer.id), options);
            return;
        }

        post(route('clientes.store'), options);
    }

    return (
        <main className="mx-auto w-full max-w-3xl space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Loja</p>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Editar cliente' : 'Novo cliente'}</h1>
            </div>

            <form onSubmit={submit}>
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>Dados do cliente</CardTitle>
                            <CardDescription>O cliente usa o e-mail e a senha para entrar no site.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="customer-name">Nome</FieldLabel>
                                <Input id="customer-name" value={data.name} onChange={(e) => setData('name', e.target.value)} aria-invalid={Boolean(errors.name)} autoFocus />
                                <FieldError>{errors.name}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.email)}>
                                <FieldLabel htmlFor="customer-email">E-mail</FieldLabel>
                                <Input id="customer-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} aria-invalid={Boolean(errors.email)} />
                                <FieldError>{errors.email}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.password)}>
                                <FieldLabel htmlFor="customer-password">{isEditing ? 'Nova senha' : 'Senha'}</FieldLabel>
                                <Input id="customer-password" type="password" autoComplete="new-password" value={data.password} onChange={(e) => setData('password', e.target.value)} aria-invalid={Boolean(errors.password)} />
                                <FieldDescription>
                                    {isEditing ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 8 caracteres.'}
                                </FieldDescription>
                                <FieldError>{errors.password}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.phone)}>
                                <FieldLabel htmlFor="customer-phone">Telefone</FieldLabel>
                                <Input id="customer-phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} />
                                <FieldError>{errors.phone}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.document)}>
                                <FieldLabel htmlFor="customer-document">CPF</FieldLabel>
                                <Input id="customer-document" value={data.document} onChange={(e) => setData('document', e.target.value)} aria-invalid={Boolean(errors.document)} />
                                <FieldError>{errors.document}</FieldError>
                            </Field>
                            <Field data-invalid={Boolean(errors.birth_date)}>
                                <FieldLabel htmlFor="customer-birth">Data de nascimento</FieldLabel>
                                <Input id="customer-birth" type="date" value={data.birth_date} onChange={(e) => setData('birth_date', e.target.value)} aria-invalid={Boolean(errors.birth_date)} />
                                <FieldError>{errors.birth_date}</FieldError>
                            </Field>
                            <Field className="sm:col-span-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                    Conta ativa
                                </label>
                                <FieldDescription>Desmarque para bloquear o acesso do cliente ao site.</FieldDescription>
                            </Field>
                        </FieldGroup>
                        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                            <Button asChild variant="outline">
                                <Link href={route('clientes.index')}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar cliente'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </main>
    );
}

CustomerFormPage.layout = (page: React.ReactNode) => {
    const customer = (page as React.ReactElement<{ customer: Customer | null }>).props.customer;

    return (
        <DashboardLayout breadcrumb={[{ title: 'Clientes', href: '/clientes' }, { title: customer ? 'Editar cliente' : 'Novo cliente' }]}>
            {page}
        </DashboardLayout>
    );
};

export default CustomerFormPage;
