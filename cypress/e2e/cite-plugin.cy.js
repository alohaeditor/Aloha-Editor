describe('cite plugin', () => {
    const URL = 'http://localhost:8080/demo/modules/cite.html'

    it('Check if the buttons works', () => {
        cy.visit(URL)

        cy.get('#content').should('be.visible').then(($content) => {
            $content.trigger('click')
        })

        cy.get('#content').type('a', { delay: 0 })

        cy.get('#content').type('{selectall}{backspace}', { delay: 0 })

        cy.get('#content').should('be.visible').then(($content) => {
            $content.trigger('click')
        })

        cy.contains('#tab-ui-container-1 button', 'Format selection as quote')
          .should('be.visible')
          .then(($button) => {
              $button.trigger('click');
          })
    
        cy.get('#content q').should('be.visible')

        cy.get('#content p').type('blockquote');
        cy.get('[title="Format selection as blockquote"]').should('exist').click();
        cy.get('#content blockquote').should('be.visible');
    })
})
