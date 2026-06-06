import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'tests/e2e/**/*.cy.ts',
    supportFile: 'tests/e2e/support/e2e.ts',
    fixturesFolder: 'tests/e2e/fixtures',
    video: false,
    setupNodeEvents(on, config) {
      // Collecte de couverture (@cypress/code-coverage)
      codeCoverageTask(on, config);
      return config;
    },
  },
});
