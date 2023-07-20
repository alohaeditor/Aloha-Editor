describe('list plugin', () => {

    const URL = 'http://localhost:8080/demo/cypress/listPlugin.html'

    it('Verify the existence of the "Insert Ordered List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
      
        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Ordered List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.visible');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.visible');
          
        cy.get('div.aloha-ui-menubutton-container[title="Insert Ordered List"]')
        .find('button.aloha-ui-menubutton-expand')
        .click()
        cy.get('ul#ui-id-16').should('exist').should('be.visible');
    });

    it('Verify the existence of the "Insert Unordered List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()

        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Unordered List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.visible');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.visible');
        
        cy.get('div.aloha-ui-menubutton-container[title="Insert Unordered List"]')
          .find('button.aloha-ui-menubutton-expand')
          .click()
          cy.get('ul#ui-id-24').should('exist').should('be.visible');
    });

    it('Verify the existence of the "Insert Definition List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()

        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Definition List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.hidden');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.hidden');

        cy.get('div.aloha-ui-menubutton-container[title="Insert Definition List"]').should('exist')
          .find('button.aloha-ui-menubutton-expand')
          .click()
          cy.get('ul#ui-id-12').should('exist').should('be.visible');
    });


    it('Verify the functionality of the "Insert Ordered List" button', () => {
        cy.visit(URL)
        cy.get('#content').click()

        cy.get('#content p').each(($el) => {
            cy.wrap($el).type('{selectall}').then(() => {
              cy.get('div.aloha-ui-menubutton-container[title="Insert Ordered List"]')
                .find('button.aloha-ui-menubutton-action')
                .click();
            });
        });
        cy.get('#content').should('have.descendants', 'ol')

        cy.contains('button', 'Increase Indent').click();
        cy.get('#content li').should('have.descendants', 'ol');

        cy.contains('button', 'Decrease Indent').click();
        cy.get('#content li').should('not.have.descendants', 'ol');
    });

    
    
    
      
      
      
      
      



})

    