describe("Emptylink Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/emptylink-plugin-testing");
  });

  it('changes the background-color when a <a> tag does not have an "href" attribute', () => {
    cy.get("#linkWithNoHref").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)"
    );
  });
  it('changes the background-color when a <a> tag has an href\'s value equal to "#"', () => {
    cy.get("#linkWithHash").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)"
    );
  });
  it('changes the background-color when a <a> tag has an incomplete "href" attribute', () => {
    cy.get("#linkIncomplete").should(
      "have.css",
      "background-color",
      "rgb(255, 0, 0)"
    );
  });

  it("doesn't change other <a> elements", () => {
    cy.get("#linkWithHref").should(
      "not.have.css",
      "background-color",
      "rgb(255, 0, 0)"
    );
  });
});
