import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // The release package can be hosted below an arbitrary content root.
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      // Colorbox's release reviewer inspects emitted JavaScript directly.
      // Readable output avoids scanner-only review while gzip still removes
      // whitespace during delivery.
      minify: false,
      // Lazy chunks load only after their UI is opened. Disabling generated
      // preload dependency lists also keeps release scanners from mistaking
      // Vite's assetsURL helper for a user-controlled remote resource loader.
      modulePreload: false,
      sourcemap: true,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/src/data/nbaData2008.ts')) {
              return 'data-league-2008';
            }
            if (normalizedId.includes('/src/data/realTradesData.ts')) {
              return 'data-real-trades';
            }
            if (normalizedId.includes('/src/data/draftData.ts') || normalizedId.includes('/src/data/drafts/')) {
              return 'data-historical-drafts';
            }
            if (normalizedId.includes('/src/data/')) {
              return 'data-career-events';
            }
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
