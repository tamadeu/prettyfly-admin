import React from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/layout/dashboard';

interface Settings {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    origin_postal_code: string;
    contact_email: string | null;
    services: string[];
    has_token: boolean;
    free_shipping_enabled: boolean;
    free_shipping_minimum: string | null;
}
const services = [['1', 'PAC'], ['2', 'SEDEX'], ['17', 'Mini Envios'], ['3', 'Jadlog'], ['31', 'Loggi'], ['33', 'J&T']];

function ShippingSettingsPage({ settings }: { settings: Settings }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        enabled: settings.enabled, environment: settings.environment,
        origin_postal_code: settings.origin_postal_code, contact_email: settings.contact_email ?? '',
        services: settings.services, token: '',
        free_shipping_enabled: settings.free_shipping_enabled,
        free_shipping_minimum: settings.free_shipping_minimum ?? '',
    });
    return <main className="mx-auto max-w-3xl space-y-6">
        <div><h1 className="text-2xl font-semibold">Frete · SuperFrete</h1><p className="text-muted-foreground mt-2">Configure o cálculo de frete exibido no checkout. A compra de etiquetas ainda não está disponível.</p></div>
        <form className="space-y-6 rounded-lg border bg-card p-6" onSubmit={(e) => {
            e.preventDefault();
            put(route('settings.shipping.update'), { preserveScroll: true, onSuccess: () => { reset('token'); toast.success('Configurações de frete salvas'); } });
        }}>
            <label className="flex items-center gap-3 font-medium"><input type="checkbox" checked={data.enabled} onChange={(e) => setData('enabled', e.target.checked)} />Ativar cálculo de frete no checkout</label>
            <Field><FieldLabel htmlFor="shipping-environment">Ambiente</FieldLabel>
                <select id="shipping-environment" className="h-10 rounded-md border bg-background px-3 text-sm" value={data.environment} onChange={(e) => setData('environment', e.target.value as Settings['environment'])}>
                    <option value="sandbox">Teste (Sandbox)</option><option value="production">Produção</option>
                </select><FieldDescription>O token deve corresponder ao ambiente escolhido. O modo de teste fica identificado no checkout.</FieldDescription><FieldError>{errors.environment}</FieldError>
            </Field>
            <Field><FieldLabel htmlFor="shipping-origin">CEP de origem</FieldLabel><Input id="shipping-origin" inputMode="numeric" maxLength={9} value={data.origin_postal_code} onChange={(e) => setData('origin_postal_code', e.target.value)} /><FieldError>{errors.origin_postal_code}</FieldError></Field>
            <Field><FieldLabel htmlFor="shipping-email">E-mail de contato técnico</FieldLabel><Input id="shipping-email" type="email" maxLength={254} value={data.contact_email} onChange={(e) => setData('contact_email', e.target.value)} /><FieldDescription>Enviado ao SuperFrete para identificar o contato responsável pela integração.</FieldDescription><FieldError>{errors.contact_email}</FieldError></Field>
            <Field><FieldLabel htmlFor="shipping-token">Token do SuperFrete</FieldLabel><Input id="shipping-token" type="password" autoComplete="new-password" maxLength={4096} value={data.token} onChange={(e) => setData('token', e.target.value)} placeholder={settings.has_token ? 'Token configurado. Preencha apenas para substituir.' : 'Cole o token gerado no SuperFrete'} /><FieldDescription>A credencial fica criptografada e não é exibida depois de salvar. Gere-a em Integrações → Desenvolvedores no SuperFrete.</FieldDescription><FieldError>{errors.token}</FieldError></Field>
            <fieldset className="space-y-3"><legend className="mb-3 font-medium">Serviços disponíveis</legend><div className="grid gap-3 sm:grid-cols-3">{services.map(([id, label]) => <label key={id} className="flex items-center gap-2"><input type="checkbox" checked={data.services.includes(id)} onChange={(e) => setData('services', e.target.checked ? [...data.services, id] : data.services.filter((s) => s !== id))} />{label}</label>)}</div><FieldError>{errors.services}</FieldError><p className="text-muted-foreground text-sm">A disponibilidade depende do trajeto e das configurações da sua conta SuperFrete. Produtos precisam de peso em kg e dimensões em cm.</p></fieldset>
            <fieldset className="space-y-4 border-t pt-5">
                <legend className="font-semibold">Frete grátis</legend>
                <label className="flex items-center gap-3"><input type="checkbox" checked={data.free_shipping_enabled} onChange={(e) => setData('free_shipping_enabled', e.target.checked)} />Oferecer frete grátis</label>
                <FieldError>{errors.free_shipping_enabled}</FieldError>
                <Field><FieldLabel htmlFor="free-shipping-minimum">Valor mínimo em produtos (R$)</FieldLabel><Input id="free-shipping-minimum" type="number" inputMode="decimal" min="0" max="99999999.99" step="0.01" required={data.free_shipping_enabled} disabled={!data.free_shipping_enabled} value={data.free_shipping_minimum} onChange={(e) => setData('free_shipping_minimum', e.target.value)} placeholder="Ex.: 299,00" /><FieldDescription>Informe 0 para oferecer sem valor mínimo. O frete não entra na soma.</FieldDescription><FieldError>{errors.free_shipping_minimum}</FieldError></Field>
                <p className="text-muted-foreground text-sm">Válido para todo o Brasil na opção de entrega mais barata disponível. As demais opções mantêm o valor normal. A loja assume o custo do envio. O cálculo pelo SuperFrete deve estar ativo.</p>
            </fieldset>
            <div className="flex justify-end border-t pt-5"><Button disabled={processing}>{processing ? 'Salvando…' : 'Salvar configurações'}</Button></div>
        </form>
    </main>;
}
ShippingSettingsPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Configurações' }, { title: 'Frete' }]}>{page}</DashboardLayout>;
export default ShippingSettingsPage;
