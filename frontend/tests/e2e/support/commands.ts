/// <reference types="cypress" />

// Faux utilisateurs réutilisés pour authentifier sans passer par le formulaire
const USERS = {
  user: {
    id: 1,
    email: 'victor@yoga.com',
    firstName: 'Victor',
    lastName: 'Pille',
    admin: false,
    token: 'tok-123456789',
  },
  admin: {
    id: 2,
    email: 'juliette@yoga.com',
    firstName: 'Juliette',
    lastName: 'Michel',
    admin: true,
    token: 'tok-123456789',
  },
} as const;

export type SeedRole = keyof typeof USERS;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /**
       * Visite une page en injectant un utilisateur authentifié dans le
       * localStorage AVANT le chargement de l'app (sinon useAuth lit du vide).
       */
      visitAuthed(path: string, role?: SeedRole): Chainable<void>;
    }
  }
}

Cypress.Commands.add('visitAuthed', (path: string, role: SeedRole = 'user') => {
  const account = USERS[role];
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', account.token);
      win.localStorage.setItem('user', JSON.stringify(account));
    },
  });
});

export {};
