describe("Table plugin", () => {
  beforeEach(() => {
    cy.visit("http://localhost:8080/demo/modules/table.html");
    cy.get("#main").click();
  });
  it("opens Aloha Editor UI when clicked", () => {
    cy.get("#ui-id-2").click();
    cy.get(".aloha-ui.aloha-ui-toolbar.ui-draggable").should("exist");
  });

  describe("Create or delete table", () => {
    it('creates "Insert table" button on Insert tab that inserts a new table', () => {
      cy.get("#ui-id-2").click();
      cy.get(".aloha-icon-createTable").should("exist");
    });

    beforeEach(() => {
      createTable();
    });

    it('creates "Delete Table" button when a table is selected that deletes it upon confirmation', () => {
      cy.get("table").find(".aloha-wai-red").click();
      cy.get("#tab-ui-container-8").find(".aloha-icon-deletetable").click();
      cy.get(".ui-dialog-buttons")
        .should("exist")
        .contains("span", "No")
        .click();
      cy.get("#main").find("tbody").should("exist");
      cy.get("#tab-ui-container-8").find(".aloha-icon-deletetable").click();
      cy.get(".ui-dialog-buttons").contains("span", "Yes").click();
      cy.get("#main").find("tbody").should("not.exist");
    });

    it('creates a "Table" tab when clicked on a table', () => {
      cy.get("table").find(".aloha-wai-red").click();
      cy.get("#ui-id-8").should("be.visible");
    });

    it('creates a "Table Row" tab when clicked on a table row', () => {
      cy.get(".aloha-table-selectrow.aloha-ephemera").first().click();
      cy.get("#ui-id-10").should("be.visible");
    });

    it('creates a "Table Column" tab when clicked on a table column', () => {
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(1)
        .click();
      cy.get("#ui-id-9").should("be.visible");
    });
  });

  describe("Cells management", () => {
    beforeEach(() => {
      createTable();
      mergeCells();
    });
    it('creates "Merge Cells" button when two or more cells are selected that should merge them', () => {
      countCells(34);
    });
    it('creates "Split Cells" button when a cell is selected that should split it', () => {
      cy.get("#tab-ui-container-8")
        .find(
          ".ui-button-icon-primary.ui-icon.aloha-icon.aloha-icon-splitcells"
        )
        .click();
      countCells(42);
    });
  });

  describe("Table caption and name", () => {
    beforeEach(() => {
      createTable();
    });

    it('creates a "Table caption" button that toggles an editable caption tag that saves its info', () => {
      cy.get("table").find(".aloha-wai-red").click();
      cy.get("#tab-ui-container-8").find(".aloha-icon-table-caption").click();
      cy.get(".aloha-editable-caption")
        .should("exist")
        .type("This is a caption display");

      cy.get("#tab-ui-container-8").find(".aloha-icon-table-caption").click();
      cy.get(".aloha-editable-caption").should("not.be.visible");
      cy.get("#tab-ui-container-8").find(".aloha-icon-table-caption").click();
      cy.get(".aloha-editable-caption").should(
        "contain",
        "This is a caption display"
      );
    });

    it("creates an input to name the table on the Table tab, it should change the WAI icon from red to green", () => {
      cy.get("table").find(".aloha-wai-red").click();
      cy.get("#aloha-attribute-field-tableSummary")
        .should("exist")
        .type("This is the table name");
      cy.get("table")
        .invoke("attr", "summary")
        .should("equal", "This is the table name");
      cy.get("tbody")
        .find("tr")
        .first()
        .find("td")
        .first()
        .find("div")
        .invoke("attr", "class")
        .should("equal", "aloha-wai-green");
    });
  });

  describe("Columns and rows management", () => {
    beforeEach(() => {
      createTable();
    });

    it('creates "Add Column left" button that creates a new column to the left of the selected one', () => {
      createTestReference();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(1)
        .click();
      cy.get("#tab-ui-container-9").within(() => {
        cy.get("span").contains("Add Column left").click();
      });
      countCells(48);
      cy.get("tbody")
        .find("tr")
        .eq(2)
        .find("td")
        .eq(2)
        .find("div")
        .should("contain", "Test");
    });

    it('creates "Add Column right" button that creates a new column to the right of the selected one', () => {
      createTestReference();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(1)
        .click();
      cy.get("#tab-ui-container-9").within(() => {
        cy.get("span").contains("Add Column right").click();
      });
      countCells(48);
      cy.get("tbody")
        .find("tr")
        .eq(3)
        .find("td")
        .eq(3)
        .find("div")
        .should("contain", "Test");
    });

    it('creates "Add Row before" button that creates a new row before the selected one', () => {
      createTestReference();
      cy.get(".aloha-table-selectrow.aloha-ephemera").eq(1).click();
      cy.get("#tab-ui-container-10").within(() => {
        cy.get("span").contains("Add Row before").click();
      });
      countCells(49);
      cy.get("tbody")
        .find("tr")
        .eq(3)
        .find("td")
        .eq(1)
        .find("div")
        .should("contain", "Test");
    });

    it('creates "Add Row after" button that creates a new row after the selected one', () => {
      createTestReference();
      cy.get(".aloha-table-selectrow.aloha-ephemera").eq(1).click();
      cy.get("#tab-ui-container-10").within(() => {
        cy.get("span").contains("Add Row after").click();
      });
      countCells(49);
      cy.get("tbody")
        .find("tr")
        .eq(4)
        .find("td")
        .eq(2)
        .find("div")
        .should("contain", "Test");
    });

    it('creates "Delete Rows" button when one or more rows are selected that deletes them upon confirmation', () => {
      createTestReference();
      cy.get(".aloha-table-selectrow.aloha-ephemera").eq(2).click();
      cy.get(".aloha-table-selectrow.aloha-ephemera")
        .eq(3)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-10").within(() => {
        cy.get("span").contains("Delete Rows").click();
      });
      cy.get(".ui-dialog-buttons")
        .should("exist")
        .contains("span", "No")
        .click();
      countCells(42);
      cy.get("span").contains("Delete Rows").click();
      cy.get(".ui-dialog-buttons").contains("span", "Yes").click();
      countCells(28);
      cy.get("tbody")
        .find("tr")
        .eq(3)
        .find("td")
        .eq(2)
        .find("div")
        .should("not.contain", "Test");
    });

    it('creates "Delete Columns" button when one or more columns are selected that deletes them upon confirmation', () => {
      createTestReference();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(2)
        .click();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(3)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-9").within(() => {
        cy.get("span").contains("Delete Columns").click();
      });
      cy.get(".ui-dialog-buttons")
        .should("exist")
        .contains("span", "No")
        .click();
      countCells(42);
      cy.get("span").contains("Delete Columns").click();
      cy.get(".ui-dialog-buttons").contains("span", "Yes").click();
      countCells(30);
      cy.get("tbody")
        .find("tr")
        .eq(3)
        .find("td")
        .eq(2)
        .find("div")
        .should("not.contain", "Test");
    });

    it('creates "Format row at table header" button when one or more rows are selected that toggles them as headers', () => {
      cy.get(".aloha-table-selectrow.aloha-ephemera").eq(0).click();
      cy.get(".aloha-table-selectrow.aloha-ephemera")
        .eq(1)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-10").within(() => {
        cy.get("span").contains("Format row as table header").click();
      });
      countCells(30);
      cy.get("tbody").find("tr").eq(2).find("th").should("length", 6);
      cy.get(".aloha-table-selectrow.aloha-ephemera").eq(0).click();
      cy.get(".aloha-table-selectrow.aloha-ephemera")
        .eq(1)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-10").within(() => {
        cy.get("span").contains("Format row as table header").click();
      });
      countCells(42);
    });

    it('creates "Format column at table header" button when one or more columns are selected that toggles them as headers', () => {
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(1)
        .click();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(2)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-9").within(() => {
        cy.get("span").contains("Format column as table header").click();
      });
      countCells(32);
      cy.get("tbody").find("tr").eq(5).find("th").should("length", 2);
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(1)
        .click();
      cy.get(".aloha-table-selectcolumn.aloha-ephemera")
        .find("td")
        .eq(2)
        .click({ shiftKey: true });
      cy.get("#tab-ui-container-9").within(() => {
        cy.get("span").contains("Format column as table header").click();
      });
      countCells(42);
    });
  });
});

/*---------------------------------------------------------------------------------------------*/

function createTable() {
  cy.get("#ui-id-2").click();
  cy.get(".aloha-icon-createTable").click();
  cy.get(".aloha-table-createdialog table").within(() => {
    cy.get("tr").eq(4).find("td").eq(5).click();
  });
  cy.get("h1").click();
}

function mergeCells() {
  cy.get("#main")
    .find("tbody")
    .within(() => {
      cy.get("tr").eq(2).find("td").eq(3).click();
      cy.get("tr").eq(4).find("td").eq(5).click({
        shiftKey: true,
      });
    });
  cy.get("#tab-ui-container-8")
    .find(".ui-button-icon-primary.ui-icon.aloha-icon.aloha-icon-mergecells")
    .click();
}

function createTestReference() {
  cy.get("tbody")
    .find("tr")
    .eq(2)
    .find("td")
    .eq(1)
    .find("div")
    .type("Test", { force: true, delay: 0 });
  cy.get("tbody")
    .find("tr")
    .eq(3)
    .find("td")
    .eq(2)
    .find("div")
    .type("Test", { force: true, delay: 0 });
}

function countCells(num) {
  cy.get("#main")
    .find("tbody")
    .then((tbody) => {
      const cells = tbody.find("td");
      expect(cells).to.have.length(num);
    });
}
