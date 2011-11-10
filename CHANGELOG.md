# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](http://aloha-editor.org/wiki/Roadmap)

# 0.20.1
- core: Adds option for "cls" property to be added to ui-attributefields.
       cls will be an optional extra CSS class that will be added to this component's Element. This can be useful for adding customized styles to the component or any of its children using standard CSS rules. (http://docs.sencha.com/ext-js/4-0/#!/api/Ext.AbstractComponent-cfg-cls)
	- ribbon-plugin: The ribbon will no longer be visible by default. Instead you can use the show function to make it appear.
	- image-plugin: The plugin will now use a different method to calculate the width/height when using a fixed aspect ratio.
	- core: Fixed floatingmenu to stay visible, if pinned and window is resized.
	- core: Added new Method to FloatingMenu: activateTabOfButton(name) will activate the tab containing the button with given name (if tab is visible)
       Fixed all plugins to not use FloatingMenu.userActivatedTab, but FloatingMenu.activateTabOfButton instead. This will ensure that switching Tabs will also work, if floatingmenu is configured individually.
- link-plugin: Fixed link-plugin to bind events to links when editables are created. Also bind events to new created links. This ensures that Hotkey CTRL+L to create a new link works, and links can be followed by clicking on them while holding CTRL
    - link-plugin: Fixed handling of external links. Previously it was not possible to change a repository link to an external link.
- listenforcer-plugin: fixed a bug which would cause an error when activating or deactivating an editable
- format-plugin: tags removed by the "remove format" button may now be configured by setting Aloha.settings.plugins.format.removeFormats = ['b', 'strong', 'whatever']; The default set of formats to be removed is: 'strong', 'em', 'b', 'i', 'cite', 'q', 'code', 'abbr', 'del', 'sub', 'sup'
- browser-plugin: The browser now supports i18n and has better paging support, if the repositories provides meta information (numItems, hasMoreItems)

# 0.20.0 - 2011/11/XX

- moved to requireJS
	- refactored respecting commonJS package structure
	- AMD loading
	- Convert Plugins to RequireJS structure
	- improved plugin lodaing (lib, css, doc, i18n)
	- Major Source Code Structure Refinements
	- CSS Bundling & Compression
	- JavaScript Bundling & Compression
- Documentation
	- guides for using Aloha Editor
	- JSdoc	
- tests
	- added testbox for developer
	- commandAPI test suite
	- improve core tests
	- added plugin API tests
	- added repository API tests
- Translations as JSON files
- Support for Opera (>11)
- update jQuery to 1.7
- contenthandler (for copy/paste)
	- sanitize (configureable HTML elements and attributes)
	- word
	- generic (for html and text)
- Implement Aloha.execCommand stack
	- Bold
	- Delete
	- ForwardDelete
	- InsertParagraph
	- InsertLineBreak
	- InsertHTML
	- InsertOrderedList
	- InsertUnorderedList
	- Indent
	- Outdent
- updated plugins
	- tables
		- merging and splitting
		- repair tables if they are broken
	- lists
		- fixed issues in IE with empty list nodes 
- new common plugins
	- sidebar
	- image
	- horizontal ruler
	- character picker
	- undo
- new extra plugins
	- cite
	- headerids
	- metaview
	- wai-lang
	- speak
	- googletranslate


# 0.10.-0.19.0

The reason for not releasing this builds was the ongoing refactoring of the core engine to implement all functionallities based on execCommand.
Non of these releases reached a production ready state. We still increased the release number due to the fact that we also tested the new release process with maven and archivia and it would brake dependencies if we wouldn't have increased the version number.

# 0.9.3 - 2010/10

- Link/Href Handling
- Repositories
	- Delicious repository 
	- LinkList repository
- Textarea and `$('#myTextarea').aloha()` Support
- Plugins are now SubModules
- new plugins
- MS Word pastehandler
	- Table
	- Abbreviation
	- LinkChecker Plugin

### 0.20


