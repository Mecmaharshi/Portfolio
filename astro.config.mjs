// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://maharshiishujasraj.netlify.app',
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/contact/thanks') })],
  markdown: {
    // Both themes are emitted; global.css switches to the dark one under [data-theme="dark"]
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
