/// <reference types="cypress" />

describe('Session form', () => {
  describe('Create (admin)', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' }).as('getTeachers');
    });

    it('creates a session and redirects to the list', () => {
      cy.intercept('POST', '/api/session', { statusCode: 201, body: {} }).as('createSession');
      cy.intercept('GET', '/api/session', { body: [] });

      cy.visitAuthed('/sessions/create', 'admin');
      cy.wait('@getTeachers');
      cy.contains('h1', 'Create New Session').should('be.visible');

      cy.get('input[name="name"]').type('Yoga du soir');
      cy.get('input[name="date"]').type('2026-07-01');
      cy.get('select[name="teacherId"]').select('Charlie Zterone');
      cy.get('textarea[name="description"]').type('Séance relaxante au coucher du soleil.');
      cy.contains('button', 'Create Session').click();

      cy.wait('@createSession').its('request.body').should('deep.equal', {
        name: 'Yoga du soir',
        date: '2026-07-01',
        description: 'Séance relaxante au coucher du soleil.',
        teacherId: 3,
      });
      cy.url().should('match', /\/sessions$/);
    });

    it('shows an error when creation fails', () => {
      cy.intercept('POST', '/api/session', {
        statusCode: 400,
        body: { message: 'Invalid session' },
      }).as('createSession');

      cy.visitAuthed('/sessions/create', 'admin');
      cy.wait('@getTeachers');

      cy.get('input[name="name"]').type('Yoga du soir');
      cy.get('input[name="date"]').type('2026-07-01');
      cy.get('select[name="teacherId"]').select('Oscar Isé');
      cy.get('textarea[name="description"]').type('Peu importe.');
      cy.contains('button', 'Create Session').click();

      cy.wait('@createSession');
      cy.contains('Invalid session').should('be.visible');
    });

    it('shows an error when teachers cannot be loaded', () => {
      cy.intercept('GET', '/api/teacher', { statusCode: 500, body: {} }).as('getTeachersError');
      cy.visitAuthed('/sessions/create', 'admin');
      cy.wait('@getTeachersError');
      cy.contains('Failed to fetch teachers').should('be.visible');
    });

    it('cancels and returns to the sessions list', () => {
      cy.intercept('GET', '/api/session', { body: [] });
      cy.visitAuthed('/sessions/create', 'admin');
      cy.wait('@getTeachers');
      cy.contains('button', 'Cancel').click();
      cy.url().should('match', /\/sessions$/);
    });
  });

  describe('Edit (admin)', () => {
    it('prefills the form and updates the session', () => {
      cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' }).as('getTeachers');
      cy.intercept('GET', '/api/session/10', { fixture: 'session.json' }).as('getSession');
      cy.intercept('PUT', '/api/session/10', { statusCode: 200, body: {} }).as('updateSession');
      cy.intercept('GET', '/api/session', { body: [] });

      cy.visitAuthed('/sessions/edit/10', 'admin');
      cy.wait(['@getTeachers', '@getSession']);

      cy.contains('h1', 'Edit Session').should('be.visible');
      cy.get('input[name="name"]').should('have.value', 'Yoga du matin');
      cy.get('input[name="date"]').should('have.value', '2026-06-15');
      cy.get('select[name="teacherId"]').should('have.value', '3');

      cy.get('input[name="name"]').clear();
      cy.get('input[name="name"]').type('Yoga du matin Plus');
      cy.contains('button', 'Update Session').click();

      cy.wait('@updateSession').its('request.body').should('deep.equal', {
        name: 'Yoga du matin Plus',
        date: '2026-06-15',
        description: 'Un flow dynamique pour bien démarrer la journée.',
        teacherId: 3,
      });
      cy.url().should('match', /\/sessions$/);
    });
  });

  describe('Access control', () => {
    it('redirects a non-admin user away from the form', () => {
      cy.intercept('GET', '/api/teacher', { fixture: 'teachers.json' });
      cy.intercept('GET', '/api/session', { body: [] });
      cy.visitAuthed('/sessions/create', 'user');
      cy.url().should('match', /\/sessions$/);
      cy.contains('h1', 'Create New Session').should('not.exist');
    });
  });
});
