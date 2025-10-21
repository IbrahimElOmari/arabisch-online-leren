describe('Language Switcher', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display language selector with current language', () => {
    cy.get('[data-testid="language-selector"]').should('exist');
  });

  it('should switch to English', () => {
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('English').click();
    
    // Verify language changed
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('en');
    });
    
    // Verify UI updated
    cy.contains('Home').should('exist');
  });

  it('should switch to Arabic and enable RTL', () => {
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('العربية').click();
    
    // Verify language changed
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('ar');
    });
    
    // Verify RTL mode
    cy.get('html').should('have.attr', 'dir', 'rtl');
    cy.get('html').should('have.attr', 'lang', 'ar');
  });

  it('should persist language preference on reload', () => {
    // Switch to English
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('English').click();
    
    // Reload page
    cy.reload();
    
    // Verify language persisted
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('en');
    });
    
    cy.contains('Home').should('exist');
  });

  it('should switch between all three languages', () => {
    const languages = [
      { name: 'English', code: 'en', sample: 'Home' },
      { name: 'العربية', code: 'ar', sample: 'الرئيسية' },
      { name: 'Nederlands', code: 'nl', sample: 'Home' },
    ];

    languages.forEach((lang) => {
      cy.get('[data-testid="language-selector"]').click();
      cy.contains(lang.name).click();
      
      cy.window().then((win) => {
        expect(win.localStorage.getItem('language_preference')).to.equal(lang.code);
      });
      
      cy.wait(500); // Allow time for UI update
    });
  });
});
