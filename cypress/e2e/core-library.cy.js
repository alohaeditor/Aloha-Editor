describe('core library', () => {

    const URL = 'http://localhost:8080/demo/modules/core-library.html'

    it('Check if content is editable', () => {
        cy.visit(URL)
      
        cy.get('#content').should('have.class', 'aloha-editable')
        .click().should('have.class', 'aloha-editable-active')

        cy.get('#content p').should('contain', 'core library')

        cy.get('#content p').type(' ALOHA EDITOR')

        cy.get('#content p').should('contain', 'core library ALOHA EDITOR')
    })
})
