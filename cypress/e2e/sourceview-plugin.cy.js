describe("Sourceview Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/sourceview");
    cy.get(".aloha-sidebar-right").within(() => {
      cy.get(".aloha-sidebar-handle").click();
    });
  });

  it("creates a hidden sidebar on the right with an handle button", () => {
    cy.get(".aloha-sidebar-right")
      .should("exist")
      .should("have.css", "margin-right", "0px")
      .within(() => {
        cy.get(".aloha-sidebar-handle").should("be.visible").click();
      });
    cy.get(".aloha-sidebar-right").should("have.css", "margin-right", "-250px");
  });

  it('has a "Source Viewer" button that toggles the code viewer', () => {
    cy.get(".aloha-sidebar-panel-content").should(
      "have.css",
      "height",
      "438px"
    );
    cy.get("span").contains("Source Viewer").should("be.visible").click();
    cy.get(".aloha-sidebar-panel-content").should("have.css", "height", "3px");
  });

  it("shows an editable's html code when clicked on", () => {
    cy.get("h1").first().click();
    cy.get("#aloha-devtool-source-viewer-content")
      .contains("This is 1st level heading")
      .should("exist");
  });

  it("displays a marker in the code where the editable was clicked", () => {
    cy.get("h1").first().click();
    cy.get("#aloha-devtool-source-viewer-content")
      .find("span")
      .should("exist")
      .and("have.css", {
        background: "rgb(112, 165, 226)",
        color: "rgb(255, 255, 255)",
        "border-radius": "3px",
      });
  });

  it("the marker highlights in the code the selection made in the editable", () => {
    cy.get("h4").first().click().realPress(["Shift", "Home"]);
    cy.get("#aloha-devtool-source-viewer-content")
      .find("span")
      .contains("This is 4th level heading")
      .should("exist")
      .find("b")
      .should("have.length", 2);
  });

  it('creates a "Widen" checkbox that increases the width of the side bar', () => {
    cy.get(".aloha-sidebar-right").should("have.css", "width", "250px");
    cy.get("#aloha-devtool-source-viewer-widen-ckbx")
      .should("be.visible")
      .click();
    cy.get(".aloha-sidebar-right").should("have.css", "width", "600px");
  });

  it('creates a "Show all source" checkbox that isolates the editable selected or not', () => {
    cy.get("h5").first().click().realPress(["Shift", "Home"]);
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Italic").click();
    });
    cy.get("#aloha-devtool-source-viewer-content")
      .contains("This is 1st level heading")
      .should("exist");
    cy.get("#aloha-devtool-source-viewer-content")
      .contains('<i class="">')
      .should("exist");
    cy.get("#aloha-devtool-source-viewer-entire-ckbx")
      .should("be.visible")
      .click();
    cy.get("h5").first().click();
    cy.get("#aloha-devtool-source-viewer-content")
      .contains("This is 1st level heading")
      .should("not.exist");
    cy.get("#aloha-devtool-source-viewer-content")
      .contains('<i class="">')
      .should("exist");
  });
});
