import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/admin/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api/uploads/local-product-image': {
        target: process.env.LOCAL_IMAGE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.API_PROXY_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
