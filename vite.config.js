import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public', // Explicitly set the public directory
  build: {
    outDir: 'dist',
  },
});
