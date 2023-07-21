describe("TextColor Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/cypress/textcolor-plugin-testing");
    cy.get("#main").click();
    cy.get("h1").type("{leftarrow}");
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates a "Change text color" button', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text color").should("exist");
    });
  });

  it('creates a "Change text background-color" button', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text background-color").should("exist");
    });
  });

  it("contains 216 colors to choose from", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text color").click();
    });
    cy.get("table").first().find("td").should("length", 217);
  });

  it("contains a button to remove color", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text color").click();
    });
    cy.get("table").first().find("td").last().find("div").contains("✖");
  });

  it("changes selected text color", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text color").click();
    });
    cy.get("table").eq(2).find("tr").eq(4).find("td").eq(10).click();
    cy.get("h1")
      .find("span")
      .invoke("attr", "style")
      .should("equal", "color: rgb(204, 51, 204);");
    cy.get("h1").type("{home}{rightarrow}");
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text color").click();
    });
    cy.get("table").eq(4).find("tr").eq(5).find("td").eq(0).click();
    cy.get("h1")
      .find("span")
      .invoke("attr", "style")
      .should("equal", "color: rgb(0, 0, 255);");
    cy.get("h1").click();
  });

  it("changes selected text background color", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text background-color").click();
    });
    cy.get("table").eq(3).find("tr").eq(5).find("td").eq(0).click();
    cy.get("h1")
      .find("span")
      .invoke("attr", "style")
      .should("equal", "background-color: rgb(0, 0, 255);");
    cy.get("h1").type("{home}{rightarrow}");
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Change text background-color").click();
    });
    cy.get("table").eq(5).find("tr").eq(4).find("td").eq(10).click();
    cy.get("h1")
      .find("span")
      .invoke("attr", "style")
      .should("equal", "background-color: rgb(204, 51, 204);");
    cy.get("h1").click();
  });
});
