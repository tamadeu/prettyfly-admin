import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/layout/dashboard';

interface Coupon {
    id: number; code: string; name: string; discount_type: 'percentage' | 'fixed';
    discount_value: string | number; minimum_order: string | number; starts_at: string | null; ends_at: string | null;
    is_active: boolean; usage_limit: number | null; per_customer_limit: number | null; reserved_count: number; redeemed_count: number;
}
interface PageProps { coupons: { data: Coupon[]; total: number; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null } }
const money = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem limite';

function CouponsPage({ coupons }: PageProps) {
    const route = useRoute();
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
    function deleteCoupon() {
        if (!couponToDelete) return;
        router.delete(route('cupons.destroy', couponToDelete.id), {
            preserveScroll: true,
            onSuccess: () => { toast.success('Cupom desativado'); setCouponToDelete(null); },
        });
    }

    return (
        <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-muted-foreground text-sm font-medium">Marketing</p><h1 className="text-2xl font-semibold">Cupons</h1><p className="text-muted-foreground mt-1 text-sm">Crie descontos e controle validade, limites e elegibilidade.</p></div>
                <Button asChild><Link href={route('cupons.create')}><Plus /> Novo cupom</Link></Button>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
                <Table><TableHeader><TableRow><TableHead>Cupom</TableHead><TableHead>Desconto</TableHead><TableHead>Validade</TableHead><TableHead>Usos</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {coupons.data.map((coupon) => <TableRow key={coupon.id}>
                            <TableCell><div className="flex items-center gap-2"><TicketPercent className="text-muted-foreground size-4" /><div><div className="font-mono font-semibold">{coupon.code}</div><div className="text-muted-foreground text-xs">{coupon.name}</div></div></div></TableCell>
                            <TableCell>{coupon.discount_type === 'percentage' ? `${Number(coupon.discount_value)}%` : money(coupon.discount_value)}<div className="text-muted-foreground text-xs">Mín. {money(coupon.minimum_order)}</div></TableCell>
                            <TableCell>{date(coupon.starts_at)} – {date(coupon.ends_at)}</TableCell>
                            <TableCell>{coupon.redeemed_count} utilizados{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}<div className="text-muted-foreground text-xs">{coupon.reserved_count} reservas ativas</div></TableCell>
                            <TableCell><span className={coupon.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>{coupon.is_active ? 'Ativo' : 'Inativo'}</span></TableCell>
                            <TableCell><div className="flex justify-end gap-1">
                                <Button asChild variant="ghost" size="icon" aria-label={'Editar ' + coupon.code}><Link href={route('cupons.edit', coupon.id)}><Pencil /></Link></Button>
                                <Button variant="ghost" size="icon" aria-label={'Desativar ' + coupon.code} onClick={() => setCouponToDelete(coupon)}><Trash2 /></Button>
                            </div></TableCell>
                        </TableRow>)}
                        {coupons.data.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-12 text-center">Nenhum cupom cadastrado.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">{coupons.total} {coupons.total === 1 ? 'cupom' : 'cupons'}</p>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" disabled={!coupons.prev_page_url}>{coupons.prev_page_url ? <Link href={coupons.prev_page_url}>Anterior</Link> : <span>Anterior</span>}</Button>
                    <span className="text-muted-foreground">Página {coupons.current_page} de {coupons.last_page}</span>
                    <Button asChild variant="outline" size="sm" disabled={!coupons.next_page_url}>{coupons.next_page_url ? <Link href={coupons.next_page_url}>Próxima</Link> : <span>Próxima</span>}</Button>
                </div>
            </div>
            <Dialog open={couponToDelete !== null} onOpenChange={(open) => !open && setCouponToDelete(null)}>
                <DialogContent><DialogHeader><DialogTitle>Desativar cupom?</DialogTitle><DialogDescription>O cupom “{couponToDelete?.code}” será desativado e não poderá ser aplicado em novos carrinhos.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setCouponToDelete(null)}>Cancelar</Button><Button variant="destructive" onClick={deleteCoupon}>Desativar</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
CouponsPage.layout = (page: React.ReactNode) => <DashboardLayout breadcrumb={[{ title: 'Marketing' }, { title: 'Cupons' }]}>{page}</DashboardLayout>;
export default CouponsPage;
