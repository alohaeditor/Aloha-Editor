# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](http://aloha-editor.org/wiki/Roadmap)

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