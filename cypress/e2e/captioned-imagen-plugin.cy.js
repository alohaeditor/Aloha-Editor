
describe("captioned-image Plugin", () => {
    beforeEach(() => {
      cy.visit("http://localhost:8080/demo/modules/captioned-image.html");
      cy.get("#content").click();
    });

    it("Opens Aloha Editor UI when clicked", () => {
        cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
    });

    it('Verify the existence of the captioned-image', () => {
        cy.get(".aloha-captioned-image-block").should("exist").should('be.visible');
    });

    it('Edit a captioned-image', () => {
        cy.get('.caption')
        .invoke('text', 'Edited caption.')
        .should('have.text', 'Edited caption.');
    });

    it('verify that the captioned-image tab exists when clicking on the image', () => {
        cy.get('.aloha-captioned-image-block').click();
        cy.get('.ui-tabs-anchor') 
        .should('exist')        
        .should('contain', 'Captioned Image')  
    });

});



  