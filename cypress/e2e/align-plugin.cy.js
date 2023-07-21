describe("Align Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/cypress/align-plugin-testing");
    cy.get("#main").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it("creates four buttons in the Format tab", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Align to the left").should("exist");
      cy.get("span").contains("Center").should("exist");
      cy.get("span").contains("Align to the right").should("exist");
      cy.get("span").contains("Justify").should("exist");
    });
  });

  it('testing "Align to the right"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Align to the right").click();
    });
    cy.get("h1")
      .invoke("attr", "style")
      .should("contain", "text-align: right;");
  });

  it('testing "Center"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Center").click();
    });
    cy.get("h1")
      .invoke("attr", "style")
      .should("contain", "text-align: center;");
  });

  it('testing "Justify"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Justify").click();
    });
    cy.get("h1")
      .invoke("attr", "style")
      .should("contain", "text-align: justify;");
  });

  it('testing "Align to the left"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Align to the right").click();
    });
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Align to the left").click();
    });
    cy.get("h1").invoke("attr", "style").should("contain", "text-align: left;");
  });
});
