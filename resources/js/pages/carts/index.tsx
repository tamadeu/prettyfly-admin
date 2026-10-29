import React from 'react';
import { Link } from '@inertiajs/react';
import DashboardLayout from '@/layout/dashboard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Cart {
    id: number;
    user: { name: string; email: string } | null;
    items: { variantId: string; name: string; color: string; size: string; quantity: number; price: number }[];
    checkout: Record<string, string | null> | null;
    shipping: { environment: string; expires_at: string; selected_id: string | null; options: { id: string; name: string; company: string; price: number; delivery_days: number }[] } | null;
    created_at: string;
    updated_at: string;
}
const money = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const labels: Record<string, string> = { first_name: 'Nome', last_name: 'Sobrenome', email: 'E-mail', phone: 'Telefone', country: 'País', postal_code: 'CEP', street: 'Endereço', number: 'Número', complement: 'Complemento', neighborhood: 'Bairro', city: 'Cidade', state: 'UF', notes: 'Observações' };

function CartsPage({ carts }: { carts: { data: Cart[]; total: number; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null } }) {
    return <main className="space-y-6">
        <div><p className="text-muted-foreground text-sm">Loja</p><h1 className="text-2xl font-semibold">Carrinhos</h1><p className="text-muted-foreground mt-1 text-sm">Produtos e dados de checkout salvos. Estes carrinhos ainda não são pedidos.</p></div>
        <div className="overflow-hidden rounded-lg border bg-card"><Table>
            <TableHeader><TableRow><TableHead>Carrinho</TableHead><TableHead>Cliente</TableHead><TableHead>Produtos</TableHead><TableHead>Subtotal</TableHead><TableHead>Última alteração</TableHead><TableHead>Detalhes</TableHead></TableRow></TableHeader>
            <TableBody>{carts.data.map((cart) => {
                const subtotal = cart.items.reduce((n, item) => n + item.quantity * item.price, 0);
                const delivery = cart.shipping?.options.find((option) => option.id === cart.shipping?.selected_id);
                return <TableRow key={cart.id}>
                <TableCell>#{cart.id}</TableCell>
                <TableCell><div>{cart.user?.name || [cart.checkout?.first_name, cart.checkout?.last_name].filter(Boolean).join(' ') || 'Visitante'}</div><div className="text-muted-foreground text-xs">{cart.user ? 'Conta cadastrada' : 'Sem login'} · {cart.checkout?.email || cart.user?.email || 'Sem e-mail'}</div></TableCell>
                <TableCell>{cart.items.reduce((n, item) => n + item.quantity, 0)}</TableCell>
                <TableCell>{money(subtotal)}</TableCell>
                <TableCell>{new Date(cart.updated_at).toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" aria-label={`Ver dados do carrinho #${cart.id}`}>Ver dados</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90dvh] max-w-6xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Carrinho #{cart.id}</DialogTitle>
                                <DialogDescription>Iniciado em {new Date(cart.created_at).toLocaleString('pt-BR')}. Última alteração em {new Date(cart.updated_at).toLocaleString('pt-BR')}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid min-w-0 gap-6 lg:grid-cols-4">
                            <div className="min-w-0 space-y-6 lg:col-span-3">
                            <section className="min-w-0 space-y-3">
                                <h2 className="font-semibold">Produtos</h2>
                                {cart.items.map((item) => <div key={item.variantId} className="flex items-start justify-between gap-4 border-b pb-3 text-sm">
                                    <div className="min-w-0 break-words">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-muted-foreground">{[item.color, item.size].filter(Boolean).join(' / ')}</p>
                                        <p className="text-muted-foreground">Quantidade: {item.quantity}</p>
                                    </div>
                                    <p className="shrink-0">{money(item.quantity * item.price)}</p>
                                </div>)}
                                {!cart.items.length && <p className="text-muted-foreground text-sm">Carrinho vazio</p>}
                            </section>
                            <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
                                <h2 className="font-semibold">Resumo dos custos</h2>
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between gap-4"><dt>Subtotal dos produtos</dt><dd className="shrink-0 tabular-nums">{money(subtotal)}</dd></div>
                                    <div className="flex justify-between gap-4"><dt>Frete{delivery && <span className="text-muted-foreground block text-xs">{delivery.company} · {delivery.name}</span>}</dt><dd className="shrink-0 tabular-nums">{delivery ? (delivery.price === 0 ? 'Grátis' : money(delivery.price)) : 'A definir'}</dd></div>
                                    <div className="flex justify-between gap-4 border-t pt-3 text-base font-semibold"><dt>{delivery ? 'Total com frete' : 'Total dos produtos'}</dt><dd className="shrink-0 tabular-nums">{money(subtotal + (delivery?.price ?? 0))}</dd></div>
                                </dl>
                                {cart.shipping && <div className="text-muted-foreground space-y-2 border-t pt-3 text-xs">
                                    {cart.shipping.environment === 'sandbox' && <p>Cotação de teste (Sandbox)</p>}
                                    {delivery ? <p>Prazo de entrega: {delivery.delivery_days} {delivery.delivery_days === 1 ? 'dia útil' : 'dias úteis'} após a postagem.</p> : <p>Opção de entrega ainda não escolhida.</p>}
                                    <p>Cotação válida até {new Date(cart.shipping.expires_at).toLocaleString('pt-BR')}. O frete será revalidado no checkout.</p>
                                </div>}
                            </section>
                            </div>
                            <section className="min-w-0 space-y-3 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                                <h2 className="font-semibold">Dados do checkout</h2>
                                {Object.values(cart.checkout ?? {}).some(Boolean) ? <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
                                    {Object.entries(cart.checkout ?? {}).filter(([, value]) => value).map(([key, value]) => <div key={key} className={key === 'notes' ? 'min-w-0 sm:col-span-2 lg:col-span-1' : 'min-w-0'}>
                                        <dt className="font-medium">{labels[key] || key}</dt>
                                        <dd className="text-muted-foreground whitespace-pre-wrap break-words">{value}</dd>
                                    </div>)}
                                </dl> : <p className="text-muted-foreground text-sm">Nenhum dado de checkout preenchido.</p>}
                            </section>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TableCell>
            </TableRow>;
            })}{!carts.data.length && <TableRow><TableCell colSpan={6} className="py-12 text-center">Nenhum carrinho iniciado.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <div className="flex items-center justify-between text-sm"><p>{carts.total} carrinhos · Página {carts.current_page} de {carts.last_page}</p><div className="flex gap-4">{carts.prev_page_url && <Link href={carts.prev_page_url}>Anterior</Link>}{carts.next_page_url && <Link href={carts.next_page_url}>Próxima</Link>}</div></div>
    </main>;
}
CartsPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Carrinhos' }]}>{page}</DashboardLayout>;
export default CartsPage;
