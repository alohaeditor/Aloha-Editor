describe('format plugin', () => {

    const URL = 'http://localhost:8080/demo/cypress/format-plugin.html'

    it('Check if format buttons extist', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        
        cy.get('#tab-ui-container-1').within(() => {
            cy.get('button[title="Bold"]').should('exist');
            cy.get('button[title="Italic"]').should('exist');
            cy.get('button[title="Subscript"]').should('exist');
            cy.get('button[title="Superscript"]').should('exist');
            cy.get('button[title="Paragraph"]').should('exist');
            cy.get('button[title="Heading 1"]').should('exist');
            cy.get('button[title="Heading 2"]').should('exist');
            cy.get('button[title="Heading 3"]').should('exist');
            cy.get('button[title="Heading 4"]').should('exist');
            cy.get('button[title="Heading 5"]').should('exist');
            cy.get('button[title="Heading 6"]').should('exist');
            cy.get('button[title="Preformatted text"]').should('exist');
            cy.get('button').contains('span', 'Remove formatting').should('exist');
        });
    })

    it('Check button functionality', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        cy.get('button[title="Bold"]').click()
        cy.get('#content ').type('Bold')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Italic"]').click()
        cy.get('#content ').type('Italic')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Subscript"]').click()
        cy.get('#content ').type('Subscript')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Superscript"]').click()
        cy.get('#content ').type('Superscript')

        cy.get('#content').contains('b', 'Bold').should('exist');
        cy.get('#content').contains('i', 'Italic').should('exist');
        cy.get('#content').contains('sub', 'Subscript').should('exist');
        cy.get('#content').contains('sup', 'Superscript').should('exist');
    })

    it('Check button functionality', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
        cy.get('#ui-id-1').click()
        cy.get('button[title="Paragraph"]').click()
        cy.get('#content ').type('Paragraph')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 1"]').click()
        cy.get('#content ').type('Heading 1')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 2"]').click()
        cy.get('#content ').type('Heading 2')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 3"]').click()
        cy.get('#content ').type('Heading 3')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 4"]').click()
        cy.get('#content ').type('Heading 4')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 5"]').click()
        cy.get('#content ').type('Heading 5')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Heading 6"]').click()
        cy.get('#content ').type('Heading 6')

        cy.get('#content ').type('{enter}')
        cy.get('button[title="Preformatted text"]').click()
        cy.get('#content ').type('Preformatted text')

        cy.get('#content').contains('p', 'Paragraph').should('exist');
        cy.get('#content').contains('h1', 'Heading 1').should('exist');
        cy.get('#content').contains('h2', 'Heading 2').should('exist');
        cy.get('#content').contains('h3', 'Heading 3').should('exist');
        cy.get('#content').contains('h4', 'Heading 4').should('exist');
        cy.get('#content').contains('h5', 'Heading 5').should('exist');
        cy.get('#content').contains('h6', 'Heading 6').should('exist');
        cy.get('#content').contains('pre', 'Preformatted text').should('exist');

        cy.get('button').contains('span', 'Remove formatting').click()
        cy.get('#content').should('not.contain', 'pre');
        cy.get('#content').should('contain', 'Preformatted text');
    })
})
