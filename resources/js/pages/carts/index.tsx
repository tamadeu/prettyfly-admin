import React from 'react';
import { Link } from '@inertiajs/react';
import DashboardLayout from '@/layout/dashboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Cart {
    id: number;
    user: { name: string; email: string } | null;
    items: { variantId: string; name: string; color: string; size: string; quantity: number; price: number }[];
    checkout: Record<string, string | null> | null;
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
            <TableBody>{carts.data.map((cart) => <TableRow key={cart.id}>
                <TableCell>#{cart.id}</TableCell>
                <TableCell><div>{cart.user?.name || [cart.checkout?.first_name, cart.checkout?.last_name].filter(Boolean).join(' ') || 'Visitante'}</div><div className="text-muted-foreground text-xs">{cart.user ? 'Conta cadastrada' : 'Sem login'} · {cart.checkout?.email || cart.user?.email || 'Sem e-mail'}</div></TableCell>
                <TableCell>{cart.items.reduce((n, item) => n + item.quantity, 0)}</TableCell>
                <TableCell>{money(cart.items.reduce((n, item) => n + item.quantity * item.price, 0))}</TableCell>
                <TableCell>{new Date(cart.updated_at).toLocaleString('pt-BR')}</TableCell>
                <TableCell><details><summary className="cursor-pointer">Ver dados</summary><div className="mt-3 min-w-64 space-y-3 whitespace-normal">
                    <p className="text-muted-foreground text-xs">Iniciado em {new Date(cart.created_at).toLocaleString('pt-BR')}</p>
                    {cart.items.map((item) => <p key={item.variantId}>{item.name} ({[item.color, item.size].filter(Boolean).join(' / ')}) × {item.quantity} — {money(item.quantity * item.price)}</p>)}
                    {!cart.items.length && <p>Carrinho vazio</p>}
                    <dl>{Object.entries(cart.checkout ?? {}).filter(([, value]) => value).map(([key, value]) => <div key={key} className="mb-2"><dt className="font-medium">{labels[key] || key}</dt><dd className="text-muted-foreground break-words">{value}</dd></div>)}</dl>
                </div></details></TableCell>
            </TableRow>)}{!carts.data.length && <TableRow><TableCell colSpan={6} className="py-12 text-center">Nenhum carrinho iniciado.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <div className="flex items-center justify-between text-sm"><p>{carts.total} carrinhos · Página {carts.current_page} de {carts.last_page}</p><div className="flex gap-4">{carts.prev_page_url && <Link href={carts.prev_page_url}>Anterior</Link>}{carts.next_page_url && <Link href={carts.next_page_url}>Próxima</Link>}</div></div>
    </main>;
}
CartsPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Carrinhos' }]}>{page}</DashboardLayout>;
export default CartsPage;
