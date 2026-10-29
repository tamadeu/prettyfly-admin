import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export interface Link {
    label: string;
    href: string;
    comingSoon?: boolean;
}

export function StringList({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
    return (
        <div className="space-y-2">
            {values.map((value, i) => (
                <div key={i} className="flex gap-2">
                    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(values.map((v, k) => (k === i ? e.target.value : v)))} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => onChange(values.filter((_, k) => k !== i))}>
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ''])}>
                <Plus className="size-4" /> Adicionar
            </Button>
        </div>
    );
}

export function LinkRows({ links, onChange, withSoon }: { links: Link[]; onChange: (l: Link[]) => void; withSoon?: boolean }) {
    const set = (i: number, patch: Partial<Link>) => onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    return (
        <div className="space-y-2">
            {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input placeholder="Rótulo" value={link.label} onChange={(e) => set(i, { label: e.target.value })} />
                    <Input placeholder="/caminho" value={link.href} onChange={(e) => set(i, { href: e.target.value })} />
                    {withSoon && (
                        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <Checkbox checked={Boolean(link.comingSoon)} onChange={(e) => set(i, { comingSoon: e.target.checked })} />
                            Em breve
                        </label>
                    )}
                    <Button type="button" variant="ghost" size="icon" onClick={() => onChange(links.filter((_, idx) => idx !== i))}>
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...links, { label: '', href: '/' }])}>
                <Plus className="size-4" /> Adicionar link
            </Button>
        </div>
    );
}

