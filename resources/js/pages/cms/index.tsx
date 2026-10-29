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

interface CmsPage {
    id: number;
    slug: string;
    title: string;
    is_published: boolean;
    sections_count: number;
}

function CmsIndexPage({ pages }: { pages: CmsPage[] }) {
    const route = useRoute();
    const [pageToDelete, setPageToDelete] = useState<CmsPage | null>(null);

    function deletePage() {
        if (!pageToDelete) return;

        router.delete(route('cms.destroy', pageToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Página excluída');
                setPageToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Conteúdo</p>
                    <h1 className="text-2xl font-semibold">CMS</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Monte páginas da loja, como a página principal, a partir de seções.
                    </p>
                </div>
                <Button asChild>
                    <Link href={route('cms.create')}><Plus /> Nova página</Link>
                </Button>
            </div>

            <div className="bg-card overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Página</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Seções</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pages.map((page) => (
                            <TableRow key={page.id}>
                                <TableCell className="font-medium">{page.title}</TableCell>
                                <TableCell className="text-muted-foreground">{page.slug}</TableCell>
                                <TableCell>{page.sections_count}</TableCell>
                                <TableCell>
                                    <Badge variant={page.is_published ? 'default' : 'secondary'}>
                                        {page.is_published ? 'Publicada' : 'Rascunho'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-1">
                                        <Button asChild variant="ghost" size="icon" aria-label={`Editar ${page.title}`}>
                                            <Link href={route('cms.edit', page.id)}><Pencil /></Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Excluir ${page.title}`}
                                            onClick={() => setPageToDelete(page)}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {pages.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-muted-foreground py-12 text-center">
                                    Nenhuma página cadastrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={pageToDelete !== null} onOpenChange={(open) => !open && setPageToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir página?</DialogTitle>
                        <DialogDescription>
                            “{pageToDelete?.title}” e todas as suas seções serão removidas.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPageToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={deletePage}>Excluir página</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

CmsIndexPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'CMS' }]}>{page}</DashboardLayout>
);

export default CmsIndexPage;
