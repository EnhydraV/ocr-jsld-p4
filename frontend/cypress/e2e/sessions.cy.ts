/// <reference types="cypress" />

describe('Sessions list', () => {
  it('renders the sessions for a regular user without admin actions', () => {
    cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('getSessions');
    cy.visitAuthed('/sessions', 'user');

    cy.wait('@getSessions');
    cy.contains('Yoga du matin').should('be.visible');
    cy.contains('Détente du soir').should('be.visible');
    cy.contains('Teacher: Charlie Zterone').should('be.visible');
    cy.contains('Participants: 2').should('be.visible');

    cy.contains('a', 'View Details').should('exist');
    cy.contains('button', 'Delete').should('not.exist');
    // Le lien "Create Session" (navbar + page) est réservé aux admins
    cy.contains('Create Session').should('not.exist');
  });

  it('shows admin actions for an admin user', () => {
    cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('getSessions');
    cy.visitAuthed('/sessions', 'admin');

    cy.wait('@getSessions');
    cy.contains('a', 'Create Session').should('be.visible');
    cy.contains('button', 'Delete').should('exist');
  });

  it('displays the empty state when there are no sessions', () => {
    cy.intercept('GET', '/api/session', { body: [] }).as('getSessions');
    cy.visitAuthed('/sessions', 'user');

    cy.wait('@getSessions');
    cy.contains('No sessions available').should('be.visible');
  });

  it('displays an error when loading fails', () => {
    cy.intercept('GET', '/api/session', { statusCode: 500, body: {} }).as('getSessions');
    cy.visitAuthed('/sessions', 'user');

    cy.wait('@getSessions');
    cy.contains('Failed to load sessions').should('be.visible');
  });

  describe('Delete a session (admin)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/session', { fixture: 'sessions.json' }).as('getSessions');
    });

    it('deletes a session after confirmation', () => {
      cy.intercept('DELETE', '/api/session/10', { statusCode: 200, body: {} }).as('deleteSession');
      cy.visitAuthed('/sessions', 'admin');
      cy.wait('@getSessions');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete').first().click();
      cy.wait('@deleteSession');
      // Re-fetch de la liste après suppression
      cy.get('@getSessions.all').should('have.length.at.least', 2);
    });

    it('does not delete when the confirmation is dismissed', () => {
      cy.intercept('DELETE', '/api/session/10', { statusCode: 200, body: {} }).as('deleteSession');
      cy.visitAuthed('/sessions', 'admin');
      cy.wait('@getSessions');

      cy.on('window:confirm', () => false);
      cy.contains('button', 'Delete').first().click();
      // Aucune requête de suppression ne doit partir
      cy.get('@deleteSession.all').should('have.length', 0);
    });

    it('shows an error when deletion fails', () => {
      cy.intercept('DELETE', '/api/session/10', {
        statusCode: 500,
        body: { message: 'Cannot delete session' },
      }).as('deleteSession');
      cy.visitAuthed('/sessions', 'admin');
      cy.wait('@getSessions');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete').first().click();
      cy.wait('@deleteSession');
      cy.contains('Cannot delete session').should('be.visible');
    });
  });
});
