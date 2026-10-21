import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '/home/mcosand/gurl-public-build',
    emptyOutDir: true,
    rollupOptions: {
      input: 'public-home/index.html',
    },
  },
});
