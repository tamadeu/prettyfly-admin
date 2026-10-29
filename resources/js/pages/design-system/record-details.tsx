import React, { useState } from 'react';
import {
    Archive,
    Bell,
    Building2,
    CalendarDays,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Copy,
    History,
    Mail,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    Phone,
    Plus,
    Star,
    UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/layout/dashboard';

const opportunities = [
    { name: 'Expansão de licenças', stage: 'Proposta', contactRole: 'Decisor', value: 'R$ 24.500' },
    { name: 'Renovação anual', stage: 'Negociação', contactRole: 'Influenciador', value: 'R$ 18.200' },
];

type DetailTab = 'contato' | 'atividades' | 'suporte';

function RecordDetailsPage() {
    const [activeTab, setActiveTab] = useState<DetailTab>('contato');
    const [following, setFollowing] = useState(false);

    return (
        <main className="mx-auto w-full max-w-7xl space-y-4 pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="size-2 rounded-sm bg-brand-yellow" />
                        <span className="text-primary font-medium">Contatos</span>
                        <ChevronRight className="text-muted-foreground size-4" />
                        <span className="text-muted-foreground">Frederick Devine</span>
                    </div>
                    <h1 className="mt-2 text-2xl font-semibold">Frederick Devine</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Contato · AFP Supply</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:pt-7">
                    <EditContactDialog />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => toast.success('Contato duplicado')}><Copy />Duplicar contato</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => toast.success('E-mail preparado')}><Mail />Enviar e-mail</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => toast.success('Contato arquivado')}><Archive />Arquivar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="icon" aria-label="Contato anterior" title="Contato anterior"><ChevronLeft /></Button>
                    <Button variant="outline" size="icon" aria-label="Próximo contato" title="Próximo contato"><ChevronRight /></Button>

                </div>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Visão geral</CardTitle></CardHeader>
                        <CardContent className="grid gap-x-10 gap-y-7 pt-5 md:grid-cols-2">
                            <div className="space-y-6">
                                <DetailField label="Nome"><div className="font-medium">Frederick Devine</div></DetailField>
                                <DetailField label="E-mail"><a href="mailto:f.devine@afp-supply.com" className="text-primary font-medium hover:underline">f.devine@afp-supply.com</a></DetailField>
                                <DetailField label="Endereço"><div>Tellower Damm 301<br />Berlim, 10178<br />Alemanha</div></DetailField>
                                <DetailField label="Aniversário"><span className="text-muted-foreground">Não informado</span></DetailField>
                            </div>
                            <div className="space-y-6">
                                <DetailField label="Conta"><div className="flex items-center gap-2 font-medium"><Building2 className="text-brand-yellow size-4" />AFP Supply <span className="text-muted-foreground font-normal">· Gerente</span></div></DetailField>
                                <DetailField label="Telefone"><a href="tel:+491771234567" className="text-primary font-medium hover:underline">+49 177 1234567</a> <span className="text-muted-foreground text-sm">Celular</span></DetailField>
                                <DetailField label="Foto"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=85" alt="Frederick Devine" className="size-24 rounded-lg object-cover" /></DetailField>
                                <DetailField label="Descrição"><span className="text-muted-foreground">Contato principal para contratos e renovações.</span></DetailField>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="border-b" role="tablist" aria-label="Seções do contato">
                        {([
                            ['contato', 'Contato'],
                            ['atividades', 'Atividades'],
                            ['suporte', 'Suporte'],
                        ] as const).map(([value, label]) => (
                            <button key={value} role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value)} className={`border-b-2 px-4 py-3 text-sm font-medium ${activeTab === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{label}</button>
                        ))}
                    </div>

                    {activeTab === 'contato' && <ContactRelations />}
                    {activeTab === 'atividades' && <ActivityStream />}
                    {activeTab === 'suporte' && <SupportSummary />}
                </div>

                <aside className="space-y-4">
                    <Card>
                        <CardContent className="space-y-5 pt-5">
                            <DetailField label="Usuário designado"><div className="flex items-center gap-2"><span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold">JA</span>Jack Adams</div></DetailField>
                            <DetailField label="Equipe"><span className="text-muted-foreground">Vendas corporativas</span></DetailField>
                            <DetailField label="Criado"><div>Hoje, 16:00</div><div className="text-muted-foreground text-xs">por Jack Adams</div></DetailField>
                            <DetailField label="Modificado"><div>Hoje, 16:00</div><div className="text-muted-foreground text-xs">por Jack Adams</div></DetailField>
                        </CardContent>
                    </Card>

                    <CompactPanel title="Atividades" action={
                        <div className="flex gap-1"><IconAction label="Enviar e-mail" icon={Mail} /><IconAction label="Agendar reunião" icon={CalendarDays} /><IconAction label="Registrar ligação" icon={Phone} /></div>
                    }>
                        <p className="text-muted-foreground text-sm">Nenhuma atividade futura.</p>
                    </CompactPanel>

                    <CompactPanel title="Histórico" action={<IconAction label="Ver histórico" icon={History} />}>
                        <div className="flex gap-3"><div className="bg-muted flex size-8 items-center justify-center rounded-full"><UserRound className="size-4" /></div><div><p className="text-sm">Contato criado</p><p className="text-muted-foreground text-xs">Hoje, 16:00 por Jack Adams</p></div></div>
                    </CompactPanel>

                    <CompactPanel title="Tarefas" action={<IconAction label="Adicionar tarefa" icon={Plus} />}>
                        <div className="flex items-center gap-3"><CheckSquare className="text-muted-foreground size-4" /><span className="text-muted-foreground text-sm">Nenhuma tarefa pendente.</span></div>
                    </CompactPanel>
                </aside>
            </div>
        </main>
    );
}

function ContactRelations() {
    return (
        <Card>
            <CardHeader>
                <div><CardTitle>Oportunidades</CardTitle><CardDescription>Negociações relacionadas a este contato</CardDescription></div>
                <NewOpportunitySheet />
            </CardHeader>
            <CardContent className="pt-4">
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Estágio</TableHead><TableHead data-priority="medium">Papel do contato</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                        <TableBody>{opportunities.map((opportunity) => <TableRow key={opportunity.name}><TableCell className="py-3 font-medium">{opportunity.name}</TableCell><TableCell className="py-3"><Badge variant="warning">{opportunity.stage}</Badge></TableCell><TableCell data-priority="medium" className="py-3">{opportunity.contactRole}</TableCell><TableCell className="py-3 text-right font-medium">{opportunity.value}</TableCell></TableRow>)}</TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityStream() {
    return <Card><CardHeader><CardTitle>Fluxo de atividades</CardTitle></CardHeader><CardContent className="space-y-5 pt-5"><Timeline icon={Mail} title="E-mail enviado" description="Proposta comercial compartilhada com Frederick" time="Hoje, 15:40" /><Timeline icon={Phone} title="Ligação concluída" description="Alinhamento sobre renovação anual" time="Ontem, 11:20" /><Timeline icon={MessageSquare} title="Nota adicionada" description="Cliente solicitou revisão das condições" time="08 ago, 09:15" /></CardContent></Card>;
}

function SupportSummary() {
    return <Card><CardHeader><CardTitle>Suporte</CardTitle><CardDescription>Atendimentos vinculados ao contato</CardDescription></CardHeader><CardContent className="pt-5"><div className="grid gap-3 sm:grid-cols-3"><Stat label="Abertos" value="1" /><Stat label="Resolvidos" value="12" /><Stat label="SLA médio" value="3h 24m" /></div></CardContent></Card>;
}

function EditContactDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild><Button>Editar</Button></DialogTrigger>
            <DialogContent>
                <form onSubmit={(event) => { event.preventDefault(); toast.success('Contato atualizado'); }}>
                    <DialogHeader><DialogTitle>Editar contato</DialogTitle><DialogDescription>Atualize os dados principais deste registro.</DialogDescription></DialogHeader>
                    <FieldGroup className="my-6 gap-4 sm:grid sm:grid-cols-2">
                        <Field><FieldLabel htmlFor="record-first-name">Nome</FieldLabel><Input id="record-first-name" defaultValue="Frederick" /></Field>
                        <Field><FieldLabel htmlFor="record-last-name">Sobrenome</FieldLabel><Input id="record-last-name" defaultValue="Devine" /></Field>
                        <Field className="sm:col-span-2"><FieldLabel htmlFor="record-email">E-mail</FieldLabel><Input id="record-email" type="email" defaultValue="f.devine@afp-supply.com" /></Field>
                        <Field className="sm:col-span-2"><FieldLabel htmlFor="record-description">Descrição</FieldLabel><Textarea id="record-description" defaultValue="Contato principal para contratos e renovações." /></Field>
                    </FieldGroup>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><DialogClose asChild><Button type="submit">Salvar alterações</Button></DialogClose></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function NewOpportunitySheet() {
    return (
        <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="sm"><Plus />Adicionar</Button></SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader className="border-b px-6 py-5"><SheetTitle>Nova oportunidade</SheetTitle><SheetDescription>Vincule uma negociação a Frederick Devine.</SheetDescription></SheetHeader>
                <FieldGroup className="flex-1 content-start gap-5 overflow-y-auto px-6 py-5">
                    <Field><FieldLabel htmlFor="opportunity-name">Nome</FieldLabel><Input id="opportunity-name" placeholder="Nome da oportunidade" /></Field>
                    <Field><FieldLabel htmlFor="opportunity-stage">Estágio</FieldLabel><Select id="opportunity-stage" defaultValue="qualification"><option value="qualification">Qualificação</option><option value="proposal">Proposta</option><option value="negotiation">Negociação</option></Select></Field>
                    <Field><FieldLabel htmlFor="opportunity-value">Valor estimado</FieldLabel><Input id="opportunity-value" placeholder="R$ 0,00" /></Field>
                </FieldGroup>
                <SheetFooter className="border-t px-6"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><SheetClose asChild><Button onClick={() => toast.success('Oportunidade criada')}>Criar oportunidade</Button></SheetClose></SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><div className="text-muted-foreground mb-1 text-sm">{label}</div><div className="text-sm leading-6">{children}</div></div>;
}

function CompactPanel({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
    return <Card><CardHeader className="items-center py-3"><CardTitle>{title}</CardTitle>{action}</CardHeader><Separator /><CardContent className="pt-4">{children}</CardContent></Card>;
}

function IconAction({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
    return <Button variant="ghost" size="icon-sm" aria-label={label} title={label} onClick={() => toast.success(`${label} preparado`)}><Icon /></Button>;
}

function Timeline({ icon: Icon, title, description, time }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; time: string }) {
    return <div className="flex gap-3"><div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full"><Icon className="size-4" /></div><div><div className="text-sm font-medium">{title}</div><div className="text-muted-foreground mt-0.5 text-sm">{description}</div><div className="text-muted-foreground mt-1 text-xs">{time}</div></div></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
    return <div className="rounded-md border p-4"><div className="text-muted-foreground text-xs">{label}</div><div className="mt-2 text-xl font-semibold">{value}</div></div>;
}

RecordDetailsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Detalhes de registro' }]}>{page}</DashboardLayout>
);

export default RecordDetailsPage;