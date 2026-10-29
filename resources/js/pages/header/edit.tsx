import { useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { ImageField } from '@/components/cms-image-field';
import { LinkRows, StringList, type Link } from '@/components/list-editors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import DashboardLayout from '@/layout/dashboard';

interface Column {
    title: string;
    links: Link[];
}
interface CategoryCard {
    label: string;
    href: string;
    image: string;
    itemCount?: number | null;
}
interface MenuItem {
    label: string;
    href: string;
    type: 'link' | 'dropdown' | 'megamenu';
    children?: Link[];
    megaMenu?: Column[];
    megaImage?: { src: string; alt?: string; title?: string; subtitle?: string };
    megaProductSlider?: boolean;
    megaCategoryCards?: CategoryCard[];
}
interface Topbar {
    enabled: boolean;
    background: string;
    text_color: string;
    autoplay: boolean;
    announcements: string[];
    socials: { network: string; href: string }[];
    show_currency: boolean;
    currencies: string[];
    show_language: boolean;
    languages: string[];
}
interface Contact {
    enabled: boolean;
    label: string;
    phone: string;
}
interface Props {
    setting: { variant: string; logo_url: string; menu: MenuItem[]; topbar: Topbar; contact: Contact };
    defaultMenu: MenuItem[];
    defaultTopbar: Topbar;
    defaultContact: Contact;
    variants: { value: string; label: string }[];
}

const NETWORKS = { twitter: 'X (Twitter)', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn' };

const TYPE_LABELS = { link: 'Link', dropdown: 'Dropdown', megamenu: 'Mega menu' };

function HeaderEditPage({ setting, defaultMenu, defaultTopbar, defaultContact, variants }: Props) {
    const route = useRoute();
    const { data, setData, put, processing, errors } = useForm(setting);

    const setTopbar = (patch: Partial<Topbar>) => setData('topbar', { ...data.topbar, ...patch });
    const topbarHasErrors = Object.keys(errors).some((k) => k.startsWith('topbar'));

    const setContact = (patch: Partial<Contact>) => setData('contact', { ...data.contact, ...patch });

    const setItem = (i: number, patch: Partial<MenuItem>) =>
        setData('menu', data.menu.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

    function move(i: number, dir: -1 | 1) {
        const t = i + dir;
        if (t < 0 || t >= data.menu.length) return;
        const next = [...data.menu];
        [next[i], next[t]] = [next[t], next[i]];
        setData('menu', next);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        put(route('header.update'), { onSuccess: () => toast.success('Cabeçalho salvo') });
    }

    return (
        <main className="space-y-6 p-4">
            <form onSubmit={submit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cabeçalho principal</CardTitle>
                        <CardDescription>Modelo e logo usados no site principal (páginas de demonstração mantêm o próprio cabeçalho).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Field>
                            <FieldLabel>Modelo do cabeçalho</FieldLabel>
                            <Select value={data.variant} onChange={(e) => setData('variant', e.target.value)}>
                                {variants.map((v) => (
                                    <option key={v.value} value={v.value}>
                                        {v.label}
                                    </option>
                                ))}
                            </Select>
                            <FieldError>{errors.variant}</FieldError>
                        </Field>
                        <Field>
                            <FieldLabel>Logo</FieldLabel>
                            <ImageField value={data.logo_url} onChange={(url) => setData('logo_url', url)} />
                            <p className="text-muted-foreground text-xs">Vazio = logo padrão do modelo.</p>
                            <FieldError>{errors.logo_url}</FieldError>
                        </Field>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Topbar</CardTitle>
                            <CardDescription>Barra superior com redes sociais, mensagens e seletores.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setData('topbar', defaultTopbar)}>
                            Restaurar padrão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={data.topbar.enabled} onChange={(e) => setTopbar({ enabled: e.target.checked })} />
                            Exibir topbar
                        </label>
                        <div className="flex flex-wrap gap-6">
                            <Field>
                                <FieldLabel>Cor de fundo</FieldLabel>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={data.topbar.background} onChange={(e) => setTopbar({ background: e.target.value })} className="h-9 w-12 cursor-pointer rounded border" />
                                    <Input className="w-28" value={data.topbar.background} onChange={(e) => setTopbar({ background: e.target.value })} />
                                </div>
                            </Field>
                            <Field>
                                <FieldLabel>Cor do texto</FieldLabel>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={data.topbar.text_color} onChange={(e) => setTopbar({ text_color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border" />
                                    <Input className="w-28" value={data.topbar.text_color} onChange={(e) => setTopbar({ text_color: e.target.value })} />
                                </div>
                            </Field>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Mensagens</p>
                            <StringList values={data.topbar.announcements} placeholder="Mensagem" onChange={(announcements) => setTopbar({ announcements })} />
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={data.topbar.autoplay} onChange={(e) => setTopbar({ autoplay: e.target.checked })} />
                                Trocar mensagens automaticamente (5s)
                            </label>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Redes sociais</p>
                            {data.topbar.socials.map((social, i) => (
                                <div key={i} className="flex gap-2">
                                    <div className="w-44">
                                        <Select
                                            value={social.network}
                                            onChange={(e) => setTopbar({ socials: data.topbar.socials.map((x, k) => (k === i ? { ...x, network: e.target.value } : x)) })}
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
                                        onChange={(e) => setTopbar({ socials: data.topbar.socials.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)) })}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setTopbar({ socials: data.topbar.socials.filter((_, k) => k !== i) })}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => setTopbar({ socials: [...data.topbar.socials, { network: 'instagram', href: '' }] })}>
                                <Plus className="size-4" /> Adicionar rede
                            </Button>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={data.topbar.show_currency} onChange={(e) => setTopbar({ show_currency: e.target.checked })} />
                                    Seletor de moeda
                                </label>
                                <StringList values={data.topbar.currencies} placeholder="Ex.: Brasil BRL R$" onChange={(currencies) => setTopbar({ currencies })} />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <Checkbox checked={data.topbar.show_language} onChange={(e) => setTopbar({ show_language: e.target.checked })} />
                                    Seletor de idioma
                                </label>
                                <StringList values={data.topbar.languages} placeholder="Ex.: Português" onChange={(languages) => setTopbar({ languages })} />
                            </div>
                        </div>
                        {topbarHasErrors && <p className="text-destructive text-sm">Há campos inválidos na topbar (textos vazios, cores fora do formato #RRGGBB ou links que não começam com /, # ou http).</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Telefone / contato</CardTitle>
                            <CardDescription>Texto de atendimento exibido ao lado do menu (modelo Active Wear).</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setData('contact', defaultContact)}>
                            Restaurar padrão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox checked={data.contact.enabled} onChange={(e) => setContact({ enabled: e.target.checked })} />
                            Exibir telefone
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field>
                                <FieldLabel>Texto</FieldLabel>
                                <Input value={data.contact.label} onChange={(e) => setContact({ label: e.target.value })} />
                            </Field>
                            <Field>
                                <FieldLabel>Telefone</FieldLabel>
                                <Input value={data.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} />
                                <FieldError>{errors['contact.phone']}</FieldError>
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Menu (big menu)</CardTitle>
                            <CardDescription>Itens, dropdowns e mega menus do cabeçalho.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setData('menu', defaultMenu)}>
                            Restaurar padrão
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.menu.map((item, i) => (
                            <div key={i} className="space-y-3 rounded-md border p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Input className="w-48" placeholder="Rótulo" value={item.label} onChange={(e) => setItem(i, { label: e.target.value })} />
                                    <Input className="w-48" placeholder="/caminho" value={item.href} onChange={(e) => setItem(i, { href: e.target.value })} />
                                    <div className="w-40">
                                        <Select value={item.type} onChange={(e) => setItem(i, { type: e.target.value as MenuItem['type'] })}>
                                            {Object.entries(TYPE_LABELS).map(([v, l]) => (
                                                <option key={v} value={v}>
                                                    {l}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => move(i, -1)}>
                                        <ArrowUp className="size-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => move(i, 1)}>
                                        <ArrowDown className="size-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => setData('menu', data.menu.filter((_, idx) => idx !== i))}>
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>

                                {item.type === 'dropdown' && (
                                    <LinkRows withSoon links={item.children ?? []} onChange={(children) => setItem(i, { children })} />
                                )}

                                {item.type === 'megamenu' && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Colunas</p>
                                            {(item.megaMenu ?? []).map((col, c) => (
                                                <div key={c} className="space-y-2 rounded border p-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Título da coluna"
                                                            value={col.title}
                                                            onChange={(e) =>
                                                                setItem(i, { megaMenu: (item.megaMenu ?? []).map((x, k) => (k === c ? { ...x, title: e.target.value } : x)) })
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setItem(i, { megaMenu: (item.megaMenu ?? []).filter((_, k) => k !== c) })}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                    <LinkRows
                                                        links={col.links}
                                                        onChange={(links) =>
                                                            setItem(i, { megaMenu: (item.megaMenu ?? []).map((x, k) => (k === c ? { ...x, links } : x)) })
                                                        }
                                                    />
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setItem(i, { megaMenu: [...(item.megaMenu ?? []), { title: '', links: [] }] })}
                                            >
                                                <Plus className="size-4" /> Adicionar coluna
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Imagem promocional</p>
                                            <ImageField
                                                value={item.megaImage?.src ?? ''}
                                                onChange={(src) => setItem(i, { megaImage: { ...item.megaImage, src } })}
                                            />
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                {(['alt', 'title', 'subtitle'] as const).map((k) => (
                                                    <Input
                                                        key={k}
                                                        placeholder={k === 'alt' ? 'Texto alternativo' : k === 'title' ? 'Título' : 'Subtítulo'}
                                                        value={item.megaImage?.[k] ?? ''}
                                                        onChange={(e) => setItem(i, { megaImage: { src: item.megaImage?.src ?? '', ...item.megaImage, [k]: e.target.value } })}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={Boolean(item.megaProductSlider)}
                                                onChange={(e) => setItem(i, { megaProductSlider: e.target.checked })}
                                            />
                                            Exibir carrossel de produtos
                                        </label>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Cards de categoria</p>
                                            {(item.megaCategoryCards ?? []).map((card, k) => {
                                                const setCard = (patch: Partial<CategoryCard>) =>
                                                    setItem(i, { megaCategoryCards: (item.megaCategoryCards ?? []).map((x, n) => (n === k ? { ...x, ...patch } : x)) });
                                                return (
                                                    <div key={k} className="space-y-2 rounded border p-2">
                                                        <div className="flex gap-2">
                                                            <Input placeholder="Rótulo" value={card.label} onChange={(e) => setCard({ label: e.target.value })} />
                                                            <Input placeholder="/caminho" value={card.href} onChange={(e) => setCard({ href: e.target.value })} />
                                                            <Input
                                                                className="w-28"
                                                                type="number"
                                                                placeholder="Itens"
                                                                value={card.itemCount ?? ''}
                                                                onChange={(e) => setCard({ itemCount: e.target.value === '' ? null : Number(e.target.value) })}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setItem(i, { megaCategoryCards: (item.megaCategoryCards ?? []).filter((_, n) => n !== k) })}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                        <ImageField value={card.image} onChange={(image) => setCard({ image })} />
                                                    </div>
                                                );
                                            })}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setItem(i, { megaCategoryCards: [...(item.megaCategoryCards ?? []), { label: '', href: '/', image: '' }] })
                                                }
                                            >
                                                <Plus className="size-4" /> Adicionar card
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setData('menu', [...data.menu, { label: '', href: '/', type: 'link' }])}
                        >
                            <Plus className="size-4" /> Adicionar item
                        </Button>
                        {Object.keys(errors).some((k) => k.startsWith('menu')) && (
                            <p className="text-destructive text-sm">Há campos inválidos no menu (rótulos vazios ou links que não começam com /, # ou http).</p>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" disabled={processing}>
                    Salvar
                </Button>
            </form>
        </main>
    );
}

HeaderEditPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Cabeçalho' }]}>{page}</DashboardLayout>;

export default HeaderEditPage;
