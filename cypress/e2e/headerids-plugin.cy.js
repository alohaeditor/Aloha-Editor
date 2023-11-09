describe("Header Ids Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/headerids.html");
    cy.get(".aloha-sidebar-handle").eq(1).click();
    cy.get("h3").click();
  });

  it("gives all headers an id composed with its value", () => {
    cy.get("h1").should("have.id", "heading_This_is_1st_level_heading");
    cy.get("h2").should("have.id", "heading_This_is_2nd_level_heading");
    cy.get("h3").should("have.id", "heading_This_is_3rd_level_heading");
    cy.get("h4").should("have.id", "heading_This_is_4th_level_heading");
    cy.get("h5").should("have.id", "heading_This_is_5th_level_heading");
    cy.get("h6").should("have.id", "heading_This_is_6th_level_heading");
  });

  it("creates an input in the sidebar to change the id when a header is clicked", () => {
    cy.get("#aloha-headerids-input").clear().type("This is the new id");
    cy.get("button").contains("Set").click();
    cy.get("h3").should("have.id", "This_is_the_new_id");
  });

  it('creates a "Reset" button to return the id to its default setting', () => {
    cy.get("#aloha-headerids-input").clear().type("This is the new id");
    cy.get("button").contains("Set").click();
    cy.get("button").contains("Reset").should("be.visible").click();
    cy.get("h3").should("have.id", "heading_This_is_3rd_level_heading");
  });
});
