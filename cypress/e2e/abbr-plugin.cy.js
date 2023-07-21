describe("Abbr Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/cypress/abbr-plugin-testing");
    cy.get("#main").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates a "format as abbreviation" button in the Format and an "insert abbreviation" in the Insert tab', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("format as abbreviation").should("exist");
    });
    cy.get("#ui-id-2").click();
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("insert abbreviation").should("exist");
    });
  });

  it('"format as abbreviation" should create an "Abbreviation" tab with an input that adds <abbr> tags to selected text', () => {
    cy.get("h1").type("{leftarrow}");
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("format as abbreviation").click();
    });
    cy.get("#aloha-attribute-field-abbrText")
      .should("exist")
      .type("Testing abbreviation");
    cy.get("h1")
      .find("abbr")
      .should("exist")
      .should("contain", "Plugin")
      .invoke("attr", "title")
      .should("equal", "Testing abbreviation");
  });

  it('"format as abbreviation" should work with more than one selected word', () => {
    cy.get("h1")
      .type("{ctrl+a}")
      .then(() => {
        cy.get("#tab-ui-container-1")
          .find("span")
          .contains("format as abbreviation")
          .click();
      });

    cy.get("#aloha-attribute-field-abbrText")
      .should("exist")
      .type("Testing abbreviation");
    cy.get("h1")
      .find("abbr")
      .should("exist")
      .should("contain", "Abbr Plugin")
      .invoke("attr", "title")
      .should("equal", "Testing abbreviation");
  });

  it('"format as abbreviation" should work with different selected lines', () => {
    cy.get("h1").type("{shift+enter}This is a new line");
    cy.get("h1")
      .type("{ctrl+a}")
      .then(() => {
        cy.get("#tab-ui-container-1")
          .find("span")
          .contains("format as abbreviation")
          .click();
      });

    cy.get("#aloha-attribute-field-abbrText")
      .should("exist")
      .type("Testing abbreviation");
    cy.get("h1")
      .find("abbr")
      .first()
      .should("contain", "Abbr Plugin")
      .invoke("attr", "title")
      .should("equal", "Testing abbreviation");
    cy.get("h1")
      .find("abbr")
      .eq(2)
      .should("contain", "This is a new line")
      .invoke("attr", "title")
      .should("equal", "Testing abbreviation");
  });

  it('"insert abbreviation" should create an "Abbreviation" tab with an input that adds the text "Abbr" with <abbr> tags', () => {
    cy.get("h1").type(" ");
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("format as abbreviation").click();
    });
    cy.get("#aloha-attribute-field-abbrText")
      .should("exist")
      .type("Testing abbreviation");
    cy.get("h1")
      .find("abbr")
      .should("exist")
      .invoke("attr", "title")
      .should("equal", "Testing abbreviation");
  });

  it('creates a "remove abbreviation" button in both tabs that removes the <abbr> tags', () => {
    cy.get("h1").type("{leftarrow}");
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("format as abbreviation").click();
    });
    cy.get("#aloha-attribute-field-abbrText").type("Testing abbreviation");
    cy.get("#tab-ui-container-6").within(() => {
      cy.get("span").contains("remove abbreviation").click();
    });
    cy.get("h1").find("abbr").should("not.exist");
  });
});
