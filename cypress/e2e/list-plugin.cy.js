describe('list plugin', () => {

    const URL = 'http://localhost:8080/demo/modules/list.html'

    it('Verify the existence of the "Insert Ordered List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()
      
        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Ordered List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.visible');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.visible');
          
        cy.get('div.aloha-ui-menubutton-container[title="Insert Ordered List"]')
        .find('button.aloha-ui-menubutton-expand')
        .click()
        cy.get('ul#ui-id-16').should('exist').should('be.visible');
    });

    it('Verify the existence of the "Insert Unordered List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()

        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Unordered List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.visible');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.visible');
        
        cy.get('div.aloha-ui-menubutton-container[title="Insert Unordered List"]')
          .find('button.aloha-ui-menubutton-expand')
          .click()
          cy.get('ul#ui-id-24').should('exist').should('be.visible');
    });

    it('Verify the existence of the "Insert Definition List" button', () => {
        cy.visit(URL)
      
        cy.get('#content').click()

        cy.get('div.aloha-ui-component-group').should('exist').should('be.visible')
          .find('div.aloha-ui-menubutton-container[title="Insert Definition List"]').should('exist')
          .find('button.aloha-ui-menubutton-action')
          .click()
          cy.contains('button', 'Increase Indent').should('exist').should('be.hidden');
          cy.contains('button', 'Decrease Indent').should('exist').should('be.hidden');

        cy.get('div.aloha-ui-menubutton-container[title="Insert Definition List"]').should('exist')
          .find('button.aloha-ui-menubutton-expand')
          .click()
          cy.get('ul#ui-id-12').should('exist').should('be.visible');
    });

    it('Verify the functionality of the "Insert Ordered List" button', () => {
          let clickAndCheckClass = function(id, cssClass) {
              cy.get('div.aloha-ui-menubutton-container[title="Insert Ordered List"]')
                .find('button.aloha-ui-menubutton-expand')
                .click();
            
              cy.get('#ui-id-' + id)
                .click();
              cy.get('#content ol').should('have.class', cssClass);
            }

        cy.visit(URL)
        cy.get('#content').click()
      
        cy.get('#content p').each(($p) => {
          cy.wrap($p).type('{selectall}').then(() => {
            cy.get('div.aloha-ui-menubutton-container[title="Insert Ordered List"]')
              .find('button.aloha-ui-menubutton-action')
              .click();
          });
        });
        cy.get('#content').should('have.descendants', 'ol')
        cy.get('#content ol').children().should('have.prop', 'tagName').should('eq', 'LI')
      
        cy.get('#content ol li')
          .then(($lis) => {
            const originalOrder = $lis.map((i, el) => Cypress.$(el).text()).get()
            const sortedOrder = originalOrder.slice().sort()
            expect(originalOrder, 'Items are in order').to.deep.equal(sortedOrder)
          })
      
        cy.contains('button', 'Increase Indent').click();
        cy.get('#content li').should('have.descendants', 'ol');
      
        cy.contains('button', 'Decrease Indent').click();
        cy.get('#content li').should('not.have.descendants', 'ol');
      
        let listItems = [
          {id: 17, cssClass: 'aloha-list-decimal'},
          {id: 18, cssClass: 'aloha-list-decimal-leading-zero'},
          {id: 19, cssClass: 'aloha-list-lower-roman'},
          {id: 20, cssClass: 'aloha-list-upper-roman'},
          {id: 21, cssClass: 'aloha-list-lower-greek'},
          {id: 22, cssClass: 'aloha-list-lower-latin'},
          {id: 23, cssClass: 'aloha-list-upper-latin'}
        ]
      
        for (let item of listItems) {
          clickAndCheckClass(item.id, item.cssClass);
        }
      });
      
    it('Verify the functionality of the "Insert Unordered List" button', () => {
      let clickAndCheckClass = function(id, cssClass) {
        cy.get('div.aloha-ui-menubutton-container[title="Insert Unordered List"]')
          .find('button.aloha-ui-menubutton-expand')
          .click();
      
        cy.get('#ui-id-' + id)
          .click();
        cy.get('#content ul').should('have.class', cssClass);
      }

        cy.visit(URL)
        cy.get('#content').click()

        cy.get('#content p').each(($p) => {
            cy.wrap($p).type('{selectall}').then(() => {
              cy.get('div.aloha-ui-menubutton-container[title="Insert Unordered List"]')
                .find('button.aloha-ui-menubutton-action')
                .click();
            });
        });
        cy.get('#content').should('have.descendants', 'ul')

        cy.contains('button', 'Increase Indent').click();
        cy.get('#content li').should('have.descendants', 'ul');

        cy.contains('button', 'Decrease Indent').click();
        cy.get('#content li').should('not.have.descendants', 'ul');

        let listItems = [
          {id: 25, cssClass: 'aloha-list-disc'},
          {id: 26, cssClass: 'aloha-list-circle'},
          {id: 27, cssClass: 'aloha-list-square'},
        ]
      
        for (let item of listItems) {
          clickAndCheckClass(item.id, item.cssClass);
        }
    });

    it('Verify the functionality of the "Insert Definition List" button', () => {
      let clickAndCheckClass = function(id, cssClass) {
        cy.get('div.aloha-ui-menubutton-container[title="Insert Definition List"]')
          .find('button.aloha-ui-menubutton-expand')
          .click();
      
        cy.get('#ui-id-' + id)
          .click();
        cy.get('#content dl').should('have.class', cssClass);
      }

        cy.visit(URL)
        cy.get('#content').click()

        cy.get('#content p').each(($p) => {
            cy.wrap($p).type('{selectall}').then(() => {
              cy.get('div.aloha-ui-menubutton-container[title="Insert Definition List"]')
                .find('button.aloha-ui-menubutton-action')
                .click();
            });
        });
        cy.get('#content').should('have.descendants', 'dt')

        let listItems = [
          {id: 13, cssClass: 'alohafocus aloha-list-blue'},
          {id: 14, cssClass: 'alohafocus aloha-list-green'},
          {id: 15, cssClass: 'alohafocus aloha-list-red'},
        ]

        for (let item of listItems) {
          clickAndCheckClass(item.id, item.cssClass);
        }
    });
})
   