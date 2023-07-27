describe("Emptyparagraph Plugin", () => {
  beforeEach(() => {
    cy.visit(
      "http://localhost:8080/demo/cypress/emptyparagraph-plugin-testing"
    );
  });

  it("changes the background-color when a <p> tag is empty", () => {
    cy.get("#test1").should("have.css", "background-color", "rgb(255, 0, 0)");
  });
  it("changes the background-color when an empty <p> has <br> elements within", () => {
    cy.get("#test2").should("have.css", "background-color", "rgb(255, 0, 0)");
  });
});
