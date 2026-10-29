import React from 'react';

import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type="checkbox"
            data-slot="checkbox"
            className={cn(
                'border-input accent-primary size-4 shrink-0 rounded border shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { Checkbox };