import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        // L'intégration (vraie base, Docker) a sa propre config : vitest.integration.config.ts
        exclude: ['tests/integration/**', '**/node_modules/**'],
        globals: true,
        environment: 'node',
        isolate: true,
    },
});