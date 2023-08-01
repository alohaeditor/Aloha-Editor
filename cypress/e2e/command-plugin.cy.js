describe("Command Plugin", () => {
    beforeEach(() => {
        cy.visit(
            "http://localhost:8080/demo/modules/command.html"
        )
    });

    it('creates a "Bold" button', () => {
        cy.get("#bold").should("be.visible");
    });
    describe("changes the button color when something is selected", () => {
        it("green if the selection is bolded", () => {
            cy.get("p").first().click()
            cy.get("h1").contains("Hello there").click()
            cy.get("#bold").should("have.css", "background-color", "rgb(144, 238, 144)")

        })
        it("orange if the selection is not bolded", () => {
            cy.get("p").first().click()
            cy.get("#bold").should("have.css", "background-color", "rgb(255, 165, 0)")
        })
        it("yellow if the selection has bolded and not bolded segments", () => {
            cy.get("p").click().type("{ctrl}a")
            cy.get("#bold").should("have.css", "background-color", "rgb(255, 255, 0)")
        })
    })
    it("changes if the selection is bolded or not accordingly when clicked on", () => {

        cy.get("p").click().type("{ctrl}a")
        cy.get("#bold").click()
        cy.get("#test2").find("b").contains("{Some content to select} with Aloha selection.").should("exist")
        cy.get("#bold").click()
        cy.get("#test1").find("b").should("not.exist")

    })
})