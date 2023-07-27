describe("Metaview Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/metaview-plugin-testing");
    cy.get("#main").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it('creates an "Switch between meta and normal view" on Format tab', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span")
        .contains("Switch between meta and normal view")
        .should("exist");
    });
  });
  it("changes the background-image of elements: <p>, <pre>, <h1> - <h6>, <blockquote>, <div>, <dl>, <dt>, <dd>, <td>, <th>, <table>, <caption> and <hr>", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Switch between meta and normal view").click();
    });

    cy.get("#main").within(() => {
      cy.get(
        "h1, h2, h3, h4, h5, h6, p, pre, blockquote, div:not(:first-child), dl, dt, dd, td, th, table, caption, hr"
      ).should("not.have.css", "background-image", "none");
    });
  });

  it('adds a dotted line beneath elements: <abbr> and <dfn> and changes the cursor to "help"', () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Switch between meta and normal view").click();
    });
    cy.get("#main").within(() => {
      cy.get("abbr, dfn").should("have.css", {
        "border-bottom": "1px dotted",
        cursor: "help",
      });
    });
  });

  it("adds a background image and different css to elements: <a>, <q> and those with lang attributes", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Switch between meta and normal view").click();
    });
    cy.get("#main").within(() => {
      cy.get("#lang-test, q, a")
        .should("have.css", {
          "padding-left": "20px",
          border: "1px dotted #ddd",
          "background-color": "#ccc",
          "background-repeat": "no-repeat",
          "background-position": "left center",
        })
        .should("not.have.css", "background-image", "none");
    });
  });

  it("toggles to normal view when clicked again", () => {
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Switch between meta and normal view").click();
    });
    cy.get("#tab-ui-container-1").within(() => {
      cy.get("span").contains("Switch between meta and normal view").click();
    });
    cy.get("#main").within(() => {
      cy.get(
        "h1, h2, h3, h4, h5, h6, p, pre, blockquote, div:not(:first-child), dl, dt, dd, td, th, table, caption, hr"
      ).should("have.css", "background-image", "none");
    });
  });
});
