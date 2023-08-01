describe("Block Plugin", () => {
    beforeEach(() => {
        cy.visit(
            "http://localhost:8080/demo/modules/block.html"
        );

    });
    it("transforms all editables in blocks", () => {
        cy.get(".aloha-block").should("have.length", 56)
    })
})