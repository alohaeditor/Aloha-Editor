describe("Wai-Lang Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/wai-lang.html");
    cy.get("#main").click();
    cy.get("h1").type("{leftarrow}");
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("be.visible");
  });

  it('creates an "Add language annotation" button on the Format tab', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Add language annotation").should("be.visible");
    });
  });

  it('creates a "Language annotation" tab when clicked with an input and a "Remove language annotation" button', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Add language annotation").click();
    });
    cy.get("#ui-id-7")
      .should("be.visible")
      .should("contain", "Language annotation");
    cy.get("#aloha-attribute-field-wailangfield").should("be.visible");
    cy.get("#tab-ui-container-7").within(() => {
      cy.get("span")
        .contains("Remove language annotation")
        .should("be.visible");
    });
  });

  it("input reveals an autocomplete dropdown when typed in", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Add language annotation").click();
    });
    cy.get("#aloha-attribute-field-wailangfield").type("as");
    cy.get("#ui-id-12")
      .should("be.visible")
      .children("li")
      .should("have.length", "2");
    cy.get("#aloha-attribute-field-wailangfield").clear().type("li");
    cy.get("#ui-id-12")
      .should("be.visible")
      .children("li")
      .should("have.length", "3");
  });

  it('inserts a <span> element with an attribute "lang" when a language is selected', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Add language annotation").click();
    });
    cy.get("#aloha-attribute-field-wailangfield").type("as");
    cy.get("#ui-id-12").find("li").eq(1).click();
    cy.get("h1")
      .find("span")
      .invoke("attr", "lang")
      .should("exist")
      .should("equals", "az");
  });

  it('"Remove language annotation" should remove the <span> tags', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Add language annotation").click();
    });
    cy.get("#aloha-attribute-field-wailangfield").type("as");
    cy.get("#ui-id-12").find("li").eq(1).click();
    cy.get("#tab-ui-container-7").within(() => {
      cy.get("span").contains("Remove language annotation").click();
    });
    cy.get("h1").find("span").should("not.exist");
  });
});
