describe("Table of Contents Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/toc.html");
    cy.get("#main").click();
    cy.get("#ui-id-2").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates a "Table of contents" button on Insert tab', () => {
    cy.get("#tab-ui-container-2").within(() => {
      cy.get("span").contains("Table of contents").should("be.visible");
    });
  });

  it("creates an ordered list when clicked", () => {
    createTableOfContents();
    cy.get("#toc").should("be.visible").should("have.prop", "tagName", "OL");
  });

  it("respects the header order and hierarchy in the list", () => {
    createTableOfContents();
    cy.get("#toc").children("li").should("have.length", "2");
    cy.get("#toc")
      .find("li")
      .eq(3)
      .find("ol")
      .children("li")
      .should("have.length", "5");
  });

  it("updates the list properly when a header is added or removed", () => {
    createTableOfContents();
    cy.get("#ui-id-1").click();
    cy.get("#test-paragraph").click();
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Heading 2").click();
    });
    cy.get("#main").click();
    cy.wait(5000);
    cy.get("#toc")
      .find("li")
      .eq(2)
      .find("a")
      .should("contain", "This is a test paragraph.");
  });
});

function createTableOfContents() {
  cy.get("h1").first().click().type("{home}");
  cy.get("#tab-ui-container-2").within(() => {
    cy.get("span").contains("Table of contents").click();
  });
}
