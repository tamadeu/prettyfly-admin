import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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

interface Customer {
    id: number;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    last_login_at: string | null;
    user: { id: number; name: string; email: string };
}

interface CustomersPageProps {
    customers: {
        data: Customer[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    search: string;
}

function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleDateString('pt-BR') : '—';
}

function CustomersPage({ customers, search }: CustomersPageProps) {
    const route = useRoute();
    const [term, setTerm] = useState(search);
    const [toDelete, setToDelete] = useState<Customer | null>(null);

    function submitSearch(event: React.FormEvent) {
        event.preventDefault();
        router.get(route('clientes.index'), term ? { busca: term } : {}, { preserveState: true });
    }

    function remove() {
        if (!toDelete) return;

        router.delete(route('clientes.destroy', toDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Cliente excluído');
                setToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Loja</p>
                    <h1 className="text-2xl font-semibold">Clientes</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Contas de quem se cadastra e entra no site. Elas não têm acesso ao admin.
                    </p>
                </div>
                <Button asChild>
                    <Link href={route('clientes.create')}><Plus /> Novo cliente</Link>
                </Button>
            </div>

            <form onSubmit={submitSearch} className="flex max-w-md gap-2">
                <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Buscar por nome, e-mail, telefone ou CPF"
                />
                <Button type="submit" variant="outline" size="icon" aria-label="Buscar"><Search /></Button>
            </form>

            <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead>Último acesso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.data.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="font-medium">{customer.user.name}</div>
                                    <div className="text-muted-foreground text-xs">{customer.user.email}</div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{customer.phone || '—'}</TableCell>
                                <TableCell>{customer.is_active ? 'Ativo' : 'Bloqueado'}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(customer.created_at)}</TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(customer.last_login_at)}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button asChild variant="ghost" size="icon" aria-label={`Editar ${customer.user.name}`}>
                                            <Link href={route('clientes.edit', customer.id)}><Pencil /></Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir ${customer.user.name}`}
                                            onClick={() => setToDelete(customer)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {customers.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                                    Nenhum cliente encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    {customers.total} {customers.total === 1 ? 'cliente' : 'clientes'}
                </p>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" disabled={!customers.prev_page_url}>
                        {customers.prev_page_url ? <Link href={customers.prev_page_url}>Anterior</Link> : <span>Anterior</span>}
                    </Button>
                    <span className="text-muted-foreground">Página {customers.current_page} de {customers.last_page}</span>
                    <Button asChild variant="outline" size="sm" disabled={!customers.next_page_url}>
                        {customers.next_page_url ? <Link href={customers.next_page_url}>Próxima</Link> : <span>Próxima</span>}
                    </Button>
                </div>
            </div>

            <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir cliente?</DialogTitle>
                        <DialogDescription>
                            A conta de “{toDelete?.user.name}” será removida e ela não conseguirá mais entrar no site.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={remove}>Excluir cliente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

CustomersPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Clientes' }]}>{page}</DashboardLayout>
);

export default CustomersPage;
