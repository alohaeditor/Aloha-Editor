describe("Autoparagraph Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/autoparagraph.html");
  });

  describe("transforms content not contained in block level elements into paragraphs", () => {
    it("with bold and/or italic inbetween", () => {
      cy.get("#test1")
        .find("p")
        .contains("Test with bold and italic inbetween")
        .should("exist");
    });
    it("with a <hr> inbetween", () => {
      cy.get("#test2").find("p").contains("Test with a line").should("exist");
      cy.get("#test2").find("p").contains("inbetween").should("exist");
    });
    it("with a <br> inbetween", () => {
      cy.get("#test3")
        .find("p")
        .contains("Test with a space inbetween")
        .should("exist");
    });
  });
  it("doesn't do anything if the root DOM element doesn't allow insertions of <p>", () => {
    cy.get("h1").first().find("p").should("not.exist");
  });
});
