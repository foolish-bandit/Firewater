import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');

  // Generate a build hash for service worker cache versioning
  const buildHash = crypto.randomBytes(8).toString('hex');

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Inject build hash into service worker at build time
      {
        name: 'sw-build-hash',
        writeBundle() {
          const swPath = path.resolve(__dirname, 'dist/sw.js');
          if (fs.existsSync(swPath)) {
            const content = fs.readFileSync(swPath, 'utf-8');
            fs.writeFileSync(swPath, content.replace('__BUILD_HASH__', buildHash));
          }
        },
      },
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-motion': ['motion'],
            'vendor-icons': ['lucide-react'],
            'bourbon-data': [
              './src/data/bourbons_vol1',
              './src/data/bourbons_vol2',
              './src/data/bourbons_vol3',
              './src/data/bourbons_vol4',
              './src/data/bourbons_vol5',
              './src/data/bourbons_vol6',
              './src/data/bourbons_vol7',
              './src/data/bourbons_vol8',
              './src/data/bourbons_vol9',
              './src/data/bourbons_vol10',
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
