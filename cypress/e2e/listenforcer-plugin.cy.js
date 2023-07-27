describe("List Enforcer Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/listenforcer-plugin-testing");
  });

  describe("transforms editable content:", () => {
    it("if there are no lists, one is added", () => {
      cy.get("#test1").children().should("not.exist");
      cy.get("#test1").click().find("ul").should("exist");
    });
    it("if there is more than one list, they are merged into the first list", () => {
      cy.get("#test2").children().should("have.length", "3");
      cy.get("#test2").click().children().should("have.length", "1");
      cy.get("#test2").find("li").should("have.length", "8");
    });
    it("if there is any other content in the editable it will be removed", () => {
      cy.get("#test3").children().should("have.length", "2");
      cy.get("#test3").click().children().should("have.length", "1");
      cy.get("#test3").find("p").should("not.exist");
    });
  });
});
