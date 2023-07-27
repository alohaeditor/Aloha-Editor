describe('dom-to-xhtml plugin', () => {

    const URL = 'http://localhost:8080/demo/modules/dom-to-xhtml.html'

    it('Check ', () => {
        cy.visit(URL)
      
        cy.get('#content').click().type('{enter}demo')

        cy.window().then((win) => {
            const editable = win.Aloha.getEditableById('content');
            const xhtmlContent = editable.getContents();
            expect(xhtmlContent).to.match(/<p>\s*DOM-TO-XHTML PLUGIN\s*<\/p><p>demo<\/p>/);
        });
    })
})
