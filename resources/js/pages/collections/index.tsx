import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

interface CollectionRow {
    id: number;
    name: string;
    slug: string;
    type: 'manual' | 'dynamic';
    is_active: boolean;
    is_live: boolean;
    products_total: number;
}

function CollectionsIndexPage({ collections }: { collections: CollectionRow[] }) {
    const route = useRoute();
    const [toDelete, setToDelete] = useState<CollectionRow | null>(null);

    function destroy() {
        if (!toDelete) return;

        router.delete(route('colecoes.destroy', toDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Coleção excluída');
                setToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Catálogo</p>
                    <h1 className="text-2xl font-semibold">Coleções</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Agrupe produtos manualmente ou por regras e filtros.
                    </p>
                </div>
                <Button asChild>
                    <Link href={route('colecoes.create')}>
                        <Plus /> Nova coleção
                    </Link>
                </Button>
            </div>

            <div className="bg-card overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Coleção</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Produtos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collections.map((collection) => (
                            <TableRow key={collection.id}>
                                <TableCell className="font-medium">{collection.name}</TableCell>
                                <TableCell className="text-muted-foreground">{collection.slug}</TableCell>
                                <TableCell>{collection.type === 'manual' ? 'Manual' : 'Dinâmica'}</TableCell>
                                <TableCell>{collection.products_total}</TableCell>
                                <TableCell>
                                    <Badge variant={collection.is_live ? 'default' : 'secondary'}>
                                        {collection.is_live ? 'No ar' : collection.is_active ? 'Fora da vigência' : 'Inativa'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button asChild variant="ghost" size="icon" aria-label={`Editar ${collection.name}`}>
                                            <Link href={route('colecoes.edit', collection.id)}>
                                                <Pencil />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir ${collection.name}`}
                                            onClick={() => setToDelete(collection)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {collections.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                                    Nenhuma coleção cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir coleção?</DialogTitle>
                        <DialogDescription>
                            “{toDelete?.name}” será removida. Os produtos não são excluídos.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={destroy}>
                            Excluir coleção
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

CollectionsIndexPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Coleções' }]}>{page}</DashboardLayout>
);

export default CollectionsIndexPage;
