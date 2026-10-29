'use client';

import {
    GalleryVerticalEnd,
    LayoutDashboard,
    Globe,
    Package,
    Settings,
    SquareTerminal,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarRail,
} from '@/components/ui/sidebar';
import React from 'react';
import { usePage } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';
import { useLang } from '@/hooks/useLang';

interface SharedProps extends Record<string, unknown> {
    appName: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { props: _props } = usePage<SharedProps>();
    const { url } = usePage();
    const route = useRoute();
    const { __ } = useLang();

    const data = {
        navMain: [
            {
                title: __('sidebar.mainNav.items.dashboard'),
                url: route('dashboard.index'),
                icon: LayoutDashboard,
                isActive: url === '/',
            },
            {
                title: 'Catálogo',
                url: '#',
                icon: Package,
                isActive:
                    url.startsWith('/produtos') ||
                    url.startsWith('/colecoes') ||
                    url.startsWith('/categorias') ||
                    url.startsWith('/marcas'),
                items: [
                    {
                        title: 'Produtos',
                        url: route('produtos.index'),
                        isActive: url.startsWith('/produtos'),
                    },
                    {
                        title: 'Coleções',
                        url: route('colecoes.index'),
                        isActive: url.startsWith('/colecoes'),
                    },
                    {
                        title: 'Marcas',
                        url: route('marcas.index'),
                        isActive: url.startsWith('/marcas'),
                    },
                    {
                        title: 'Categorias',
                        url: route('categorias.index'),
                        isActive: url.startsWith('/categorias'),
                    },
                ],
            },
            {
                title: 'Site',
                url: '#',
                icon: Globe,
                isActive: url.startsWith('/site-geral') || url.startsWith('/cms') || url.startsWith('/cabecalho') || url.startsWith('/rodape'),
                items: [
                    {
                        title: 'Geral',
                        url: route('site.edit'),
                        isActive: url.startsWith('/site-geral'),
                    },
                    {
                        title: 'CMS',
                        url: route('cms.index'),
                        isActive: url.startsWith('/cms'),
                    },
                    {
                        title: 'Cabeçalho',
                        url: route('header.edit'),
                        isActive: url.startsWith('/cabecalho'),
                    },
                    {
                        title: 'Rodapé',
                        url: route('footer.edit'),
                        isActive: url.startsWith('/rodape'),
                    },
                ],
            },
            {
                title: 'Configurações',
                url: route('settings.application.edit'),
                icon: Settings,
                isActive: url.startsWith('/configuracoes'),
            },
            {
                title: 'Design system',
                url: '#',
                icon: SquareTerminal,
                isActive: url.startsWith('/design-system'),
                items: [
                    {
                        title: 'Botões',
                        url: route('design-system.buttons'),
                        isActive: url.startsWith('/design-system/buttons'),
                    },
                    {
                        title: 'Gráficos',
                        url: route('design-system.charts'),
                        isActive: url.startsWith('/design-system/charts'),
                    },
                    {
                        title: 'Modais e painéis',
                        url: route('design-system.modals'),
                        isActive: url.startsWith('/design-system/modals'),
                    },
                    {
                        title: 'Detalhes de registro',
                        url: route('design-system.record-details'),
                        isActive: url.startsWith('/design-system/record-details'),
                    },
                    {
                        title: 'Tabelas',
                        url: route('design-system.tables'),
                        isActive: url.startsWith('/design-system/tables'),
                    },
                    {
                        title: 'Formulários',
                        url: route('design-system.forms'),
                        isActive: url.startsWith('/design-system/forms'),
                    },
                ],
            },
        ],
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        <GalleryVerticalEnd className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                            {_props.appName}
                        </span>
                    </div>
                </SidebarMenuButton>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
