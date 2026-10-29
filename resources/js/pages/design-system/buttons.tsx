import React from 'react';
import {
    ArrowRight,
    Check,
    Download,
    LoaderCircle,
    Mail,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/layout/dashboard';

const colors = [
    { name: 'Azul principal', token: 'brand-blue', hex: '#2F2F6B', className: 'bg-brand-blue', textClassName: 'text-white' },
    { name: 'Amarelo destaque', token: 'brand-yellow', hex: '#F0A451', className: 'bg-brand-yellow', textClassName: 'text-brand-blue' },
    { name: 'Vermelho crítico', token: 'brand-red', hex: '#AF3348', className: 'bg-brand-red', textClassName: 'text-white' },
];

function ButtonsPage() {
    return (
        <main className="mx-auto w-full max-w-5xl space-y-8 pb-10">
            <div>
                <p className="text-muted-foreground text-sm font-medium">Ações e comandos</p>
                <h1 className="text-2xl font-semibold">Botões</h1>
                <p className="text-muted-foreground mt-1 text-sm">Hierarquia, tamanhos e estados para ações da interface.</p>
            </div>

            <section aria-labelledby="palette-title">
                <SectionHeading id="palette-title" title="Cores da marca" description="Tokens principais usados nas ações e estados do produto." />
                <div className="grid gap-3 sm:grid-cols-3">
                    {colors.map((color) => (
                        <div key={color.token} className={`${color.className} ${color.textClassName} rounded-lg p-4`}>
                            <div className="font-medium">{color.name}</div>
                            <div className="mt-5 flex items-end justify-between gap-3 text-xs">
                                <span className="font-mono">{color.hex}</span>
                                <span className="opacity-75">{color.token}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Separator />

            <ShowcaseSection title="Hierarquia" description="Use uma única ação principal por contexto; reserve vermelho para ações destrutivas e amarelo para atenção.">
                <Button>Principal</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="outline">Contorno</Button>
                <Button variant="ghost">Discreto</Button>
                <Button variant="warning">Atenção</Button>
                <Button variant="destructive">Destrutivo</Button>
                <Button variant="link">Ação em texto</Button>
            </ShowcaseSection>

            <Separator />

            <ShowcaseSection title="Tamanhos" description="Escolha o tamanho pela densidade do contexto, mantendo o padrão como preferência.">
                <Button size="sm">Pequeno</Button>
                <Button>Padrão</Button>
                <Button size="lg">Grande</Button>
            </ShowcaseSection>

            <Separator />

            <ShowcaseSection title="Com ícones" description="Ícones reforçam o comando; botões sem texto precisam de nome acessível.">
                <Button><Plus />Adicionar item</Button>
                <Button variant="outline"><Download />Exportar</Button>
                <Button variant="secondary"><Mail />Enviar convite</Button>
                <Button variant="destructive"><Trash2 />Excluir</Button>
                <Button variant="outline" size="icon" aria-label="Salvar" title="Salvar"><Save /></Button>
                <Button variant="ghost" size="icon" aria-label="Confirmar" title="Confirmar"><Check /></Button>
            </ShowcaseSection>

            <Separator />

            <ShowcaseSection title="Estados" description="O estado precisa comunicar disponibilidade e andamento sem alterar as dimensões do controle.">
                <Button>Disponível</Button>
                <Button disabled>Desabilitado</Button>
                <Button disabled><LoaderCircle className="animate-spin" />Salvando</Button>
                <Button variant="outline" aria-pressed="true" className="border-primary bg-primary/10 text-primary">Selecionado</Button>
            </ShowcaseSection>

            <Separator />

            <section aria-labelledby="composition-title">
                <SectionHeading id="composition-title" title="Composição" description="Exemplo de ações alinhadas ao final de um fluxo de edição." />
                <div className="flex flex-col-reverse gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-end">
                    <Button variant="ghost">Cancelar</Button>
                    <Button variant="outline">Salvar rascunho</Button>
                    <Button>Continuar <ArrowRight /></Button>
                </div>
            </section>
        </main>
    );
}

function ShowcaseSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    const id = `section-${title.toLowerCase().replaceAll(' ', '-')}`;

    return (
        <section aria-labelledby={id}>
            <SectionHeading id={id} title={title} description={description} />
            <div className="flex flex-wrap items-center gap-3">{children}</div>
        </section>
    );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
    return (
        <div className="mb-4 max-w-2xl">
            <h2 id={id} className="text-base font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">{description}</p>
        </div>
    );
}

ButtonsPage.layout = (page: React.ReactNode) => (
    <DashboardLayout breadcrumb={[{ title: 'Design system' }, { title: 'Botões' }]}>{page}</DashboardLayout>
);

export default ButtonsPage;