import React from 'react';
import { ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/utils';

function ChartContainer({ className, children, ...props }: React.ComponentProps<'div'> & { children: React.ReactElement }) {
    return (
        <div data-slot="chart" className={cn('h-64 min-w-0', className)} {...props}>
            <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
    );
}

const chartTooltipStyle = {
    border: '1px solid var(--border)',
    borderRadius: '6px',
    background: 'var(--popover)',
    color: 'var(--popover-foreground)',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
    fontSize: '12px',
};

export { ChartContainer, chartTooltipStyle };