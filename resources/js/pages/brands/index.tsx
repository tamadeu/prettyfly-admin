import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
}

interface BrandsPageProps {
    brands: {
        data: Brand[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}

function BrandsPage({ brands }: BrandsPageProps) {
    const route = useRoute();
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

    function deleteBrand() {
        if (!brandToDelete) return;

        router.delete(route('marcas.destroy', brandToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Marca excluída');
                setBrandToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Catálogo</p>
                    <h1 className="text-2xl font-semibold">Marcas</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Cadastre as marcas e vincule-as aos produtos.
                    </p>
                </div>
                <Button asChild>
                    <Link href={route('marcas.create')}><Plus /> Nova marca</Link>
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Marca</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Produtos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {brands.data.map((brand) => (
                            <TableRow key={brand.id}>
                                <TableCell>
                                    <div className="font-medium">{brand.name}</div>
                                    {brand.description && (
                                        <div className="text-muted-foreground mt-0.5 max-w-xl truncate text-xs">
                                            {brand.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{brand.slug}</TableCell>
                                <TableCell>{brand.products_count}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button asChild variant="ghost" size="icon" aria-label={`Editar ${brand.name}`}>
                                            <Link href={route('marcas.edit', brand.id)}><Pencil /></Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir ${brand.name}`}
                                            onClick={() => setBrandToDelete(brand)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {brands.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground py-12 text-center">
                                    Nenhuma marca cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    {brands.total} {brands.total === 1 ? 'marca' : 'marcas'}
                </p>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" disabled={!brands.prev_page_url}>
                        {brands.prev_page_url ? <Link href={brands.prev_page_url}>Anterior</Link> : <span>Anterior</span>}
                    </Button>
                    <span className="text-muted-foreground">Página {brands.current_page} de {brands.last_page}</span>
                    <Button asChild variant="outline" size="sm" disabled={!brands.next_page_url}>
                        {brands.next_page_url ? <Link href={brands.next_page_url}>Próxima</Link> : <span>Próxima</span>}
                    </Button>
                </div>
            </div>

            <Dialog
                open={brandToDelete !== null}
                onOpenChange={(open) => !open && setBrandToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir marca?</DialogTitle>
                        <DialogDescription>
                            “{brandToDelete?.name}” será removida. Os produtos vinculados ficarão sem marca.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBrandToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={deleteBrand}>Excluir marca</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

BrandsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Produtos', href: '/produtos' }, { title: 'Marcas' }]}>
        {page}
    </DashboardLayout>
);

export default BrandsPage;
