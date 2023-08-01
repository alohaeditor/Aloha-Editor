describe('linkbrowser plugin', () => {

    const URL = 'http://localhost:8080/demo/modules/linkbrowser.html'

    it('Verify the existence of the "Link" button in Format tab', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        cy.get('#tab-ui-container-1').contains('button', 'Insert Link').should('exist').should('be.visible')

    });

    it('Verify the existence of the "Link" button in Insert tab', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-2').click()
        cy.get('#tab-ui-container-2').contains('button', 'Insert Link').should('exist').should('be.visible')

    });

    it('Verify the functionality of the "Link" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        cy.get('#tab-ui-container-1').contains('button', 'Insert Link').click()
        cy.get('#content p').contains('a', 'New Link').should('exist')

        cy.get('#ui-id-3').should('exist').click()
        cy.get('#tab-ui-container-3').should('be.visible')
        cy.get('#aloha-attribute-field-editLink').click().type('http://example.cypress.io')
        cy.get('#aloha-attribute-field-editLink').should('have.value', 'http://example.cypress.io');
        cy.get('#content p').find('a').should('have.attr', 'href', 'http://example.cypress.io')

        cy.get('#tab-ui-container-3 button[title="Remove Link"]').should('exist').click()
        cy.get('#content p a').should('not.exist');
    });

    it('Verify the existence of the "Insert Link" button in tab-ui-container-3', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        cy.get('#tab-ui-container-1').contains('button', 'Insert Link').click()

        cy.get('#ui-id-3').should('exist').click()
        cy.get('#tab-ui-container-3').should('be.visible')
        cy.get('#tab-ui-container-3').contains('button', 'Insert Link').should('exist').should('be.visible').click()

        cy.get('div.repository-browser-modal-window.ui-resizable.aloha-dialog.ui-draggable.ui-resizable-autohide')
        .should('exist')
        .should('be.visible')
        .within(() => {
            cy.get('a').contains('link-languages').should('exist').should('be.visible')
        });
    });

    it('Verify if the icon exists', () => {
        cy.visit(URL)
        cy.get('#content').click()
        cy.get(".ui-button-icon-primary").should("exist").should('be.visible');
    });
})
