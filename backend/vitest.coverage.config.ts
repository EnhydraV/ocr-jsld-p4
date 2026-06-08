import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        exclude: ['**/node_modules/**'],
        globals: true,
        environment: 'node',
        globalSetup: ['tests/integration/global-setup.ts'],
        fileParallelism: false,
        isolate: true,
        testTimeout: 30_000,
        hookTimeout: 120_000,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: [
                'src/app.ts',        // point d'entrée (listen) — testé via createTestApp
                'src/**/*.d.ts',
            ],
            reporter: ['text', 'json-summary', 'html'],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
    },
});
