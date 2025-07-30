describe('Navigation', () => {
  beforeEach(() => {
    // Login before each test
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { success: true, token: 'mock-token' }
    }).as('loginRequest');

    cy.visit('/');
    cy.get('input[type="text"]').type('admin');
    cy.get('input[type="password"]').type('admin');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
  });

  it('should navigate to Dashboard', () => {
    cy.get('a[href="/"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('h1').should('contain', 'System monitorowania floty pojazdów');
  });

  it('should navigate to Map', () => {
    cy.get('a[href="/map"]').click();
    cy.url().should('include', '/map');
    cy.get('.leaflet-container').should('be.visible');
  });

  it('should navigate to Vehicles', () => {
    cy.get('a[href="/vehicles"]').click();
    cy.url().should('include', '/vehicles');
    cy.get('h2').should('contain', 'Lista pojazdów');
  });

  it('should show active navigation state', () => {
    // Dashboard should be active by default
    cy.get('a[href="/"].active').should('exist');
    
    // Click on Map
    cy.get('a[href="/map"]').click();
    cy.get('a[href="/map"].active').should('exist');
    cy.get('a[href="/"].active').should('not.exist');
    
    // Click on Vehicles
    cy.get('a[href="/vehicles"]').click();
    cy.get('a[href="/vehicles"].active').should('exist');
    cy.get('a[href="/map"].active').should('not.exist');
  });

  it('should logout successfully', () => {
    cy.get('button.logout-button').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should redirect to dashboard after login', () => {
    // This test verifies that after login, user is redirected to dashboard
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('h1').should('contain', 'System monitorowania floty pojazdów');
  });

  it('should handle direct URL access to protected routes', () => {
    // Try to access map directly without authentication
    cy.clearLocalStorage();
    cy.visit('/map');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('input[type="text"]').should('be.visible');
  });
}); 