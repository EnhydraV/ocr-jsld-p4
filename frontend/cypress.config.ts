import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    setupNodeEvents(on, config) {
      // Collecte de couverture (@cypress/code-coverage)
      codeCoverageTask(on, config);
      return config;
    },
  },
});
