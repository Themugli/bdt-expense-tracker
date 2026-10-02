import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

const isCI = process.env.CI === 'true';
const isProd = process.env.NODE_ENV === 'production';

// PORT is optional — default to 5173 for local dev
const port = Number(process.env.PORT) || 5173;

// For GitHub Pages use the repo subpath; otherwise use BASE_PATH or '/'
const base = isProd ? '/bdt-expense-tracker/' : (process.env.BASE_PATH || '/');

// Only load Replit-specific plugins when running inside Replit
async function getReplitPlugins(): Promise<PluginOption[]> {
  if (isCI || isProd || !process.env.REPL_ID) return [];

  const [errorModal, cartographer, devBanner] = await Promise.all([
    import('@replit/vite-plugin-runtime-error-modal'),
    import('@replit/vite-plugin-cartographer'),
    import('@replit/vite-plugin-dev-banner'),
  ]);

  return [
    errorModal.default(),
    cartographer.cartographer({
      root: path.resolve(import.meta.dirname, '..'),
    }),
    devBanner.devBanner(),
  ];
}

export default defineConfig(async () => ({
  base,
  plugins: [
    react(),
    tailwindcss(),
    ...(await getReplitPlugins()),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
}));
