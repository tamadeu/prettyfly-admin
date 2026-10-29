import React, { useState } from 'react';
import { Filter, MoreHorizontal, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

type InvoiceStatus = 'Pago' | 'Atrasado' | 'Parcial' | 'Emitido';

const invoices: Array<{
    id: string;
    customer: string;
    email: string;
    issued: string;
    due: string;
    dueNote?: string;
    amount: string;
    paid: string;
    remaining: string;
    status: InvoiceStatus;
}> = [
    { id: '#56201134', customer: 'Lucas Bennett', email: 'lucas.bennett@mailhub.io', issued: '12/05/24', due: '19/05/24', amount: 'R$ 129,90', paid: 'R$ 129,90', remaining: '-', status: 'Pago' },
    { id: '#41977265', customer: 'Emma Collins', email: 'emma.collins@mailhub.io', issued: '24/04/24', due: '01/05/24', dueNote: 'há 4 dias', amount: 'R$ 249,90', paid: '-', remaining: 'R$ 249,90', status: 'Atrasado' },
    { id: '#73058491', customer: 'Henry Walsh', email: 'henry.walsh@mailhub.io', issued: '24/04/24', due: '06/05/24', amount: 'R$ 249,90', paid: 'R$ 249,90', remaining: '-', status: 'Pago' },
    { id: '#62149378', customer: 'Ruby Dalton', email: 'ruby.dalton@mailhub.io', issued: '24/04/24', due: '06/05/24', dueNote: 'em 2 dias', amount: 'R$ 219,90', paid: 'R$ 159,90', remaining: 'R$ 60,00', status: 'Parcial' },
    { id: '#58306142', customer: 'Oscar Reid', email: 'oscar.reid@mailhub.io', issued: '24/04/24', due: '03/05/24', amount: 'R$ 129,90', paid: '-', remaining: 'R$ 129,90', status: 'Emitido' },
    { id: '#30298467', customer: 'Ivy Sanders', email: 'ivy.sanders@mailhub.io', issued: '24/04/24', due: '06/05/24', amount: 'R$ 129,90', paid: 'R$ 129,90', remaining: '-', status: 'Pago' },
];

const statusVariant = {
    Pago: 'success',
    Atrasado: 'destructive',
    Parcial: 'warning',
    Emitido: 'secondary',
} as const;

function TablesPage() {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('Todos');
    const [selected, setSelected] = useState<string[]>([]);

    const visibleInvoices = invoices.filter((invoice) => {
        const matchesQuery = `${invoice.customer} ${invoice.email} ${invoice.id}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return matchesQuery && (status === 'Todos' || invoice.status === status);
    });
    const allVisibleSelected = visibleInvoices.length > 0 && visibleInvoices.every((invoice) => selected.includes(invoice.id));

    function toggleAll() {
        if (allVisibleSelected) {
            setSelected((current) => current.filter((id) => !visibleInvoices.some((invoice) => invoice.id === id)));
            return;
        }
        setSelected((current) => Array.from(new Set([...current, ...visibleInvoices.map((invoice) => invoice.id)])));
    }

    function toggleInvoice(id: string) {
        setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    return (
        <main className="space-y-6">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Padrões de dados</p>
                <h1 className="text-2xl font-semibold">Tabelas</h1>
                <p className="text-muted-foreground mt-1 text-sm">Listagens densas, ações e estados para fluxos operacionais.</p>
            </div>

            <section className="space-y-4" aria-labelledby="invoice-table-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Filter />
                                    <span className="hidden sm:inline">{status === 'Todos' ? 'Filtrar' : status}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuRadioGroup value={status} onValueChange={setStatus}>
                                    {['Todos', 'Pago', 'Atrasado', 'Parcial', 'Emitido'].map((item) => (
                                        <DropdownMenuRadioItem key={item} value={item}>{item}</DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <div className="relative w-full max-w-sm">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input aria-label="Buscar faturas" className="pl-9" placeholder="Buscar cliente ou fatura" value={query} onChange={(event) => setQuery(event.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button><Plus />Adicionar</Button>
                        <Button variant="outline" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border bg-card">
                    <h2 id="invoice-table-title" className="sr-only">Faturas recentes</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"><Checkbox aria-label="Selecionar todas" checked={allVisibleSelected} onChange={toggleAll} /></TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Fatura</TableHead>
                                <TableHead data-priority="medium">Emissão</TableHead>
                                <TableHead data-priority="low">Vencimento</TableHead>
                                <TableHead data-priority="lowest">Valor</TableHead>
                                <TableHead data-priority="lowest">Pago</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleInvoices.map((invoice) => (
                                <TableRow key={invoice.id} data-state={selected.includes(invoice.id) ? 'selected' : undefined}>
                                    <TableCell><Checkbox aria-label={`Selecionar ${invoice.customer}`} checked={selected.includes(invoice.id)} onChange={() => toggleInvoice(invoice.id)} /></TableCell>
                                    <TableCell>
                                        <div className="font-medium">{invoice.customer}</div>
                                        <div className="text-muted-foreground mt-0.5 text-xs">{invoice.email}</div>
                                    </TableCell>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell data-priority="medium">{invoice.issued}</TableCell>
                                    <TableCell data-priority="low">
                                        <div>{invoice.due}</div>
                                        {invoice.dueNote && <div className={invoice.status === 'Atrasado' ? 'text-destructive text-xs' : 'text-amber-600 text-xs'}>{invoice.dueNote}</div>}
                                    </TableCell>
                                    <TableCell data-priority="lowest">{invoice.amount}</TableCell>
                                    <TableCell data-priority="lowest">{invoice.paid}</TableCell>
                                    <TableCell><Badge variant={statusVariant[invoice.status]}>{invoice.status}</Badge></TableCell>
                                    <TableCell className="text-right"><Button variant="ghost" size="sm">Ver</Button></TableCell>
                                </TableRow>
                            ))}
                            {visibleInvoices.length === 0 && (
                                <TableRow><TableCell colSpan={9} className="text-muted-foreground py-12 text-center">Nenhuma fatura encontrada.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <p className="text-muted-foreground text-xs">
                    {visibleInvoices.length} {visibleInvoices.length === 1 ? 'registro' : 'registros'} · {selected.length} selecionados
                </p>
            </section>
        </main>
    );
}

TablesPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Tabelas' }]}>{page}</DashboardLayout>
);

export default TablesPage;