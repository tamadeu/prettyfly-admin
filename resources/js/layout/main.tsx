import React from 'react';
import { useApplicationAppearance } from '@/hooks/use-application-appearance';

export default function Layout({ children }: { children: React.ReactNode }) {
    useApplicationAppearance();

    return <main>{children}</main>;
}
