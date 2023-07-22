describe('highlighteditables plugin', () => {
    const URL = 'http://localhost:8080/demo/cypress/highlighteditables-plugin.html'

    it('Check if content is editable', () => {
        cy.visit(URL)

        cy.get('#content').should('not.have.class', 'aloha-editable-highlight')

        cy.get('#content').realHover()
        cy.get('#main').realHover()
        
        cy.get('#content').should('have.class', 'aloha-editable-highlight')
    })
})
