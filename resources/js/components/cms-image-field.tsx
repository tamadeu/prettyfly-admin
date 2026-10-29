import axios from 'axios';
import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useRoute } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_SIZE = 5 * 1024 * 1024;

function useImageUpload() {
    const route = useRoute();
    const [uploading, setUploading] = useState(false);

    async function upload(file: File): Promise<string | null> {
        if (file.size > MAX_SIZE) {
            toast.error('A imagem deve ter no máximo 5 MB.');
            return null;
        }

        const body = new FormData();
        body.append('image', file);
        setUploading(true);

        try {
            const { data } = await axios.post<{ url: string }>(route('cms.images.store'), body);
            return data.url;
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? (error.response?.data?.errors?.image?.[0] ?? error.response?.data?.message)
                : null;
            toast.error(message ?? 'Não foi possível enviar a imagem.');
            return null;
        } finally {
            setUploading(false);
        }
    }

    return { upload, uploading };
}

// Relative paths (e.g. /active-wear/...) belong to the storefront, so they have no preview here.
const isPreviewable = (src: string) => /^https?:\/\//.test(src);

export function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const { upload, uploading } = useImageUpload();

    async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const url = await upload(file);
        if (url) onChange(url);
    }

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-3">
                <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                    {value && isPreviewable(value) ? (
                        <img src={value} alt="" className="size-full object-cover" />
                    ) : (
                        <ImagePlus className="text-muted-foreground size-6" />
                    )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <Input
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        placeholder="Envie uma imagem ou cole um endereço"
                    />
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
                            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                            {uploading ? 'Enviando...' : value ? 'Trocar imagem' : 'Enviar imagem'}
                        </Button>
                        {value && (
                            <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange('')}>
                                <Trash2 /> Remover
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico" className="hidden" onChange={handleFile} />
        </div>
    );
}

export function ImageListField({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const { upload, uploading } = useImageUpload();

    async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';

        const urls: string[] = [];
        for (const file of files) {
            const url = await upload(file);
            if (url) urls.push(url);
        }
        if (urls.length) onChange([...value, ...urls]);
    }

    return (
        <div className="space-y-3">
            {value.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {value.map((src, index) => (
                        <div key={`${src}-${index}`} className="group bg-muted relative aspect-square overflow-hidden rounded-md border">
                            {isPreviewable(src) ? (
                                <img src={src} alt="" className="size-full object-cover" />
                            ) : (
                                <div className="text-muted-foreground flex size-full items-center justify-center p-1 text-center text-[10px] break-all">
                                    {src}
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute top-1 right-1 size-7"
                                aria-label={`Remover imagem ${index + 1}`}
                                onClick={() => onChange(value.filter((_, i) => i !== index))}
                            >
                                <Trash2 />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                {uploading ? 'Enviando...' : 'Enviar imagens'}
            </Button>
            <input
                ref={input}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico"
                className="hidden"
                onChange={handleFiles}
            />
        </div>
    );
}
