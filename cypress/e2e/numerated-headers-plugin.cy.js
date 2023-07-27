describe("CharacterPicker Plugin", () => {
  beforeEach(() => {
    cy.visit(
      "http://localhost:8080/demo/modules/numerated-headers.html"
    );
    cy.get("#main").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates a "Toggle header numeration" on the Format tab', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Toggle header numeration").should("exist");
    });
  });

  it("creates a <span> element before each header", () => {
    cy.get("h1,h2,h3,h4,h5,h6").each(($header) => {
      cy.wrap($header).find("div").find("span").should("exist");
    });
  });

  it("each <span> increments for each header", () => {
    cy.get("h1").eq(1).find("div").find("span").should("contain", "2");
    cy.get("h2").eq(0).find("div").find("span").should("contain", "1.1");
    cy.get("h3").eq(0).find("div").find("span").should("contain", "1.1.1");
    cy.get("h4").eq(1).find("div").find("span").should("contain", "2.2");
    cy.get("h5").eq(0).find("div").find("span").should("contain", "2.2.1");
    cy.get("h6").eq(0).find("div").find("span").should("contain", "2.2.1.1");
  });

  it('removes and reinserts the <span> elements when clicked on "Toggle header numeration"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Toggle header numeration").click();
    });
    cy.get("h1,h2,h3,h4,h5,h6").each(($header) => {
      cy.wrap($header).find("div").should("not.exist");
    });
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Toggle header numeration").click();
    });
    cy.get("h1,h2,h3,h4,h5,h6").each(($header) => {
      cy.wrap($header).find("div").find("span").should("exist");
    });
  });

  it("updates the <span> elements when a new header is created", () => {
    cy.get("#test-paragraph").click();
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Heading 2").click();
    });

    cy.get("h2")
      .eq(1)
      .should("contain", "This is a test paragraph.")
      .find("div")
      .find("span")
      .should("contain", "1.2");
    cy.get("h3").first().find("div").find("span").should("contain", "1.2.1");
  });
});
