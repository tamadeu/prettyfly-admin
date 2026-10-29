import { router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const searchItems = [
    { title: 'Dashboard de vendas', category: 'Página', href: '/', keywords: 'início métricas receita pedidos' },
    { title: 'Botões', category: 'Design system', href: '/design-system/buttons', keywords: 'botão ações variantes tamanhos' },
    { title: 'Gráficos', category: 'Design system', href: '/design-system/charts', keywords: 'gráfico dados barras linhas indicadores' },
    { title: 'Modais e painéis', category: 'Design system', href: '/design-system/modals', keywords: 'modal painel dialog offcanvas sheet' },
    { title: 'Detalhes de registro', category: 'Design system', href: '/design-system/record-details', keywords: 'crm contato overview' },
    { title: 'Tabelas', category: 'Design system', href: '/design-system/tables', keywords: 'listagem filtro faturas' },
    { title: 'Formulários', category: 'Design system', href: '/design-system/forms', keywords: 'campos configurações inputs' },
    { title: 'Telescope', category: 'Ferramenta', href: '/telescope', keywords: 'debug logs requests queries' },
];

function normalizeText(value: string) {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('pt-BR');
}

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const normalizedQuery = normalizeText(query.trim());
    const results = normalizedQuery
        ? searchItems.filter((item) => normalizeText(`${item.title} ${item.category} ${item.keywords}`).includes(normalizedQuery)).slice(0, 6)
        : searchItems.slice(0, 6);

    function navigate(href: string) {
        setOpen(false);
        setQuery('');

        if (href === '/telescope') {
            window.location.assign(href);
            return;
        }

        router.visit(href);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (results[0]) {
            navigate(results[0].href);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
                setQuery('');
            }
        }}>
            <DialogTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground flex h-10 w-full items-center gap-3 rounded-md bg-muted/70 px-3 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <Search className="size-4 shrink-0" />
                    <span className="truncate">Pesquisar páginas, registros e ferramentas...</span>
                </button>
            </DialogTrigger>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Pesquisa global</DialogTitle>
                    <DialogDescription>Pesquise páginas, registros e ferramentas disponíveis na aplicação.</DialogDescription>
                </DialogHeader>
                <form role="search" className="relative border-b" onSubmit={submit}>
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                    <Input
                        autoFocus
                        type="search"
                        aria-label="Pesquisa global"
                        aria-controls="global-search-results"
                        autoComplete="off"
                        className="h-14 rounded-none border-0 pr-20 pl-12 text-base shadow-none focus-visible:ring-0"
                        placeholder="Digite para pesquisar..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    {query && (
                        <button type="button" aria-label="Limpar pesquisa" className="text-muted-foreground hover:text-foreground absolute top-1/2 right-11 flex size-7 -translate-y-1/2 items-center justify-center rounded-md" onClick={() => setQuery('')}>
                            <X className="size-4" />
                        </button>
                    )}
                </form>

                <div id="global-search-results" className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
                    <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{normalizedQuery ? 'Resultados' : 'Acesso rápido'}</p>
                    {results.length > 0 ? results.map((item) => (
                        <button key={item.href} type="button" className="hover:bg-accent focus:bg-accent flex w-full items-center justify-between gap-4 rounded-sm px-3 py-2.5 text-left outline-none" onClick={() => navigate(item.href)}>
                            <span className="text-sm font-medium">{item.title}</span>
                            <span className="text-muted-foreground text-xs">{item.category}</span>
                        </button>
                    )) : (
                        <p className="text-muted-foreground px-4 py-8 text-center text-sm">Nenhum resultado encontrado.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}