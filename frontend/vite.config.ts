import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import istanbul from 'vite-plugin-istanbul';

// Instrumentation de couverture activée uniquement via VITE_COVERAGE=true
// (pour les tests e2e Cypress), sinon le dev/build reste intact.
const withCoverage = process.env.VITE_COVERAGE === 'true';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(withCoverage
      ? [
          istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'src/test', 'src/**/*.test.{ts,tsx}'],
            extension: ['.ts', '.tsx'],
            requireEnv: false,
          }),
        ]
      : []),
  ],
  test: {
    environment: 'jsdom',
    // Origine non-opaque obligatoire pour que jsdom expose le Web Storage
    // (localStorage). Sans URL, l'accès lève une SecurityError.
    environmentOptions: {
      jsdom: { url: 'http://localhost:3000/' },
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
