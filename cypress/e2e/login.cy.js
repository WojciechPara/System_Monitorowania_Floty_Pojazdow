describe('Login Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login form', () => {
    cy.get('input[type="text"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Zaloguj się');
  });

  it('should login with valid credentials', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: { success: true, token: 'mock-token' }
    }).as('loginRequest');

    cy.get('input[type="text"]').type('admin');
    cy.get('input[type="password"]').type('admin');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('not.include', '/login');
    cy.get('h1').should('contain', 'System monitorowania floty pojazdów');
  });

  it('should show error with invalid credentials', () => {
    cy.intercept('POST', '/api/login', {
      statusCode: 401,
      body: { success: false, message: 'Nieprawidłowy login lub hasło' }
    }).as('loginRequest');

    cy.get('input[type="text"]').type('wrong');
    cy.get('input[type="password"]').type('wrong');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('div').should('contain', 'Nieprawidłowy login lub hasło');
    cy.url().should('include', '/');
  });

  it('should toggle password visibility', () => {
    cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    
    cy.get('button[aria-label="Pokaż hasło"]').click();
    cy.get('input[type="password"]').should('have.attr', 'type', 'text');
    
    cy.get('button[aria-label="Ukryj hasło"]').click();
    cy.get('input[type="password"]').should('have.attr', 'type', 'password');
  });

  it('should show loading state during login', () => {
    cy.intercept('POST', '/api/login', (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: { success: true, token: 'mock-token' }
      });
    }).as('loginRequest');

    cy.get('input[type="text"]').type('admin');
    cy.get('input[type="password"]').type('admin');
    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should('contain', 'Logowanie...');
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should prevent form submission with empty fields', () => {
    cy.intercept('POST', '/api/login').as('loginRequest');

    cy.get('button[type="submit"]').click();

    cy.get('@loginRequest.all').should('have.length', 0);
  });
}); 