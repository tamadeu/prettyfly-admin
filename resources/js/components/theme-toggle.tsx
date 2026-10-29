import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();

    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';
    const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={label}
            title={label}
            disabled={!mounted}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
            {isDark ? <Sun /> : <Moon />}
        </Button>
    );
}