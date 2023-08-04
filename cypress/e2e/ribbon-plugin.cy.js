describe("Ribbon Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/ribbon.html");
  });

  it("creates a ribbon NavBar", () => {
    cy.get(".aloha-ribbon").should("exist");
  });

  it("creates an arrow button that displays and hides the ribbon", () => {
    cy.get(".aloha-ribbon-out").click();
    cy.wait(500);
    cy.get(".ui-helper-clearfix").should("have.css", "left", "-966.019px");
    cy.get(".aloha-ribbon-in").click();
    cy.get(".ui-helper-clearfix").should("have.css", "left", "0px");
  });

  define("creates the following buttons:", () => {
    it("split button with an image and a dropdown", () => {
      cy.get(".aloha-ui-menubutton-container")
        .eq(0)
        .within(() => {
          cy.get("span").find("img").should("exist");
          cy.get("span").contains("split button").should("be.visible");
          cy.get(".ui-icon-triangle-1-s").should("be.visible").click();
          cy.get("#ui-id-20").should("be.visible");
        });
    });
    it("menu button with no image and a dropdown", () => {
      cy.get(".aloha-ui-menubutton-container")
        .eq(1)
        .within(() => {
          cy.get("span").find("img").should("not.exist");
          cy.get("span").contains("menu button").should("be.visible");
        });
      cy.get(".aloha-ui-menubutton-container")
        .eq(3)
        .within(() => {
          cy.get(".ui-icon-triangle-1-s").should("be.visible").click();
        });

      cy.get("#ui-id-36").should("be.visible");
    });
    it("button without text, with image and dropdown", () => {
      cy.get(".aloha-ui-menubutton-container")
        .eq(2)
        .within(() => {
          cy.get("span").find("img").should("exist").click();

          cy.get("#ui-id-31").should("be.visible");
        });
    });
    it("confirm, alert and progress buttons that open a new window", () => {
      cy.get(".aloha-ui-menubutton-container")
        .eq(4)
        .within(() => {
          cy.get("span").find("img").should("not.exist");
          cy.get("span").contains("confirm").should("be.visible").click();
        });
      cy.get("#ui-id-41").should("be.visible");
      cy.get("span").contains("Close").click();
      cy.get(".aloha-ui-menubutton-container")
        .eq(5)
        .within(() => {
          cy.get("span").find("img").should("not.exist");
          cy.get("span").contains("alert").should("be.visible").click();
        });
      cy.get("#ui-id-43").should("be.visible");
      cy.get("button").contains("Dismiss").click();
      cy.get(".aloha-ui-menubutton-container")
        .eq(6)
        .within(() => {
          cy.get("span").find("img").should("not.exist");
          cy.get("span").contains("progress").should("be.visible").click();
        });
      cy.get("#ui-id-45").should("be.visible");
    });
  });

  it("Verify if the icon exists", () => {
    cy.get(".ui-button-icon-primary").should("exist").should("be.visible");
  });
});
