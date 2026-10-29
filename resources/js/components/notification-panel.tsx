import {
    Bell,
    Check,
    CheckCircle2,
    ListChecks,
    MessageSquare,
    ShieldCheck,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

type NotificationFilter = 'all' | 'unread';
type NotificationIcon = typeof CheckCircle2;

const initialNotifications: Array<{
    id: number;
    title: string;
    description: string;
    time: string;
    category: string;
    icon: NotificationIcon;
    unread: boolean;
}> = [
    { id: 1, title: 'Nova aprovação pendente', description: 'A proposta comercial de AFP Supply precisa da sua aprovação.', time: 'há 12 minutos', category: 'Aprovação', icon: CheckCircle2, unread: true },
    { id: 2, title: 'Emma mencionou você', description: 'Um comentário foi adicionado ao projeto Expansão de licenças.', time: 'há 47 minutos', category: 'Comentário', icon: MessageSquare, unread: true },
    { id: 3, title: 'Relatório processado', description: 'O relatório mensal de vendas está pronto para download.', time: 'há 1 hora', category: 'Sistema', icon: ListChecks, unread: false },
    { id: 4, title: 'Alerta de segurança', description: 'Um novo acesso à conta foi identificado no Chrome para Windows.', time: 'há 3 horas', category: 'Segurança', icon: ShieldCheck, unread: true },
    { id: 5, title: 'Oportunidade atualizada', description: 'A negociação Renovação anual avançou para a etapa Proposta.', time: 'ontem', category: 'CRM', icon: CheckCircle2, unread: false },
];

export function NotificationPanel() {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const unreadCount = notifications.filter((notification) => notification.unread).length;
    const visibleNotifications = filter === 'unread'
        ? notifications.filter((notification) => notification.unread)
        : notifications;

    function markAsRead(id: number) {
        setNotifications((current) => current.map((notification) =>
            notification.id === id ? { ...notification, unread: false } : notification,
        ));
    }

    function markAllAsRead() {
        setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative" aria-label={`Abrir notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`} title="Notificações">
                    <Bell />
                    {unreadCount > 0 && (
                        <span className="bg-brand-red absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold text-white">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
                <SheetHeader className="border-b px-6 py-5 pr-14">
                    <SheetTitle className="flex items-center gap-2"><Bell className="size-4" />Notificações</SheetTitle>
                    <SheetDescription>{unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Tudo em dia'}</SheetDescription>
                </SheetHeader>

                <div className="flex items-center border-b px-4">
                    <button type="button" className={`relative flex-1 px-3 py-3 text-sm font-medium ${filter === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setFilter('all')}>
                        Todas
                        {filter === 'all' && <span className="bg-primary absolute right-3 bottom-0 left-3 h-0.5" />}
                    </button>
                    <button type="button" className={`relative flex-1 px-3 py-3 text-sm font-medium ${filter === 'unread' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => setFilter('unread')}>
                        Não lidas
                        {filter === 'unread' && <span className="bg-primary absolute right-3 bottom-0 left-3 h-0.5" />}
                    </button>
                </div>

                {unreadCount > 0 && (
                    <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-5 py-2.5">
                        <span className="text-muted-foreground text-xs">Atualizações recentes</span>
                        <button type="button" className="text-primary flex items-center gap-1 text-xs font-medium hover:underline" onClick={markAllAsRead}>
                            <Check className="size-3.5" />Marcar todas como lidas
                        </button>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {visibleNotifications.length > 0 ? (
                        <div>
                            <div className="text-muted-foreground bg-muted/30 px-5 py-2 text-xs font-medium uppercase">Recentes</div>
                            {visibleNotifications.map((notification, index) => (
                                <React.Fragment key={notification.id}>
                                    <button type="button" className={`hover:bg-muted/50 flex w-full gap-3 px-5 py-4 text-left transition-colors ${notification.unread ? 'bg-primary/5' : ''}`} onClick={() => markAsRead(notification.id)}>
                                        <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
                                            <notification.icon className="size-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-3">
                                                <span className="text-sm font-medium">{notification.title}</span>
                                                <span className="text-muted-foreground shrink-0 text-xs">{notification.time}</span>
                                            </span>
                                            <span className="text-muted-foreground mt-1 block text-sm leading-5">{notification.description}</span>
                                            <span className="mt-2 flex items-center gap-2">
                                                <span className="bg-secondary text-secondary-foreground rounded-sm px-1.5 py-0.5 text-[11px] font-medium">{notification.category}</span>
                                                {notification.unread && <span className="bg-primary size-2 rounded-full" aria-label="Não lida" />}
                                            </span>
                                        </span>
                                    </button>
                                    {index < visibleNotifications.length - 1 && <Separator />}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
                            <span className="bg-muted flex size-12 items-center justify-center rounded-full"><Check className="text-muted-foreground size-5" /></span>
                            <p className="mt-4 text-sm font-medium">Tudo em dia</p>
                            <p className="text-muted-foreground mt-1 text-sm">Você não possui notificações não lidas.</p>
                        </div>
                    )}
                </div>

                <SheetFooter className="border-t p-3">
                    <Button variant="outline" className="w-full"><ListChecks />Ver todas as notificações</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}