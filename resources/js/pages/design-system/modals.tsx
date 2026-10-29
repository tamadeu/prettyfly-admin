import React from 'react';
import { Activity, Info, ListFilter, PanelRightOpen, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import DashboardLayout from '@/layout/dashboard';

function ModalsPage() {
    return (
        <main className="mx-auto w-full max-w-5xl space-y-8 pb-10">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Camadas e contexto</p>
                <h1 className="text-2xl font-semibold">Modais e painéis</h1>
                <p className="text-muted-foreground mt-1 text-sm">Padrões para decisões focadas e tarefas laterais sem perder o contexto da página.</p>
            </div>

            <section aria-labelledby="modals-title">
                <SectionHeading id="modals-title" title="Modais" description="Use para decisões curtas, confirmações e formulários compactos que bloqueiam temporariamente o restante da interface." />
                <div className="grid gap-4 md:grid-cols-3">
                    <ExampleCard icon={Info} title="Informativo" description="Apresenta uma informação que requer reconhecimento.">
                        <Dialog>
                            <DialogTrigger asChild><Button variant="outline" className="w-full">Abrir modal</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Atualização disponível</DialogTitle>
                                    <DialogDescription>Uma nova versão do relatório está disponível com dados processados até hoje.</DialogDescription>
                                </DialogHeader>
                                <div className="rounded-md bg-muted p-4 text-sm"><strong>Versão 2.4</strong><p className="text-muted-foreground mt-1">Inclui novos filtros e exportação em CSV.</p></div>
                                <DialogFooter><DialogClose asChild><Button>Entendi</Button></DialogClose></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </ExampleCard>

                    <ExampleCard icon={UserRound} title="Formulário" description="Coleta poucos dados sem iniciar um novo fluxo.">
                        <Dialog>
                            <DialogTrigger asChild><Button className="w-full">Editar perfil</Button></DialogTrigger>
                            <DialogContent>
                                <form onSubmit={(event) => { event.preventDefault(); toast.success('Perfil atualizado'); }}>
                                    <DialogHeader>
                                        <DialogTitle>Editar perfil</DialogTitle>
                                        <DialogDescription>Atualize as informações públicas do usuário.</DialogDescription>
                                    </DialogHeader>
                                    <FieldGroup className="my-6 gap-4">
                                        <Field><FieldLabel htmlFor="modal-name">Nome</FieldLabel><Input id="modal-name" defaultValue="Emma Crown" /></Field>
                                        <Field><FieldLabel htmlFor="modal-role">Cargo</FieldLabel><Input id="modal-role" defaultValue="Gerente de produto" /></Field>
                                    </FieldGroup>
                                    <DialogFooter>
                                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                        <DialogClose asChild><Button type="submit">Salvar alterações</Button></DialogClose>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </ExampleCard>

                    <ExampleCard icon={Trash2} title="Confirmação" description="Confirma ações irreversíveis e explica o impacto.">
                        <Dialog>
                            <DialogTrigger asChild><Button variant="destructive" className="w-full">Excluir projeto</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Excluir este projeto?</DialogTitle>
                                    <DialogDescription>Esta ação remove permanentemente o projeto, seus arquivos e o histórico da equipe. Ela não pode ser desfeita.</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                    <DialogClose asChild><Button variant="destructive" onClick={() => toast.success('Projeto excluído')}>Excluir projeto</Button></DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </ExampleCard>
                </div>
            </section>

            <Separator />

            <section aria-labelledby="offcanvas-title">
                <SectionHeading id="offcanvas-title" title="Offcanvas à direita" description="Use para tarefas auxiliares mais longas, detalhes e filtros que preservam a página de origem ao fundo." />
                <div className="grid gap-4 md:grid-cols-3">
                    <ExampleCard icon={PanelRightOpen} title="Detalhes" description="Exibe dados relacionados sem sair da listagem.">
                        <Sheet>
                            <SheetTrigger asChild><Button variant="outline" className="w-full">Ver detalhes</Button></SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md">
                                <SheetHeader className="border-b px-6 py-5"><SheetTitle>Detalhes da fatura</SheetTitle><SheetDescription>#56201134 · Emitida em 12/05/24</SheetDescription></SheetHeader>
                                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                                    <div><div className="text-muted-foreground text-xs uppercase">Cliente</div><div className="mt-1 font-medium">Lucas Bennett</div><div className="text-muted-foreground text-sm">lucas.bennett@mailhub.io</div></div>
                                    <Separator />
                                    <DetailRow label="Valor total" value="R$ 129,90" /><DetailRow label="Vencimento" value="19/05/24" /><DetailRow label="Status" value="Pago" />
                                </div>
                                <SheetFooter className="border-t px-6"><SheetClose asChild><Button variant="outline">Fechar</Button></SheetClose><Button>Baixar fatura</Button></SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </ExampleCard>

                    <ExampleCard icon={ListFilter} title="Filtros" description="Agrupa opções que refinam o conteúdo principal.">
                        <Sheet>
                            <SheetTrigger asChild><Button variant="outline" className="w-full">Abrir filtros</Button></SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md">
                                <SheetHeader className="border-b px-6 py-5"><SheetTitle>Filtrar resultados</SheetTitle><SheetDescription>Combine filtros para refinar a listagem.</SheetDescription></SheetHeader>
                                <FieldGroup className="flex-1 content-start gap-6 overflow-y-auto px-6 py-5">
                                    <Field><FieldLabel htmlFor="filter-status">Status</FieldLabel><Select id="filter-status" defaultValue="all"><option value="all">Todos</option><option value="paid">Pago</option><option value="overdue">Atrasado</option></Select></Field>
                                    <Field><FieldLabel htmlFor="filter-customer">Cliente</FieldLabel><Input id="filter-customer" placeholder="Nome ou e-mail" /></Field>
                                    <fieldset className="space-y-3"><legend className="text-sm font-medium">Período</legend><CheckOption id="last-week" label="Últimos 7 dias" /><CheckOption id="last-month" label="Últimos 30 dias" defaultChecked /><CheckOption id="this-year" label="Este ano" /></fieldset>
                                </FieldGroup>
                                <SheetFooter className="border-t px-6"><SheetClose asChild><Button variant="outline">Limpar</Button></SheetClose><SheetClose asChild><Button onClick={() => toast.success('Filtros aplicados')}>Aplicar filtros</Button></SheetClose></SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </ExampleCard>

                    <ExampleCard icon={Activity} title="Atividade" description="Apresenta histórico e informações contextuais extensas.">
                        <Sheet>
                            <SheetTrigger asChild><Button variant="outline" className="w-full">Ver atividade</Button></SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-xl">
                                <SheetHeader className="border-b px-6 py-5"><SheetTitle>Atividade do projeto</SheetTitle><SheetDescription>Alterações realizadas nos últimos 30 dias.</SheetDescription></SheetHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-5">
                                    <TimelineItem title="Projeto publicado" description="Emma publicou a versão 2.4" time="Hoje, 14:32" />
                                    <TimelineItem title="Arquivo atualizado" description="Lucas substituiu briefing.pdf" time="Ontem, 09:18" />
                                    <TimelineItem title="Comentário adicionado" description="Ivy mencionou você em uma tarefa" time="08 ago, 16:05" last />
                                </div>
                                <SheetFooter className="border-t px-6"><SheetClose asChild><Button>Concluir</Button></SheetClose></SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </ExampleCard>
                </div>
            </section>
        </main>
    );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return <div className="mb-4 max-w-2xl"><h2 id={id} className="text-base font-semibold">{title}</h2><p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p></div>;
}

function ExampleCard({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
    return <Card><CardHeader><div className="bg-muted flex size-9 items-center justify-center rounded-md"><Icon className="size-4" /></div></CardHeader><CardContent className="flex flex-1 flex-col pt-4"><CardTitle>{title}</CardTitle><CardDescription className="min-h-12">{description}</CardDescription><div className="mt-5">{children}</div></CardContent></Card>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}

function CheckOption({ id, label, defaultChecked = false }: { id: string; label: string; defaultChecked?: boolean }) {
    return <label htmlFor={id} className="flex items-center gap-3 text-sm"><Checkbox id={id} defaultChecked={defaultChecked} />{label}</label>;
}

function TimelineItem({ title, description, time, last = false }: { title: string; description: string; time: string; last?: boolean }) {
    return <div className="relative flex gap-4 pb-8"><div className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />{!last && <div className="bg-border absolute top-4 bottom-0 left-[4px] w-px" />}<div><div className="text-sm font-medium">{title}</div><div className="text-muted-foreground mt-1 text-sm">{description}</div><div className="text-muted-foreground mt-2 text-xs">{time}</div></div></div>;
}

ModalsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Modais e painéis' }]}>{page}</DashboardLayout>
);

export default ModalsPage;