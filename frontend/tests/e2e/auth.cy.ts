/// <reference types="cypress" />


const USER_EMAIL = 'victor@yoga.com';
const PASSWORD = 'Azerty#0';
const FIRSTNAME='Victor';
const LASTNAME='Pille';
const LOGIN_RESPONSE = {
    id: 1,
    email: USER_EMAIL,
    firstName: FIRSTNAME,
    lastName: LASTNAME,
    admin: false,
    token: 'tok-123456789',
};

describe('Authentication', () => {
    beforeEach(() => {
        // La liste des sessions est sollicitée dès qu'on atterrit sur /sessions
        cy.intercept('GET', '/api/session', {body: []});
    });

    describe('Login', () => {
        it('logs in successfully and redirects to sessions', () => {
            cy.intercept('POST', '/api/auth/login', {statusCode: 200, body: LOGIN_RESPONSE}).as('login');

            cy.visit('/login');
            cy.get('input[type="email"]').type(USER_EMAIL);
            cy.get('input[type="password"]').type(PASSWORD);
            cy.get('button[type="submit"]').click();

            cy.wait('@login').its('request.body').should('deep.equal', {
                email: USER_EMAIL,
                password: PASSWORD,
            });
            cy.url().should('include', '/sessions');
            cy.window().its('localStorage.token').should('eq', 'tok-123456789');
        });

        it('shows the API error message on failure', () => {
            cy.intercept('POST', '/api/auth/login', {
                statusCode: 401,
                body: {message: 'Bad credentials'},
            }).as('login');

            cy.visit('/login');
            cy.get('input[type="email"]').type(USER_EMAIL);
            cy.get('input[type="password"]').type('wrong');
            cy.get('button[type="submit"]').click();

            cy.wait('@login');
            cy.contains('Bad credentials').should('be.visible');
            cy.url().should('include', '/login');
        });

        it('falls back to a generic error when none is provided', () => {
            cy.intercept('POST', '/api/auth/login', {statusCode: 500, body: {}}).as('login');

            cy.visit('/login');
            cy.get('input[type="email"]').type(USER_EMAIL);
            cy.get('input[type="password"]').type('whatever');
            cy.get('button[type="submit"]').click();

            cy.wait('@login');
            cy.contains('Login failed').should('be.visible');
        });

        it('navigates to the register page', () => {
            cy.visit('/login');
            cy.contains('Register here').click();
            cy.url().should('include', '/register');
        });
    });

    describe('Register', () => {
        it('registers successfully and redirects to sessions', () => {
            cy.intercept('POST', '/api/auth/register', {statusCode: 200, body: LOGIN_RESPONSE}).as('register');

            cy.visit('/register');
            cy.get('input[name="firstName"]').type(FIRSTNAME);
            cy.get('input[name="lastName"]').type(LASTNAME);
            cy.get('input[name="email"]').type(USER_EMAIL);
            cy.get('input[name="password"]').type(PASSWORD);
            cy.get('button[type="submit"]').click();

            cy.wait('@register').its('request.body').should('deep.equal', {
                firstName: FIRSTNAME,
                lastName: LASTNAME,
                email: USER_EMAIL,
                password: PASSWORD,
            });
            cy.url().should('include', '/sessions');
        });

        it('shows an error when registration fails', () => {
            cy.intercept('POST', '/api/auth/register', {
                statusCode: 400,
                body: {message: 'Email already taken'},
            }).as('register');

            cy.visit('/register');
            cy.get('input[name="firstName"]').type('Juliette');
            cy.get('input[name="lastName"]').type('Michel');
            cy.get('input[name="email"]').type('juliette@yoga.com');
            cy.get('input[name="password"]').type(PASSWORD);
            cy.get('button[type="submit"]').click();

            cy.wait('@register');
            cy.contains('Email already taken').should('be.visible');
        });

        it('navigates to the login page', () => {
            cy.visit('/register');
            cy.contains('Login here').click();
            cy.url().should('include', '/login');
        });
    });

    describe('Route guards & logout', () => {
        it('redirects unauthenticated users from a protected route to login', () => {
            cy.visit('/sessions');
            cy.url().should('include', '/login');
        });

        it('redirects the root path to login when unauthenticated', () => {
            cy.visit('/');
            cy.url().should('include', '/login');
        });

        it('logs out and clears the session', () => {
            cy.visitAuthed('/sessions', 'user');
            cy.contains('button', 'Logout').click();
            cy.url().should('include', '/login');
            cy.window().its('localStorage.token').should('be.undefined');
        });
    });
});
