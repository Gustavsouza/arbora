/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Bibliotecas em pacotes próprios (cache do navegador entre versões); os gráficos só são baixados em Relatórios.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\/](recharts|d3-[^\/]+|victory-vendor|decimal\.js-light|es-toolkit|immer|reselect|@reduxjs|react-redux|redux)[\/]/.test(id)) return 'graficos';
          if (/[\/](react|react-dom|scheduler|react-router)[\/]/.test(id)) return 'react';
          if (/[\/](zod|react-hook-form|@hookform)[\/]/.test(id)) return 'formularios';
          if (/[\/](radix-ui|@radix-ui|sonner)[\/]/.test(id)) return 'ui';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'supabase/tests/**/*.test.ts'],
    // Cada arquivo de banco cria um Postgres (PGlite) com a migration inteira.
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
