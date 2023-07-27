describe("Image Plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/image.html");
    cy.get("h1").click();
    cy.get("img").click();
  });

  it("opens Aloha Editor UI when clicked", () => {
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  it("Image tab appears in the UI", () => {
    cy.get("#ui-id-5").should("exist");
  });

  describe("has a source mechanic", () => {
    it("creates a source input", () => {
      cy.get("#aloha-attribute-field-imageSource").should("exist");
    });
    it("fills the input with the current image's src value", () => {
      cy.get("img")
        .invoke("attr", "src")
        .then((imgSrc) =>
          cy
            .get("#aloha-attribute-field-imageSource")
            .invoke("val")
            .should("equals", imgSrc)
        );
    });
    it("changes the image when the source changes", () => {
      cy.get("#aloha-attribute-field-imageSource")
        .clear()
        .type("https://placehold.co/400x600/000000/FFF");

      cy.get("img")
        .invoke("attr", "src")
        .then((imgSrc) =>
          cy
            .get("#aloha-attribute-field-imageSource")
            .invoke("val")
            .should("equals", imgSrc)
        );
    });
  });
  describe("has a title mechanic", () => {
    it("creates a title input", () => {
      cy.get("#aloha-attribute-field-imageTitle").should("exist");
    });
    it("changes the image's title attribute when the title changes", () => {
      cy.get("#aloha-attribute-field-imageTitle").type(
        "This is a title for the image"
      );
      cy.get("img")
        .invoke("attr", "title")
        .then((imgTitle) =>
          cy
            .get("#aloha-attribute-field-imageTitle")
            .invoke("val")
            .should("equals", imgTitle)
        );
    });
  });
  describe("has a width/height mechanic", () => {
    it("creates width and height inputs", () => {
      cy.get("#aloha-attribute-field-imageResizeWidth").should("exist");
      cy.get("#aloha-attribute-field-imageResizeHeight").should("exist");
    });
    it("fills the inputs with the current image's width and height", () => {
      cy.get("#aloha-attribute-field-imageResizeWidth")
        .invoke("val")
        .then((width) =>
          cy.get("img").should("have.css", "width", width + "px")
        );
      cy.get("#aloha-attribute-field-imageResizeHeight")
        .invoke("val")
        .then((height) =>
          cy.get("img").should("have.css", "height", height + "px")
        );
    });
    it("changes the image's size when the inputs change", () => {
      cy.get("#aloha-attribute-field-imageResizeWidth").clear().type("300");
      cy.get("#aloha-attribute-field-imageResizeHeight").clear().type("500");
      cy.get("img").should("have.css", "width", "300px");
      cy.get("img").should("have.css", "height", "500px");
    });
    it("doesn't change the image's size when the inputs are 0", () => {
      cy.get("#aloha-attribute-field-imageResizeWidth").clear().type("0");
      cy.get("#aloha-attribute-field-imageResizeHeight").clear().type("0");
      cy.get("img").should("not.have.css", "width", "0px");
      cy.get("img").should("not.have.css", "height", "0px");
    });
  });
  describe("has an align mechanic", () => {
    it("creates left, right and no alignement buttons", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Left align").should("exist");
        cy.get("span").contains("Right Align").should("exist");
        cy.get("span").contains("No alignment").should("exist");
      });
    });
    it("change the image float property when clicked on", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Left align").click();
      });
      cy.get("img").should("have.css", "float", "left");
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Right Align").click();
      });
      cy.get("img").should("have.css", "float", "right");
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("No alignment").click();
      });
      cy.get("img").should("have.css", "float", "none");
    });
  });
  describe("has a padding mechanic", () => {
    it("creates padding.increase and padding.decrease buttons", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("padding.increase").should("exist");
        cy.get("span").contains("padding.decrease").should("exist");
      });
    });
    it("increases/decreases the padding by 1px when clicked on", () => {
      cy.get("span")
        .contains("padding.increase")
        .click()
        .click()
        .click()
        .click();
      cy.get("img").should("have.css", "padding", "4px");
      cy.get("span").contains("padding.decrease").click().click();
      cy.get("img").should("have.css", "padding", "2px");
    });
  });
  describe("has an aspect ration mechanic", () => {
    it("creates a Toggle aspect ratio button", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Toggle keep aspect ratio").should("exist");
      });
    });
    it("changes the image's height to mantain ratio when the width input changes", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Toggle keep aspect ratio").click();
      });
      cy.get("#aloha-attribute-field-imageResizeWidth").clear().type("300");

      cy.get("img").should("have.css", "height", "450px");
    });
    it("changes the image's width to mantain ratio when the height input changes", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Toggle keep aspect ratio").click();
      });
      cy.get("#aloha-attribute-field-imageResizeHeight").clear().type("450");

      cy.get("img").should("have.css", "width", "300px");
    });
  });
  describe("has a reset reset mechanic", () => {
    it("creates a reset button", () => {
      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Reset").should("exist");
      });
    });
    it("returns image's original size when clicked on", () => {
      cy.get("#aloha-attribute-field-imageResizeWidth").clear().type("700");
      cy.get("#aloha-attribute-field-imageResizeHeight").clear().type("1500");

      cy.get("#tab-ui-container-5").within(() => {
        cy.get("span").contains("Reset").click();
      });
      cy.get("img").should("have.css", "height", "600px");
      cy.get("img").should("have.css", "width", "400px");
    });
  });
});
