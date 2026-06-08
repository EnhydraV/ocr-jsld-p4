import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/integration/**/*.test.ts'],
        globals: true,
        environment: 'node',
        globalSetup: ['tests/integration/global-setup.ts'],
    },
});
