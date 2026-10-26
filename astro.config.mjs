// @ts-check
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import tina from '@tinacms/astro/integration';
import { tinaAdminDevRedirect } from '@tinacms/astro/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://example.com',
  // Pages are rendered on request so a save in the CMS is live on refresh.
  output: 'server',
  // Middleware mode: the Express server in server/index.ts mounts Astro next to the Tina backend.
  adapter: node({ mode: 'middleware' }),
  integrations: [tina()],
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss(), tinaAdminDevRedirect()],
  },
});
