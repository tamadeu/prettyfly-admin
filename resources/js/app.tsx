import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import Layout from './layout/main';
import axios from 'axios';
import { ImportedModule } from '@/types/global';
import { ThemeProvider } from 'next-themes';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import.meta.glob(['../images/**']);

createInertiaApp({
    resolve: async (name) => {
        const pages = import.meta.glob<ImportedModule>('./pages/**/*.tsx');
        const resolvePage = pages[`./pages/${name}.tsx`];

        if (!resolvePage) {
            throw new Error(`Page not found: ${name}`);
        }

        const page = await resolvePage();
        page.default.layout =
            page.default.layout ||
            ((page: React.ReactNode) => <Layout>{page}</Layout>);

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <App {...props} />
            </ThemeProvider>,
        );
    },
}).then(() => {});
