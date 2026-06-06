/// <reference types="cypress" />

describe('Session detail', () => {
  it('displays an error when the session cannot be loaded', () => {
    cy.intercept('GET', '/api/session/10', { statusCode: 500, body: {} }).as('getSession');
    cy.visitAuthed('/sessions/10', 'user');
    cy.wait('@getSession');
    cy.contains('Failed to load session details').should('be.visible');
  });

  describe('As a regular user', () => {
    it('shows session details and a Join button when not participating', () => {
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
      cy.visitAuthed('/sessions/10', 'user');

      cy.wait('@getSession');
      cy.contains('h1', 'Yoga du matin').should('be.visible');
      cy.contains('Charlie Zterone').should('be.visible');
      cy.contains('button', 'Join Session').should('be.visible');
      cy.contains('button', 'Edit').should('not.exist');
    });

    it('joins a session', () => {
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
      cy.intercept('POST', '/api/session/10/participate/1', { statusCode: 200, body: {} }).as('participate');
      cy.visitAuthed('/sessions/10', 'user');
      cy.wait('@getSession');

      cy.contains('button', 'Join Session').click();
      cy.wait('@participate');
      cy.get('@getSession.all').should('have.length.at.least', 2);
    });

    it('shows an error when joining fails', () => {
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
      cy.intercept('POST', '/api/session/10/participate/1', {
        statusCode: 500,
        body: { message: 'Already full' },
      }).as('participate');
      cy.visitAuthed('/sessions/10', 'user');
      cy.wait('@getSession');

      cy.contains('button', 'Join Session').click();
      cy.wait('@participate');
      cy.contains('Already full').should('be.visible');
    });

    it('leaves a session when already participating', () => {
      cy.intercept('GET', '/api/session/10', {
        body: {
          id: 10,
          name: 'Yoga du matin',
          date: '2026-06-15T09:00:00.000Z',
          description: 'Un flow dynamique pour bien démarrer la journée.',
          teacher: { id: 3, firstName: 'Charlie', lastName: 'Zterone' },
          users: [1],
        },
      }).as('getSession');
      cy.intercept('DELETE', '/api/session/10/participate/1', { statusCode: 200, body: {} }).as('unparticipate');
      cy.visitAuthed('/sessions/10', 'user');
      cy.wait('@getSession');

      cy.contains('button', 'Leave Session').click();
      cy.wait('@unparticipate');
    });

    it('navigates back to the sessions list', () => {
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
      cy.intercept('GET', '/api/session', { body: [] });
      cy.visitAuthed('/sessions/10', 'user');
      cy.wait('@getSession');

      cy.contains('button', 'Back to Sessions').click();
      cy.url().should('match', /\/sessions$/);
    });
  });

  describe('As an admin', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
    });

    it('shows Edit and Delete buttons', () => {
      cy.visitAuthed('/sessions/10', 'admin');
      cy.wait('@getSession');
      cy.contains('button', 'Edit').should('be.visible');
      cy.contains('button', 'Delete').should('be.visible');
      cy.contains('button', 'Join Session').should('not.exist');
    });

    it('navigates to the edit form', () => {
      cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' });
      cy.visitAuthed('/sessions/10', 'admin');
      cy.wait('@getSession');
      cy.contains('button', 'Edit').click();
      cy.url().should('include', '/sessions/edit/10');
    });

    it('deletes a session after confirmation', () => {
      cy.intercept('DELETE', '/api/session/10', { statusCode: 200, body: {} }).as('deleteSession');
      cy.intercept('GET', '/api/session', { body: [] });
      cy.visitAuthed('/sessions/10', 'admin');
      cy.wait('@getSession');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete').click();
      cy.wait('@deleteSession');
      cy.url().should('match', /\/sessions$/);
    });

    it('shows an error when deletion fails', () => {
      cy.intercept('DELETE', '/api/session/10', {
        statusCode: 500,
        body: { message: 'Delete forbidden' },
      }).as('deleteSession');
      cy.visitAuthed('/sessions/10', 'admin');
      cy.wait('@getSession');

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Delete').click();
      cy.wait('@deleteSession');
      cy.contains('Delete forbidden').should('be.visible');
    });
  });
});
