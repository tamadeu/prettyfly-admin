import React, { useState } from 'react';
import { CalendarDays, ChevronRight, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, chartTooltipStyle } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

const revenueData = Array.from({ length: 42 }, (_, index) => ({
    day: index + 1,
    revenue: 28 + ((index * 29 + index * index * 3) % 74),
}));

const metrics = [
    { label: 'Saldo total', value: 'R$ 103.045', change: '3,6%', trend: 'up' },
    { label: 'Receita total', value: 'R$ 78.000', change: '2,5%', trend: 'up' },
    { label: 'Despesas', value: 'R$ 15.010', change: '6,0%', trend: 'down' },
    { label: 'Impostos sobre vendas', value: 'R$ 9.090', change: '5,0%', trend: 'up' },
] as const;

const products = [
    { name: 'Tênis esportivo', sales: 316, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=160&q=80' },
    { name: 'Camiseta preta', sales: 274, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80' },
    { name: 'Calça jeans', sales: 195, image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=160&q=80' },
    { name: 'Tênis vermelho', sales: 402, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=160&q=80' },
    { name: 'Camisa casual', sales: 280, image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=160&q=80' },
];

type OrderStatus = 'Novo pedido' | 'Em andamento' | 'Concluído' | 'Em espera';

const orders: Array<{ id: number; customer: string; items: number; amount: string; payment: string; status: OrderStatus }> = [
    { id: 1083, customer: 'Marvin Dekidis', items: 2, amount: 'R$ 345,00', payment: 'Carteira digital', status: 'Novo pedido' },
    { id: 1082, customer: 'Carter Lipshitz', items: 6, amount: 'R$ 605,00', payment: 'Transferência', status: 'Em andamento' },
    { id: 1081, customer: 'Addison Philips', items: 3, amount: 'R$ 475,00', payment: 'Carteira digital', status: 'Novo pedido' },
    { id: 1079, customer: 'Craig Siphron', items: 15, amount: 'R$ 898,00', payment: 'Transferência', status: 'Em espera' },
    { id: 1078, customer: 'Emma Collins', items: 4, amount: 'R$ 520,00', payment: 'Cartão de crédito', status: 'Concluído' },
];

const statusVariant = {
    'Novo pedido': 'default',
    'Em andamento': 'warning',
    Concluído: 'success',
    'Em espera': 'destructive',
} as const;

function DashboardPage() {
    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState('28d');
    const visibleOrders = orders.filter((order) =>
        `${order.id} ${order.customer} ${order.payment} ${order.status}`.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <main className="space-y-4 pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Visão comercial</p>
                    <h1 className="text-2xl font-semibold">Dashboard de vendas</h1>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-48">
                        <CalendarDays className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2" />
                        <Select aria-label="Período do dashboard" value={period} onChange={(event) => setPeriod(event.target.value)} className="pl-9">
                            <option value="7d">Últimos 7 dias</option>
                            <option value="28d">14 jul 2026 - 10 ago 2026</option>
                            <option value="90d">Últimos 90 dias</option>
                        </Select>
                    </div>
                    <Button onClick={() => toast.success('Relatório preparado para download')}><Download />Baixar relatório</Button>
                </div>
            </div>

            <section className="grid gap-4 xl:grid-cols-2" aria-label="Receita e indicadores">
                <Card>
                    <CardHeader className="flex-col sm:flex-row">
                        <div><CardTitle>Receita</CardTitle><CardDescription>Desempenho dos últimos 28 dias</CardDescription></div>
                        <div className="grid w-full grid-cols-2 overflow-hidden rounded-md border sm:w-auto sm:min-w-52">
                            <SummaryValue label="Desktop" value="R$ 13.746" />
                            <SummaryValue label="Mobile" value="R$ 13.580" bordered />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ChartContainer className="h-56">
                            <BarChart data={revenueData} barCategoryGap="20%">
                                <CartesianGrid vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} interval={6} tickFormatter={(value) => value <= 31 ? `${value} jul` : `${value - 31} ago`} tickMargin={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} formatter={(value) => [`R$ ${Number(value) * 10}`, 'Receita']} labelFormatter={(value) => `Dia ${value}`} />
                                <Bar dataKey="revenue" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                    {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.5fr)]" aria-label="Produtos e pedidos">
                <Card>
                    <CardHeader>
                        <div><CardTitle>Produtos mais vendidos</CardTitle><CardDescription>Itens com maior volume no período</CardDescription></div>
                        <Button variant="outline" size="icon-sm" aria-label="Ver todos os produtos"><ChevronRight /></Button>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-5">
                        {products.map((product) => (
                            <div key={product.name} className="flex items-center gap-3 rounded-md border p-3">
                                <img src={product.image} alt={product.name} className="size-11 rounded-md object-cover" />
                                <div className="min-w-0 flex-1 font-medium">{product.name}</div>
                                <div className="text-emerald-600 text-xs font-medium whitespace-nowrap">{product.sales} vendidos</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="min-w-0">
                    <CardHeader>
                        <div><CardTitle>Status dos pedidos</CardTitle><CardDescription>Acompanhe volume, andamento e pagamentos</CardDescription></div>
                        <Button variant="outline" size="sm"><Download />Exportar</Button>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <OrderSummary value="43" label="Novos" change="+0,5%" color="bg-blue-500" track="bg-blue-100" />
                            <OrderSummary value="12" label="Em andamento" change="-0,3%" color="bg-brand-yellow" track="bg-amber-100" negative />
                            <OrderSummary value="40" label="Concluídos" change="+0,5%" color="bg-emerald-500" track="bg-emerald-100" />
                            <OrderSummary value="2" label="Devoluções" change="-0,5%" color="bg-brand-red" track="bg-rose-100" negative />
                        </div>

                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Input aria-label="Filtrar pedidos" placeholder="Filtrar pedidos..." value={query} onChange={(event) => setQuery(event.target.value)} className="sm:max-w-sm" />
                            <Select aria-label="Colunas da tabela" defaultValue="all" className="sm:w-36"><option value="all">Todas as colunas</option><option value="compact">Compacto</option></Select>
                        </div>

                        <div className="mt-3 overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Cliente</TableHead><TableHead data-priority="medium">Itens</TableHead><TableHead>Valor</TableHead><TableHead data-priority="low">Pagamento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {visibleOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="py-3 font-medium">{order.id}</TableCell>
                                            <TableCell className="py-3">{order.customer}</TableCell>
                                            <TableCell data-priority="medium" className="py-3">{order.items}</TableCell>
                                            <TableCell className="py-3">{order.amount}</TableCell>
                                            <TableCell data-priority="low" className="py-3">{order.payment}</TableCell>
                                            <TableCell className="py-3"><Badge variant={statusVariant[order.status]}>{order.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                    {visibleOrders.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nenhum pedido encontrado.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}

function SummaryValue({ label, value, bordered = false }: { label: string; value: string; bordered?: boolean }) {
    return <div className={`px-4 py-3 ${bordered ? 'border-l' : ''}`}><div className="text-muted-foreground text-xs">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}

function MetricCard({ label, value, change, trend }: { label: string; value: string; change: string; trend: 'up' | 'down' }) {
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    return <Card className="p-5"><div className="text-muted-foreground text-sm">{label}</div><div className="mt-3 text-2xl font-semibold">{value}</div><div className={`mt-3 flex flex-wrap items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-brand-red'}`}><TrendIcon className="size-3.5" />{change}<span className="text-muted-foreground">comparado ao mês anterior</span></div></Card>;
}

function OrderSummary({ value, label, change, color, track, negative = false }: { value: string; label: string; change: string; color: string; track: string; negative?: boolean }) {
    return <div><div className="text-2xl font-semibold">{value}</div><div className="mt-1 flex items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{label}</span><span className={negative ? 'text-brand-red' : 'text-emerald-600'}>{change}</span></div><div className={`mt-2 h-1.5 overflow-hidden rounded-full ${track}`}><div className={`h-full w-2/5 rounded-full ${color}`} /></div></div>;
}

DashboardPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Dashboard' }]}>{page}</DashboardLayout>
);

export default DashboardPage;
