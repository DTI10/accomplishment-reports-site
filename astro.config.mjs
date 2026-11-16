// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  // The list of accomplishments moved from /articles/ to /accomplishments/
  redirects: {
    '/articles': '/accomplishments/',
    '/news': '/accomplishments/'
  },

  vite: {
    plugins: [tailwindcss()]
  }
});