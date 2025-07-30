// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Custom command to navigate to specific page
Cypress.Commands.add('navigateTo', (page) => {
  cy.get(`a[href="/${page}"]`).click();
  cy.url().should('include', `/${page}`);
});

// Custom command to check vehicle list
Cypress.Commands.add('checkVehicleList', () => {
  cy.get('[data-testid="vehicles-count"]').should('be.visible');
  cy.get('.vehicle-item').should('have.length.greaterThan', 0);
});

// Custom command to check map
Cypress.Commands.add('checkMap', () => {
  cy.get('.leaflet-container').should('be.visible');
  cy.get('.leaflet-marker-icon').should('exist');
});

// Custom command to check dashboard
Cypress.Commands.add('checkDashboard', () => {
  cy.get('h1').should('contain', 'System monitorowania floty pojazdów');
  cy.get('.dashboard-stats').should('be.visible');
}); 