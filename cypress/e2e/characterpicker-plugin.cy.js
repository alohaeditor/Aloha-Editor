describe("CharacterPicker Plugin", () => {
  beforeEach(() => {
    cy.visit(
      "http://localhost:8080/demo/modules/characterpicker.html"
    );
    cy.get("#main").click();
    cy.get("#ui-id-2").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates a "pick special characters" button', () => {
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("pick special characters").should("exist");
    });
  });

  it("display a dropdown when clicked with all the special symbols", () => {
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("pick special characters").click();
    });
    cy.get("table").find("td").should("length", 243);
  });

  it("insert special symbol when clicked", () => {
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("pick special characters").click();
    });
    cy.get("table").find("tr").eq(10).find("td").eq(8).click();
    cy.get("h1").should("contain", "CharacterPicker PluginΔ");
  });

  it("for a selection, it should replace it for the symbol", () => {
    cy.get("h1").type("{ctrl+a}");
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("pick special characters").click();
    });
    cy.get("table").find("tr").eq(10).find("td").eq(8).click();
    cy.get("#main").should("contain", "Δ");
  });
  it('Verify if the icon exists', () => {
    cy.get(".ui-button-icon-primary").should("exist").should('be.visible');
});
});
