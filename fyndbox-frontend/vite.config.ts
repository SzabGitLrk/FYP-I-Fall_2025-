import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@fyndbox/shared'],
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
    // Enable HTTPS for camera access (optional - only if you have certificates)
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
    //   cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
    // },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
