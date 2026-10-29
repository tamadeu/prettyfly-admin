import React from 'react';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, chartTooltipStyle } from '@/components/ui/chart';
import { Select } from '@/components/ui/select';
import DashboardLayout from '@/layout/dashboard';

const monthlyRevenue = [
    { month: 'Jan', desktop: 24800, mobile: 23500 },
    { month: 'Fev', desktop: 32100, mobile: 26300 },
    { month: 'Mar', desktop: 25400, mobile: 17800 },
    { month: 'Abr', desktop: 17600, mobile: 24700 },
    { month: 'Mai', desktop: 16500, mobile: 19100 },
    { month: 'Jun', desktop: 32100, mobile: 20500 },
];

const exerciseData = [
    { day: 'Seg', atual: 34, anterior: 49 },
    { day: 'Ter', atual: 21, anterior: 42 },
    { day: 'Qua', atual: 49, anterior: 31 },
    { day: 'Qui', atual: 48, anterior: 39 },
    { day: 'Sex', atual: 59, anterior: 30 },
    { day: 'Sáb', atual: 46, anterior: 35 },
    { day: 'Dom', atual: 49, anterior: 45 },
];

const returningData = [
    { month: 'Mar', novos: 18, recorrentes: 9 },
    { month: 'Abr', novos: 34, recorrentes: 16 },
    { month: 'Mai', novos: 28, recorrentes: 12 },
    { month: 'Jun', novos: 37, recorrentes: 13 },
    { month: 'Jul', novos: 14, recorrentes: 11 },
    { month: 'Ago', novos: 33, recorrentes: 15 },
    { month: 'Set', novos: 27, recorrentes: 12 },
    { month: 'Out', novos: 38, recorrentes: 24 },
    { month: 'Nov', novos: 26, recorrentes: 18 },
    { month: 'Dez', novos: 49, recorrentes: 35 },
];

const sourceData = [
    { name: 'Direto', value: 2600, color: 'var(--brand-blue)' },
    { name: 'Referências', value: 2100, color: 'var(--brand-yellow)' },
    { name: 'E-mail', value: 1900, color: 'var(--brand-red)' },
    { name: 'Busca', value: 2200, color: '#737373' },
    { name: 'Social', value: 1400, color: '#d4d4d4' },
];

const projectData = Array.from({ length: 24 }, (_, index) => ({
    week: `${index + 1}`, total: 38 + ((index * 17) % 46), completed: 18 + ((index * 23) % 37),
}));

const metrics = [
    { label: 'Saldo total', value: 'R$ 103.045', change: '3,6%', trend: 'up' },
    { label: 'Receita total', value: 'R$ 78.000', change: '2,5%', trend: 'up' },
    { label: 'Despesas', value: 'R$ 15.010', change: '6,0%', trend: 'down' },
    { label: 'Impostos sobre vendas', value: 'R$ 9.090', change: '5,0%', trend: 'up' },
] as const;

function ChartsPage() {
    return (
        <main className="mx-auto w-full max-w-6xl space-y-6 pb-10">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Visualização de dados</p>
                <h1 className="text-2xl font-semibold">Gráficos</h1>
                <p className="text-muted-foreground mt-1 text-sm">Padrões responsivos para métricas, comparações e distribuição.</p>
            </div>

            <section className="grid gap-3 sm:grid-cols-2" aria-label="Indicadores principais">
                {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <ChartHeader title="Receita total" description="Receita nos últimos seis meses" />
                    <CardContent className="pt-4">
                        <ChartContainer>
                            <BarChart data={monthlyRevenue} barGap={5}>
                                <CartesianGrid vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                                <Bar dataKey="desktop" name="Desktop" fill="var(--brand-blue)" radius={[5, 5, 0, 0]} isAnimationActive={false} />
                                <Bar dataKey="mobile" name="Mobile" fill="var(--brand-yellow)" radius={[5, 5, 0, 0]} isAnimationActive={false} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <ChartHeader title="Minutos de exercício" description="Desempenho atual comparado à semana anterior" action={<ExportButton />} />
                    <CardContent className="pt-4">
                        <ChartContainer>
                            <LineChart data={exerciseData}>
                                <CartesianGrid vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Line type="monotone" dataKey="anterior" name="Semana anterior" stroke="#b8b8b8" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="atual" name="Semana atual" stroke="var(--brand-blue)" strokeWidth={2.5} dot={{ r: 3, fill: 'white' }} />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <ChartHeader title="Taxa de retorno" description="R$ 42.379 · +2,5% no período" action={<ExportButton />} />
                    <CardContent className="pt-4">
                        <ChartContainer>
                            <AreaChart data={returningData}>
                                <defs>
                                    <linearGradient id="returning-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
                                <YAxis hide />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Area type="linear" dataKey="novos" name="Novos" stroke="var(--brand-yellow)" fill="none" strokeWidth={2} />
                                <Area type="linear" dataKey="recorrentes" name="Recorrentes" stroke="var(--brand-blue)" fill="url(#returning-fill)" strokeWidth={2.5} />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card>
                    <ChartHeader title="Visitas por origem" description="Distribuição dos últimos 30 dias" action={<ExportButton />} />
                    <CardContent className="relative pt-2">
                        <ChartContainer className="h-72">
                            <PieChart>
                                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => Number(value).toLocaleString('pt-BR')} />
                                <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius="47%" outerRadius="72%" paddingAngle={1}>
                                    {sourceData.map((item) => <Cell key={item.name} fill={item.color} stroke="var(--card)" />)}
                                </Pie>
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ChartContainer>
                        <div className="pointer-events-none absolute inset-x-0 top-[7.75rem] text-center">
                            <div className="text-2xl font-semibold">10,2 mil</div>
                            <div className="text-muted-foreground text-xs">Visitantes</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div><CardTitle>Visão geral dos projetos</CardTitle><CardDescription>Volume e entregas concluídas</CardDescription></div>
                    <Select aria-label="Período do gráfico" defaultValue="3m" className="w-36"><option value="1m">Último mês</option><option value="3m">Últimos 3 meses</option><option value="1y">Último ano</option></Select>
                </CardHeader>
                <CardContent className="pt-4">
                    <ChartContainer className="h-72">
                        <AreaChart data={projectData}>
                            <defs>
                                <linearGradient id="project-total" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand-yellow)" stopOpacity={0.22} /><stop offset="100%" stopColor="var(--brand-yellow)" stopOpacity={0} /></linearGradient>
                                <linearGradient id="project-completed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0.03} /></linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="week" axisLine={false} tickLine={false} interval={3} tickFormatter={(value) => `Sem ${value}`} tickMargin={10} />
                            <YAxis hide />
                            <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(value) => `Semana ${value}`} />
                            <Area type="monotone" dataKey="total" name="Total" stroke="var(--brand-yellow)" fill="url(#project-total)" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="completed" name="Concluídos" stroke="var(--brand-blue)" fill="url(#project-completed)" strokeWidth={2} />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </main>
    );
}

function MetricCard({ label, value, change, trend }: { label: string; value: string; change: string; trend: 'up' | 'down' }) {
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    return (
        <Card className="p-5">
            <div className="text-muted-foreground text-sm">{label}</div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
            <div className={`mt-2 flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-brand-red'}`}><TrendIcon className="size-3.5" />{change} <span className="text-muted-foreground">comparado ao mês anterior</span></div>
        </Card>
    );
}

function ChartHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
    return <CardHeader><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div>{action}</CardHeader>;
}

function ExportButton() {
    return <Button variant="outline" size="sm"><Download />Exportar</Button>;
}

ChartsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Gráficos' }]}>{page}</DashboardLayout>
);

export default ChartsPage;