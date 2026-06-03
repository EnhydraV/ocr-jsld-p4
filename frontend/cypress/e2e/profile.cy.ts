/// <reference types="cypress" />

const USER_INFO = {
  id: 1,
  email: 'victor@yoga.com',
  firstName: 'Victor',
  lastName: 'Pille',
  admin: false,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
};

describe('Profile', () => {
  it('displays the current user information', () => {
    cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
    cy.visitAuthed('/profile', 'user');

    cy.wait('@getUser');
    cy.contains(USER_INFO.firstName).should('be.visible');
    cy.contains(USER_INFO.lastName).should('be.visible');
    cy.contains(USER_INFO.email).should('be.visible');
    cy.contains('User').should('be.visible');
  });

  it('displays an error when the profile cannot be loaded', () => {
    cy.intercept('GET', '/api/user/1', { statusCode: 500, body: {} }).as('getUser');
    cy.visitAuthed('/profile', 'user');
    cy.wait('@getUser');
    cy.contains('Failed to load user information').should('be.visible');
  });

  it('navigates back to the sessions list', () => {
    cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
    cy.intercept('GET', '/api/session', { body: [] });
    cy.visitAuthed('/profile', 'user');
    cy.wait('@getUser');
    cy.contains('button', 'Back to Sessions').click();
    cy.url().should('match', /\/sessions$/);
  });

  describe('Promote to admin (dev mode)', () => {
    it('promotes the user to administrator', () => {
      cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
      cy.intercept('POST', '/api/user/promote-admin', {
        statusCode: 200,
        body: { ...USER_INFO, admin: true },
      }).as('promote');
      cy.visitAuthed('/profile', 'user');
      cy.wait('@getUser');

      cy.contains('button', 'Promote to Admin').click();
      cy.wait('@promote');
      cy.contains('Administrator').should('be.visible');
    });

    it('shows an error when promotion fails', () => {
      cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
      cy.intercept('POST', '/api/user/promote-admin', {
        statusCode: 500,
        body: { message: 'Promotion refused' },
      }).as('promote');
      cy.visitAuthed('/profile', 'user');
      cy.wait('@getUser');

      cy.contains('button', 'Promote to Admin').click();
      cy.wait('@promote');
      cy.contains('Promotion refused').should('be.visible');
    });
  });

  describe('Delete account', () => {
    it('deletes the account after confirmation and redirects to login', () => {
      cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
      cy.intercept('DELETE', '/api/user/1', { statusCode: 200, body: {} }).as('deleteUser');
      cy.visitAuthed('/profile', 'user');
      cy.wait('@getUser');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete Account').click();
      cy.wait('@deleteUser');
      cy.url().should('include', '/login');
      cy.window().its('localStorage.token').should('be.undefined');
    });

    it('does not delete when the confirmation is dismissed', () => {
      cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
      cy.intercept('DELETE', '/api/user/1', { statusCode: 200, body: {} }).as('deleteUser');
      cy.visitAuthed('/profile', 'user');
      cy.wait('@getUser');

      cy.on('window:confirm', () => false);
      cy.contains('button', 'Delete Account').click();
      cy.get('@deleteUser.all').should('have.length', 0);
    });

    it('shows an error when deletion fails', () => {
      cy.intercept('GET', '/api/user/1', { body: USER_INFO }).as('getUser');
      cy.intercept('DELETE', '/api/user/1', {
        statusCode: 500,
        body: { message: 'Cannot delete account' },
      }).as('deleteUser');
      cy.visitAuthed('/profile', 'user');
      cy.wait('@getUser');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete Account').click();
      cy.wait('@deleteUser');
      cy.contains('Cannot delete account').should('be.visible');
    });
  });
});
