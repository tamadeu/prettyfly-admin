import { Link, useForm } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

interface Option { id: number; name: string }
interface Coupon {
    id: number; code: string; name: string; description: string | null; discount_type: 'percentage' | 'fixed';
    discount_value: string | number; minimum_order: string | number; starts_at: string | null; ends_at: string | null;
    usage_limit: number | null; per_customer_limit: number | null; is_active: boolean;
    products?: Option[]; categories?: Option[]; collections?: Option[];
}
interface FormData {
    code: string; name: string; description: string; discount_type: 'percentage' | 'fixed'; discount_value: string;
    minimum_order: string; starts_at: string; ends_at: string; usage_limit: string; per_customer_limit: string;
    is_active: boolean; product_ids: number[]; category_ids: number[]; collection_ids: number[];
}
const datetime = (value: string | null | undefined) => value ? value.slice(0, 16) : '';

function CouponFormPage({ coupon, products, categories, collections }: { coupon: Coupon | null; products: Option[]; categories: Option[]; collections: Option[] }) {
    const route = useRoute();
    const editing = Boolean(coupon);
    const { data, setData, post, put, processing, errors } = useForm<FormData>({
        code: coupon?.code ?? '', name: coupon?.name ?? '', description: coupon?.description ?? '',
        discount_type: coupon?.discount_type ?? 'percentage', discount_value: String(coupon?.discount_value ?? ''),
        minimum_order: String(coupon?.minimum_order ?? '0'), starts_at: datetime(coupon?.starts_at), ends_at: datetime(coupon?.ends_at),
        usage_limit: coupon?.usage_limit ? String(coupon.usage_limit) : '', per_customer_limit: coupon?.per_customer_limit ? String(coupon.per_customer_limit) : '',
        is_active: coupon?.is_active ?? true, product_ids: coupon?.products?.map((item) => item.id) ?? [],
        category_ids: coupon?.categories?.map((item) => item.id) ?? [], collection_ids: coupon?.collections?.map((item) => item.id) ?? [],
    });
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => toast.success(editing ? 'Cupom atualizado' : 'Cupom criado') };
        if (editing && coupon) put(route('cupons.update', coupon.id), options);
        else post(route('cupons.store'), options);
    }
    function targets(name: 'product_ids' | 'category_ids' | 'collection_ids', event: React.ChangeEvent<HTMLSelectElement>) {
        setData(name, Array.from(event.target.selectedOptions).map((option) => Number(option.value)));
    }

    return (
        <main className="mx-auto w-full max-w-4xl space-y-6">
            <div><p className="text-muted-foreground text-sm font-medium">Marketing</p><h1 className="text-2xl font-semibold">{editing ? 'Editar cupom' : 'Novo cupom'}</h1><p className="text-muted-foreground mt-1 text-sm">Defina desconto, validade, limites e produtos elegíveis.</p></div>
            <form onSubmit={submit} className="space-y-5">
                <Card><CardHeader><CardTitle>Dados do cupom</CardTitle><CardDescription>O código será salvo em letras maiúsculas.</CardDescription></CardHeader><CardContent className="space-y-5 pt-5">
                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                        <Field data-invalid={Boolean(errors.code)}><FieldLabel htmlFor="coupon-code">Código</FieldLabel><Input id="coupon-code" value={data.code} onChange={(e) => setData('code', e.target.value.toUpperCase())} placeholder="BEMVINDA10" aria-invalid={Boolean(errors.code)} /><FieldError>{errors.code}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.name)}><FieldLabel htmlFor="coupon-name">Nome interno</FieldLabel><Input id="coupon-name" value={data.name} onChange={(e) => setData('name', e.target.value)} aria-invalid={Boolean(errors.name)} /><FieldError>{errors.name}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.description)} className="sm:col-span-2"><FieldLabel htmlFor="coupon-description">Descrição</FieldLabel><Textarea id="coupon-description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} /><FieldError>{errors.description}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.discount_type)}><FieldLabel htmlFor="coupon-type">Tipo de desconto</FieldLabel><select id="coupon-type" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" value={data.discount_type} onChange={(e) => setData('discount_type', e.target.value as FormData['discount_type'])}><option value="percentage">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select><FieldError>{errors.discount_type}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.discount_value)}><FieldLabel htmlFor="coupon-value">Desconto {data.discount_type === 'percentage' ? '(%)' : '(R$)'}</FieldLabel><Input id="coupon-value" type="number" min="0.01" step="0.01" max={data.discount_type === 'percentage' ? 100 : undefined} value={data.discount_value} onChange={(e) => setData('discount_value', e.target.value)} aria-invalid={Boolean(errors.discount_value)} /><FieldError>{errors.discount_value}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.minimum_order)}><FieldLabel htmlFor="coupon-minimum">Pedido mínimo (R$)</FieldLabel><Input id="coupon-minimum" type="number" min="0" step="0.01" value={data.minimum_order} onChange={(e) => setData('minimum_order', e.target.value)} /><FieldError>{errors.minimum_order}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.usage_limit)}><FieldLabel htmlFor="coupon-limit">Limite total de usos</FieldLabel><Input id="coupon-limit" type="number" min="1" value={data.usage_limit} onChange={(e) => setData('usage_limit', e.target.value)} placeholder="Sem limite" /><FieldError>{errors.usage_limit}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.per_customer_limit)}><FieldLabel htmlFor="coupon-customer-limit">Usos por cliente</FieldLabel><Input id="coupon-customer-limit" type="number" min="1" value={data.per_customer_limit} onChange={(e) => setData('per_customer_limit', e.target.value)} placeholder="Sem limite" /><FieldError>{errors.per_customer_limit}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.starts_at)}><FieldLabel htmlFor="coupon-start">Início da validade</FieldLabel><Input id="coupon-start" type="datetime-local" value={data.starts_at} onChange={(e) => setData('starts_at', e.target.value)} /><FieldError>{errors.starts_at}</FieldError></Field>
                        <Field data-invalid={Boolean(errors.ends_at)}><FieldLabel htmlFor="coupon-end">Fim da validade</FieldLabel><Input id="coupon-end" type="datetime-local" value={data.ends_at} onChange={(e) => setData('ends_at', e.target.value)} /><FieldError>{errors.ends_at}</FieldError></Field>
                        <Field className="sm:col-span-2"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="size-4 rounded border-input" /> Cupom ativo</label></Field>
                    </FieldGroup>
                </CardContent></Card>
                <Card><CardHeader><CardTitle>Produtos elegíveis</CardTitle><CardDescription>Sem seleções, vale para todos os produtos. Com seleções, o produto pode corresponder a qualquer grupo escolhido.</CardDescription></CardHeader><CardContent className="space-y-5 pt-5">
                    {([{ key: 'product_ids', label: 'Produtos', options: products }, { key: 'category_ids', label: 'Categorias', options: categories }, { key: 'collection_ids', label: 'Coleções', options: collections }] as const).map((group) => (
                        <Field key={group.key} data-invalid={Boolean(errors[group.key])}><FieldLabel htmlFor={group.key}>{group.label}</FieldLabel><select id={group.key} multiple value={data[group.key].map(String)} onChange={(event) => targets(group.key, event)} className="border-input bg-background min-h-36 w-full rounded-md border p-2 text-sm">{group.options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select><p className="text-muted-foreground text-xs">Use Ctrl (Windows/Linux) ou Command (Mac) para selecionar várias opções.</p><FieldError>{errors[group.key]}</FieldError></Field>
                    ))}
                </CardContent></Card>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button asChild variant="outline"><Link href={route('cupons.index')}>Cancelar</Link></Button><Button type="submit" disabled={processing}>{processing ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar cupom'}</Button></div>
            </form>
        </main>
    );
}
CouponFormPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Marketing', href: '/cupons' }, { title: 'Cupons' }]}>{page}</DashboardLayout>;
export default CouponFormPage;
