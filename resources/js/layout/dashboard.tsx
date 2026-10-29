import React from 'react';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Toaster } from '@/components/ui/sonner';
import { GlobalSearch } from '@/components/global-search';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationPanel } from '@/components/notification-panel';
import { useApplicationAppearance } from '@/hooks/use-application-appearance';

interface BreadcrumbItem {
    title: string;
    href?: string;
}

export default function DashboardLayout({
    children,
    breadcrumb,
}: {
    children: React.ReactNode;
    breadcrumb: BreadcrumbItem[];
}) {
    useApplicationAppearance();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="bg-background/95 sticky top-0 z-40 shrink-0 border-b backdrop-blur">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 md:h-16 md:grid-cols-[minmax(0,1fr)_minmax(16rem,30rem)_minmax(0,1fr)] md:gap-4 md:px-4 md:py-0">
                    <div className="col-span-2 flex min-w-0 items-center gap-2 md:col-span-1">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumb.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <BreadcrumbItem
                                            className={
                                                index === 0
                                                    ? 'hidden md:block'
                                                    : ''
                                            }
                                        >
                                            {item.href ? (
                                                <BreadcrumbLink
                                                    href={item.href}
                                                >
                                                    {item.title}
                                                </BreadcrumbLink>
                                            ) : (
                                                <BreadcrumbPage>
                                                    {item.title}
                                                </BreadcrumbPage>
                                            )}
                                        </BreadcrumbItem>
                                        {index < breadcrumb.length - 1 && (
                                            <BreadcrumbSeparator
                                                className={
                                                    index === 0
                                                        ? 'hidden md:block'
                                                        : ''
                                                }
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <GlobalSearch />
                    <div className="flex items-center gap-2 justify-self-end">
                        <NotificationPanel />
                        <ThemeToggle />
                    </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
