describe('link plugin - link target', () => {

    const URL = 'http://localhost:8080/demo/modules/link.html'

    /**
     * Visits the demo page, activates the editable and yields the link plugin module.
     */
    function loadLinkPlugin() {
        cy.visit(URL)
        // Wait until Aloha (with the ui + link plugins) has initialised the editable;
        // a click before that is lost and the editable never becomes active.
        cy.get('#content.aloha-editable').click().should('have.class', 'aloha-editable-active')

        return cy.window().then((win) => win.Aloha.require('link/link-plugin'))
    }

    /**
     * Appends an existing link to the editable and returns its DOM element.
     */
    function appendLink(win, attributes) {
        const link = win.document.createElement('a')
        Object.keys(attributes).forEach((name) => link.setAttribute(name, attributes[name]))
        link.textContent = 'existing link'
        win.document.querySelector('#content p').appendChild(link)
        return link
    }

    it('offers an empty target as the first option of the target select', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            const options = LinkPlugin.createInsertLinkContext().controls.target.options.options

            expect(options.map((option) => option.id)).to.deep.equal(
                ['', '_self', '_blank', '_parent', '_top', '_unfencedTop']
            )
        })
    })

    it('shows a translated label for the empty target option', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            const emptyOption = LinkPlugin.createInsertLinkContext().controls.target.options.options
                .find((option) => option.id === '')

            expect(emptyOption.label).to.be.a('string').and.not.be.empty
            expect(emptyOption.label).not.to.equal('link.target.none')
        })
    })

    it('preselects the empty target option when editing a link without target', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            cy.window().then((win) => {
                const link = appendLink(win, { href: 'https://example.com' })
                const context = LinkPlugin.createInsertLinkContext(link)
                const optionIds = context.controls.target.options.options.map((option) => option.id)

                expect(context.initialValue.target).to.equal('')
                expect(optionIds).to.include(context.initialValue.target)
            })
        })
    })

    it('removes the target attribute when an existing link is saved with the empty target', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            cy.window().then((win) => {
                const link = appendLink(win, { href: 'https://example.com', target: '_blank' })

                LinkPlugin.upsertLink(link, {
                    url: { target: 'https://example.com', anchor: '' },
                    target: '',
                })

                expect(link.getAttribute('href')).to.equal('https://example.com')
                expect(link.hasAttribute('target')).to.equal(false)
            })
        })
    })

    it('keeps setting a non-empty target on an existing link', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            cy.window().then((win) => {
                const link = appendLink(win, { href: 'https://example.com' })

                LinkPlugin.upsertLink(link, {
                    url: { target: 'https://example.com', anchor: '' },
                    target: '_blank',
                })

                expect(link.getAttribute('target')).to.equal('_blank')
            })
        })
    })

    it('does not add a target attribute when a new link is inserted with the empty target', () => {
        loadLinkPlugin().then((LinkPlugin) => {
            const newLink = LinkPlugin.upsertLink(null, {
                url: { target: 'https://example.com', anchor: '' },
                target: '',
            })

            expect(newLink, 'inserted link').to.exist
            expect(newLink.getAttribute('href')).to.equal('https://example.com')
            expect(newLink.hasAttribute('target')).to.equal(false)
        })
    })
})
