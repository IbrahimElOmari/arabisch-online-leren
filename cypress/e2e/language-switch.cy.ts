describe('Language Switcher', () => {
  beforeEach(() => {
    cy.visit('/');
    localStorage.clear();
  });

  it('should display language selector with current language', () => {
    cy.get('[data-testid="language-selector"]').should('exist');
    cy.get('[data-testid="language-selector"]').should('be.visible');
  });

  it('should switch to English', () => {
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('English').click();
    
    // Wait for language change
    cy.wait(500);
    
    // Verify language changed in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('en');
    });
    
    // Verify HTML attributes
    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.get('html').should('have.attr', 'lang', 'en');
    
    // Take screenshot for documentation
    cy.screenshot('language-en', { capture: 'viewport' });
  });

  it('should switch to Arabic and enable RTL', () => {
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('العربية').click();
    
    // Wait for language and RTL change
    cy.wait(500);
    
    // Verify language changed in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('ar');
    });
    
    // Verify RTL mode and HTML attributes
    cy.get('html').should('have.attr', 'dir', 'rtl');
    cy.get('html').should('have.attr', 'lang', 'ar');
    cy.get('html').should('have.class', 'rtl-mode');
    
    // Verify Arabic typography applied
    cy.get('h1').should('have.class', 'arabic-text');
    
    // Take screenshot for documentation
    cy.screenshot('language-ar', { capture: 'viewport' });
  });

  it('should persist language preference on reload', () => {
    // Switch to English
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('English').click();
    cy.wait(500);
    
    // Reload page
    cy.reload();
    
    // Verify language persisted
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('en');
    });
    
    // Verify HTML attributes persisted
    cy.get('html').should('have.attr', 'lang', 'en');
    cy.get('html').should('have.attr', 'dir', 'ltr');
  });

  it('should switch to Dutch (default)', () => {
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('Nederlands').click();
    cy.wait(500);
    
    // Verify language changed
    cy.window().then((win) => {
      expect(win.localStorage.getItem('language_preference')).to.equal('nl');
    });
    
    // Verify HTML attributes
    cy.get('html').should('have.attr', 'dir', 'ltr');
    cy.get('html').should('have.attr', 'lang', 'nl');
    cy.get('html').should('have.class', 'ltr-mode');
    
    // Take screenshot for documentation
    cy.screenshot('language-nl', { capture: 'viewport' });
  });

  it('should switch between all three languages with correct dir/lang attributes', () => {
    const languages = [
      { name: 'English', code: 'en', dir: 'ltr', mode: 'ltr-mode' },
      { name: 'العربية', code: 'ar', dir: 'rtl', mode: 'rtl-mode' },
      { name: 'Nederlands', code: 'nl', dir: 'ltr', mode: 'ltr-mode' },
    ];

    languages.forEach((lang) => {
      cy.get('[data-testid="language-selector"]').click();
      cy.contains(lang.name).click();
      cy.wait(500);
      
      // Verify localStorage
      cy.window().then((win) => {
        expect(win.localStorage.getItem('language_preference')).to.equal(lang.code);
      });
      
      // Verify HTML attributes
      cy.get('html').should('have.attr', 'lang', lang.code);
      cy.get('html').should('have.attr', 'dir', lang.dir);
      cy.get('html').should('have.class', lang.mode);
    });
  });

  it('should maintain RTL layout in Arabic mode', () => {
    // Switch to Arabic
    cy.get('[data-testid="language-selector"]').click();
    cy.contains('العربية').click();
    cy.wait(500);
    
    // Verify RTL class is applied to main elements
    cy.get('html').should('have.class', 'rtl-mode');
    
    // Verify navigation is visible and functional
    cy.get('[data-testid="language-selector"]').should('be.visible');
    
    // Verify Arabic typography
    cy.get('h1.arabic-text').should('exist');
  });
});
