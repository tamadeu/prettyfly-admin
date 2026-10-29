import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { ImageField } from '@/components/cms-image-field';
import { LinkRows, StringList, type Link } from '@/components/list-editors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

interface FooterContent {
    background: string;
    about_title: string;
    about_text: string;
    socials: { network: string; href: string }[];
    columns: { title: string; links: Link[] }[];
    show_newsletter: boolean;
    newsletter_title: string;
    newsletter_text: string;
    newsletter_placeholder: string;
    show_currency: boolean;
    currencies: string[];
    show_language: boolean;
    languages: string[];
    copyright: string;
    show_payments: boolean;
    payment_height: number;
    payment_images: { src: string; alt: string }[];
}

const NETWORKS = { twitter: 'X (Twitter)', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn' };

function FooterEditPage({ content, defaultContent }: { content: FooterContent; defaultContent: FooterContent }) {
    const route = useRoute();
    const { data, setData, put, processing, errors } = useForm<FooterContent>(content);
    const hasErrors = Object.keys(errors).length > 0;

    function submit(event: React.FormEvent) {
        event.preventDefault();
        put(route('footer.update'), { onSuccess: () => toast.success('Rodapé salvo') });
    }

    return (
        <main className="space-y-6 p-4">
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Rodapé do site</CardTitle>
                            <CardDescription>Vale para o site principal (as páginas de demonstração mantêm o próprio rodapé).</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setData(defaultContent)}>
                            Restaurar padrão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Field>
                            <FieldLabel>Cor de fundo</FieldLabel>
                            <div className="flex items-center gap-2">
                                <input type="color" value={data.background} onChange={(e) => setData('background', e.target.value)} className="h-9 w-12 cursor-pointer rounded border" />
                                <Input className="w-28" value={data.background} onChange={(e) => setData('background', e.target.value)} />
                            </div>
                        </Field>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Sobre</p>
                            <Input placeholder="Título" value={data.about_title} onChange={(e) => setData('about_title', e.target.value)} />
                            <Textarea placeholder="Texto" rows={3} value={data.about_text} onChange={(e) => setData('about_text', e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Redes sociais</p>
                            {data.socials.map((social, i) => (
                                <div key={i} className="flex gap-2">
                                    <div className="w-44">
                                        <Select
                                            value={social.network}
                                            onChange={(e) => setData('socials', data.socials.map((x, k) => (k === i ? { ...x, network: e.target.value } : x)))}
                                        >
                                            {Object.entries(NETWORKS).map(([v, l]) => (
                                                <option key={v} value={v}>
                                                    {l}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <Input
                                        placeholder="https://..."
                                        value={social.href}
                                        onChange={(e) => setData('socials', data.socials.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('socials', data.socials.filter((_, k) => k !== i))}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => setData('socials', [...data.socials, { network: 'instagram', href: '' }])}>
                                <Plus className="size-4" /> Adicionar rede
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Colunas de links</CardTitle>
                        <CardDescription>Até 2 colunas ao lado do bloco "Sobre".</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.columns.map((column, c) => (
                            <div key={c} className="space-y-2 rounded-md border p-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Título da coluna"
                                        value={column.title}
                                        onChange={(e) => setData('columns', data.columns.map((x, k) => (k === c ? { ...x, title: e.target.value } : x)))}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('columns', data.columns.filter((_, k) => k !== c))}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <LinkRows
                                    links={column.links}
                                    onChange={(links) => setData('columns', data.columns.map((x, k) => (k === c ? { ...x, links } : x)))}
                                />
                            </div>
                        ))}
                        {data.columns.length < 2 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setData('columns', [...data.columns, { title: '', links: [] }])}>
                                <Plus className="size-4" /> Adicionar coluna
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Newsletter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={data.show_newsletter} onChange={(e) => setData('show_newsletter', e.target.checked)} />
                            Exibir newsletter
                        </label>
                        <Input placeholder="Título" value={data.newsletter_title} onChange={(e) => setData('newsletter_title', e.target.value)} />
                        <Textarea placeholder="Texto" rows={2} value={data.newsletter_text} onChange={(e) => setData('newsletter_text', e.target.value)} />
                        <Input placeholder="Placeholder do e-mail" value={data.newsletter_placeholder} onChange={(e) => setData('newsletter_placeholder', e.target.value)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Barra inferior</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={data.show_currency} onChange={(e) => setData('show_currency', e.target.checked)} />
                                    Seletor de moeda
                                </label>
                                <StringList values={data.currencies} placeholder="Ex.: Brasil BRL R$" onChange={(v) => setData('currencies', v)} />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={data.show_language} onChange={(e) => setData('show_language', e.target.checked)} />
                                    Seletor de idioma
                                </label>
                                <StringList values={data.languages} placeholder="Ex.: Português" onChange={(v) => setData('languages', v)} />
                            </div>
                        </div>
                        <Field>
                            <FieldLabel>Copyright</FieldLabel>
                            <Input value={data.copyright} onChange={(e) => setData('copyright', e.target.value)} />
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={data.show_payments} onChange={(e) => setData('show_payments', e.target.checked)} />
                            Exibir bandeiras de pagamento
                        </label>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Bandeiras (upload)</p>
                            <p className="text-muted-foreground text-xs">Sem nenhuma imagem, o site usa as bandeiras padrão. </p>
                            <Field>
                                <FieldLabel>Altura das bandeiras (px)</FieldLabel>
                                <Input
                                    className="w-32"
                                    type="number"
                                    min={16}
                                    max={120}
                                    value={data.payment_height}
                                    onChange={(e) => setData('payment_height', Number(e.target.value))}
                                />
                            </Field>
                            {data.payment_images.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 rounded border p-2">
                                    <div className="flex-1">
                                        <ImageField
                                            value={item.src}
                                            onChange={(src) => setData('payment_images', data.payment_images.map((x, k) => (k === i ? { ...x, src } : x)))}
                                        />
                                    </div>
                                    <Input
                                        className="w-40"
                                        placeholder="Nome (ex.: Pix)"
                                        value={item.alt}
                                        onChange={(e) => setData('payment_images', data.payment_images.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('payment_images', data.payment_images.filter((_, k) => k !== i))}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => setData('payment_images', [...data.payment_images, { src: '', alt: '' }])}>
                                <Plus className="size-4" /> Adicionar bandeira
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {hasErrors && (
                    <p className="text-destructive text-sm">Há campos inválidos (textos vazios, cor fora do formato #RRGGBB ou links que não começam com /, # ou http).</p>
                )}
                <Button type="submit" disabled={processing}>
                    Salvar
                </Button>
            </form>
        </main>
    );
}

FooterEditPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Rodapé' }]}>{page}</DashboardLayout>;

export default FooterEditPage;
