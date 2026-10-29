import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface ApplicationSettings extends Record<string, unknown> {
    application_name: string;
    primary_color: string;
    secondary_color: string;
    tertiary_color: string;
}

export function useApplicationAppearance() {
    const { applicationSettings } = usePage<{
        applicationSettings: ApplicationSettings;
    }>().props;

    useEffect(() => {
        const root = document.documentElement;

        root.style.setProperty('--brand-blue', applicationSettings.primary_color);
        root.style.setProperty('--brand-yellow', applicationSettings.secondary_color);
        root.style.setProperty('--brand-red', applicationSettings.tertiary_color);
        document.title = applicationSettings.application_name;
    }, [applicationSettings]);
}