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
      // Keep the release as one JavaScript resource. Embedded WebViews can stay
      // open across a deployment; a single entry prevents an old page from
      // requesting hashed dependency chunks that the new release no longer has.
      modulePreload: false,
      sourcemap: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
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
