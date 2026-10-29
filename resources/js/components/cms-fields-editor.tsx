import { usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { ImageField, ImageListField } from '@/components/cms-image-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDef } from '@/lib/cms-sections';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Content = Record<string, any>;


function emptyValue(field: FieldDef): unknown {
    if (field.kind === 'list' || field.kind === 'strings' || field.kind === 'images') return [];
    if (field.kind === 'number') return null;
    if (field.kind === 'boolean') return false;
    return '';
}

export function emptyItem(fields: FieldDef[]): Content {
    return Object.fromEntries(fields.map((field) => [field.key, emptyValue(field)]));
}

export function FieldsEditor({
    fields,
    value,
    onChange,
}: {
    fields: FieldDef[];
    value: Content;
    onChange: (next: Content) => void;
}) {
    const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
    const collections = (usePage().props as { collections?: { slug: string; name: string }[] }).collections ?? [];

    return (
        <div className="space-y-4">
            {fields.map((field) => {
                const current = value[field.key];

                if (field.kind === 'list') {
                    const items = Array.isArray(current) ? (current as Content[]) : [];
                    return (
                        <div key={field.key} className="space-y-3">
                            <p className="text-sm font-medium">{field.label}</p>
                            {items.map((item, index) => (
                                <div key={index} className="space-y-3 rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs font-medium">
                                            {field.itemLabel} {index + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Remover ${field.itemLabel} ${index + 1}`}
                                            onClick={() => set(field.key, items.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 />
                                        </Button>
                                    </div>
                                    <FieldsEditor
                                        fields={field.fields}
                                        value={item}
                                        onChange={(next) => set(field.key, items.map((it, i) => (i === index ? next : it)))}
                                    />
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => set(field.key, [...items, emptyItem(field.fields)])}
                            >
                                <Plus /> Adicionar {field.itemLabel.toLowerCase()}
                            </Button>
                        </div>
                    );
                }

                if (field.kind === 'collection') {
                    const selected = (current as string) ?? '';
                    return (
                        <Field key={field.key}>
                            <FieldLabel>{field.label}</FieldLabel>
                            <Select value={selected} onChange={(event) => set(field.key, event.target.value)}>
                                <option value="">Nenhuma (padrão)</option>
                                {selected && !collections.some((c) => c.slug === selected) && (
                                    <option value={selected}>{selected} (indisponível)</option>
                                )}
                                {collections.map((c) => (
                                    <option key={c.slug} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                            {field.hint && <p className="text-muted-foreground text-sm">{field.hint}</p>}
                        </Field>
                    );
                }

                if (field.kind === 'boolean') {
                    return (
                        <label key={field.key} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={Boolean(current)} onChange={(event) => set(field.key, event.target.checked)} />
                            {field.label}
                        </label>
                    );
                }

                if (field.kind === 'images') {
                    return (
                        <Field key={field.key}>
                            <FieldLabel>{field.label}</FieldLabel>
                            <ImageListField
                                value={Array.isArray(current) ? (current as string[]) : []}
                                onChange={(next) => set(field.key, next)}
                            />
                            {field.hint && <p className="text-muted-foreground text-sm">{field.hint}</p>}
                        </Field>
                    );
                }

                if (field.kind === 'image') {
                    return (
                        <Field key={field.key}>
                            <FieldLabel>{field.label}</FieldLabel>
                            <ImageField value={(current as string) ?? ''} onChange={(next) => set(field.key, next)} />
                            {field.hint && <p className="text-muted-foreground text-sm">{field.hint}</p>}
                        </Field>
                    );
                }

                if (field.kind === 'strings') {
                    const lines = Array.isArray(current) ? (current as string[]) : [];
                    return (
                        <Field key={field.key}>
                            <FieldLabel>{field.label}</FieldLabel>
                            <Textarea
                                rows={4}
                                value={lines.join('\n')}
                                onChange={(event) =>
                                    set(field.key, event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))
                                }
                            />
                            {field.hint && <p className="text-muted-foreground text-sm">{field.hint}</p>}
                        </Field>
                    );
                }

                return (
                    <Field key={field.key}>
                        <FieldLabel>{field.label}</FieldLabel>
                        {field.kind === 'textarea' ? (
                            <Textarea
                                rows={3}
                                value={(current as string) ?? ''}
                                onChange={(event) => set(field.key, event.target.value)}
                            />
                        ) : (
                            <Input
                                type={field.kind === 'number' ? 'number' : field.kind === 'datetime' ? 'datetime-local' : 'text'}
                                value={(current as string | number | null) ?? ''}
                                onChange={(event) =>
                                    set(
                                        field.key,
                                        field.kind === 'number'
                                            ? event.target.value === '' ? null : Number(event.target.value)
                                            : event.target.value,
                                    )
                                }
                            />
                        )}
                        {field.hint && <p className="text-muted-foreground text-sm">{field.hint}</p>}
                    </Field>
                );
            })}
        </div>
    );
}

