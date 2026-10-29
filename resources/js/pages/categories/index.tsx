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

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count: number;
}

interface CategoriesPageProps {
    categories: {
        data: Category[];
        total: number;
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}

function CategoriesPage({ categories }: CategoriesPageProps) {
    const route = useRoute();
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    function deleteCategory() {
        if (!categoryToDelete) return;

        router.delete(route('categorias.destroy', categoryToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Categoria excluída');
                setCategoryToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Parametrizações</p>
                    <h1 className="text-2xl font-semibold">Categorias</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Organize os produtos do catálogo em categorias.
                    </p>
                </div>
                <Button asChild>
                    <Link href={route('categorias.create')}><Plus /> Nova categoria</Link>
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Produtos</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.data.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>
                                    <div className="font-medium">{category.name}</div>
                                    {category.description && (
                                        <div className="text-muted-foreground mt-0.5 max-w-xl truncate text-xs">
                                            {category.description}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                                <TableCell>{category.products_count}</TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button asChild variant="ghost" size="icon" aria-label={`Editar ${category.name}`}>
                                            <Link href={route('categorias.edit', category.id)}><Pencil /></Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir ${category.name}`}
                                            onClick={() => setCategoryToDelete(category)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-muted-foreground py-12 text-center">
                                    Nenhuma categoria cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                    {categories.total} {categories.total === 1 ? 'categoria' : 'categorias'}
                </p>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" disabled={!categories.prev_page_url}>
                        {categories.prev_page_url ? <Link href={categories.prev_page_url}>Anterior</Link> : <span>Anterior</span>}
                    </Button>
                    <span className="text-muted-foreground">Página {categories.current_page} de {categories.last_page}</span>
                    <Button asChild variant="outline" size="sm" disabled={!categories.next_page_url}>
                        {categories.next_page_url ? <Link href={categories.next_page_url}>Próxima</Link> : <span>Próxima</span>}
                    </Button>
                </div>
            </div>

            <Dialog
                open={categoryToDelete !== null}
                onOpenChange={(open) => !open && setCategoryToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir categoria?</DialogTitle>
                        <DialogDescription>
                            “{categoryToDelete?.name}” será removida. Os produtos vinculados ficarão sem categoria.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={deleteCategory}>Excluir categoria</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

CategoriesPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Produtos', href: '/produtos' }, { title: 'Categorias' }]}>
        {page}
    </DashboardLayout>
);

export default CategoriesPage;
