import { cloudflare } from '@cloudflare/vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      // Cloudflare Workers deploy target (static assets + worker).
      // The SSR environment must be named 'ssr' for TanStack Start.
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tanstackStart({
        spa: {
          enabled: true,
        },
        srcDirectory: 'src',
      }),
      // react's vite plugin must come after start's vite plugin
      viteReact(),
    ],
  };
});
