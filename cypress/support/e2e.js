// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // for uncaught exceptions in the application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom command to login
Cypress.Commands.add('login', (username = 'admin', password = 'admin') => {
  cy.visit('/');
  cy.get('input[type="text"]').type(username);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Custom command to wait for vehicles to load
Cypress.Commands.add('waitForVehicles', () => {
  cy.intercept('GET', '/api/vehicles').as('getVehicles');
  cy.wait('@getVehicles');
});

// Custom command to check if user is authenticated
Cypress.Commands.add('isAuthenticated', () => {
  return cy.window().then((win) => {
    return win.localStorage.getItem('auth_token') !== null;
  });
}); 