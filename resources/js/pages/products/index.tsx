import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

interface Product {
    id: number;
    name: string;
    slug: string;
    category: { id: number; name: string } | null;
    variants_count: number;
    variants_min_price: string;
    variants_sum_stock: number;
    is_visible: boolean;
    is_active: boolean;
    images: Array<{ id: number; url: string; alt: string | null }>;
}

interface PaginatedProducts {
    data: Product[];
    total: number;
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface ProductsPageProps {
    products: PaginatedProducts;
    filters: {
        search: string;
        status: string;
    };
}

function ProductsPage({ products, filters }: ProductsPageProps) {
    const route = useRoute();
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    function searchProducts(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            route('produtos.index'),
            { search, status },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function filterByStatus(value: string) {
        setStatus(value);
        router.get(
            route('produtos.index'),
            { search, status: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function deleteProduct() {
        if (!productToDelete) return;

        router.delete(route('produtos.destroy', productToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Produto excluído');
                setProductToDelete(null);
            },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-muted-foreground text-sm font-medium">Catálogo</p>
                    <h1 className="text-2xl font-semibold">Produtos</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gerencie produtos, categorias, variantes e disponibilidade da loja.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('categorias.index')}>Categorias</Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('produtos.create')}>
                            <Plus />
                            Novo produto
                        </Link>
                    </Button>
                </div>
            </div>

            <section className="space-y-4" aria-label="Lista de produtos">
                <form onSubmit={searchProducts} className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                            aria-label="Buscar produtos"
                            className="pl-9"
                            placeholder="Buscar por nome, slug ou SKU"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>
                    <Select
                        aria-label="Filtrar produtos"
                        className="sm:max-w-48"
                        value={status}
                        onChange={(event) => filterByStatus(event.target.value)}
                    >
                        <option value="">Todos os produtos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                        <option value="hidden">Não visíveis no site</option>
                    </Select>
                    <Button type="submit" variant="outline">Buscar</Button>
                </form>

                <div className="overflow-hidden rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Variações</TableHead>
                                <TableHead>Preço inicial</TableHead>
                                <TableHead>Estoque</TableHead>
                                <TableHead>Disponibilidade</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.data.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {product.images[0] ? (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.images[0].alt ?? ''}
                                                    className="size-10 rounded-md border object-cover"
                                                />
                                            ) : (
                                                <div className="bg-muted flex size-10 items-center justify-center rounded-md border text-xs text-muted-foreground">
                                                    —
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-muted-foreground mt-0.5 text-xs">/{product.slug}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{product.category?.name ?? '—'}</TableCell>
                                    <TableCell>{product.variants_count}</TableCell>
                                    <TableCell>
                                        {Number(product.variants_min_price).toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                        })}
                                    </TableCell>
                                    <TableCell>{product.variants_sum_stock}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge variant={product.is_active ? 'success' : 'destructive'}>
                                                {product.is_active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                            <Badge variant={product.is_visible ? 'default' : 'secondary'}>
                                                {product.is_visible ? 'Visível' : 'Oculto'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Editar ${product.name}`}
                                            >
                                                <Link href={route('produtos.edit', product.id)}>
                                                    <Pencil />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`Excluir ${product.name}`}
                                                onClick={() => setProductToDelete(product)}
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground py-12 text-center">
                                        Nenhum produto encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground">
                        {products.total} {products.total === 1 ? 'produto' : 'produtos'}
                    </p>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <Button asChild variant="outline" size="sm" disabled={!products.prev_page_url}>
                            {products.prev_page_url ? <Link href={products.prev_page_url}>Anterior</Link> : <span>Anterior</span>}
                        </Button>
                        <span className="text-muted-foreground">Página {products.current_page} de {products.last_page}</span>
                        <Button asChild variant="outline" size="sm" disabled={!products.next_page_url}>
                            {products.next_page_url ? <Link href={products.next_page_url}>Próxima</Link> : <span>Próxima</span>}
                        </Button>
                    </div>
                </div>
            </section>

            <Dialog
                open={productToDelete !== null}
                onOpenChange={(open) => !open && setProductToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir produto?</DialogTitle>
                        <DialogDescription>
                            “{productToDelete?.name}” e suas variações serão removidos permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProductToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={deleteProduct}>Excluir produto</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

ProductsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Produtos' }]}>{page}</DashboardLayout>
);

export default ProductsPage;
