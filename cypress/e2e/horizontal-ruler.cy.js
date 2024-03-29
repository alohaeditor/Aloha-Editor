describe('horizontalruler plugin', () => {

    const URL = 'http://localhost:8080/demo/modules/horizontalruler.html'

    it('Verify the existance of the "Add a horizontal ruler" button on "Insert" tab', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-2').should('exist').click()
        cy.get('#tab-ui-container-2').contains('button', 'Add a horizontal ruler').should('exist').should('be.visible').click()

        cy.get('#content hr').should('exist')
    })

    it('Verify if the icon exists', () => {
        cy.visit(URL)
        cy.get('#content').click()
        cy.get(".ui-button-icon-primary").should("exist").should('be.visible');
    });
})
