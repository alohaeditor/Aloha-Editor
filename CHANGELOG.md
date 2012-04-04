# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](https://github.com/alohaeditor/Aloha-Editor/wiki/Roadmap)


All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

## 0.21.0 - dev

- **ENHANCEMENT**: block plugin: It is now possible to navigate with arrow keys when there are blocks.
- **ENHANCEMENT**: block plugin: Aloha Block Plugin has now been greatly cleaned up and improved. Besides greatly cleaned up API and documentation, the new features include Drag/Drop, Deletion and Copy/Paste support. Now fully cross-browser (IE7, IE8, IE9, Chrome, Firefox).
- **BUG**: commands.delete: fixed a bug with the delete command when contents are preceded by ignorable whitespace. also added a delete test for that.
- **ENHANCEMENT**: The new plugin dom-to-xhtml attempts to create a valid XHTML serialization of the document when getContents() is called.
- **ENHANCEMENT**: core: The jquery-plugin require plugin will now be able to return loaded plugins. Previously loaded plugins were just accessible through the extended jquery object.
- **ENHANCEMENT**: block plugin: Aloha Block Plugin has now been greatly cleaned up and improved. Besides greatly cleaned up API and documentation, the new features include Drag/Drop, Deletion and Copy/Paste support. Now fully cross-browser (IE7, IE8, IE9, Chrome, Firefox).
- **ENHANCEMENT**: commands.delete: fixed a bug with the delete command when contents are preceded by ignorable whitespace. also added a delete test for that.
- **ENHANCEMENT**: image plugin: splitting main fat file (1500 lines) for easying maintenance and evolutions. The new file which contains the gui is called 'image-floatingMenu.js'. The all sources of the image plugin were jslinted.
- **ENHANCEMENT**: image plugin: abstracting ui calls and removing FloatingMenu dependency from main plugin file
- **BUG**: image plugin: building a selection from scratch when an image is clicked isn't safe as conflictual browser behaviours
- **ENHANCEMENT**: image plugin: new method getImgFocus used in place of findImgMarkup which is pointless now
- **BUG**: image plugin: containing editable not selectable after image plugin activation.
- **BUG**: image plugin: when plugin activated on an image, clicking a second image don't disable resize on first one.
- **BUG**: image plugin: fixing focus and value of srcField when image is clicked (previously handled by selectionChange)
- **ENHANCEMENT**: core: #448 Aloha Editor possibility to be loaded as requireJS module
- **FEATURE**: added hotkey functionality
- **FEATURE**: added Aloha.settings.plugins.load to load plugins also via config
- **BUG**: fixes alohaeditor/Aloha-Editor##424 -- SmartContentChanged is not triggered when hitting
- **BUG**: browser: fixes alohaeditor/Aloha-Editor#415 -- Repositorie entries appears twice in explorer
- **FEATURE**: images browser plugin
- **ENHANCEMENT**: browser: commenting some methods and coding guidelines
- **BUG**: browser: fixes alohaeditor/Aloha-Editor#460 -- Error when multiple repositories are configured
- **BUG** block sidebar attribute editor: when using backspace/del in an input field the block was removed
- **FEATURE** plugin extra/proxy: as multiple plugins need a proxy script to access external resources there's now one for all to use
- **FEATURE** editable.js: introduced method setContents() -- use Aloha.getEditableById('my-editable').setContents('Aloha World') to set the contents of the editable with the ID my-editable
- **FEATURE** editable.js: introduced method setContents() -- use Aloha.getEditableById('my-editable').setContents('Aloha World') to set the contents of the editable with the ID my-editable
- **BUG** smartContentChange is now again triggered when pressing enter key; and new: delete / backspace keys
- **ENHANCEMENT** enabled image plugin in boilerplate demo. needs some enhancements to be more user friendly
- **BUG** align plugin: Fixed alignment behavior and place the buttons in the format tab instead of a new one.
- **FEATURE** hints plugin: Implemented using Tipsy as tooltip library and the latest Aloha-Editor plugin standard.
- **ENHANCEMENT** block plugin: added data-attribute to prevent triggering scope changes when a block is activated
- **ENHANCEMENT** block plugin: revamped colors for highlighting blocks
- **BUG** updated dom.js to reflect HTML5 spec changes; format with u and i tags is now available; updated default button config
- **ENHANCEMENT** config options per editable for plugin common/horizontalruler and extra/toc
- **ENHANCEMENT** configure the sidebar handle position via Aloha.settings.sidebar.handle.top
- **ENHANCEMENT** table plugin: disable split / merge cell buttons when not possible to use
- **ENHANCEMENT** dom-to-xhtml plugin: non-specified attributes are excluded from serialization, making attribute serialization more consistent on IE7 and IE8.
- **FEATURE** API docs: added first version of new API docs
- **FEATURE** HotKey feature added for link, format and wai-lang plugin
- **ENHANCEMENT** load plugins via config option
- **BUG** added missing endprologue. and regenerated guides; jslint for image plugin
- **ENHANCEMENT** Added very simple example for loading Aloha Editor. Simplyfied "Using Aloha Editor" guides page.
- **ENHANCEMENT** adding documentation about Aloha Editor events

## 0.20.7 - 2012/03/7

- **BUG** link: fixed a bug in the link list static repository plugin that would cause aloha to fail when no settings for the linklist repository were specified.
- **BUG** formatlesspaste plugin: fixed IE syntax error caused by a comma at the end of a list.

## 0.20.6 - 2012/03/01

- **BUG** link: fixed a bug in the link list static repository plugin that caused Internet Explorer to fail handling repository links.
- **BUG** dom-to-xhtml plugin: fixed attribute names are not lowercased
- **BUG** floatingmenu: fixed floating menu's reading of configuration values
          so that they are parsed into numbers.
- **BUG** floatingmenu: fixed floating menu positioning when view port is
          scrolled so that it takes into account the aligntopOffset setting.

- **ENHANCEMENT** Added jslint setup to guides and fixed error output in build script.
- **ENHANCEMENT** The new plugin dom-to-xhtml attempts to create a valid XHTML serialization of the document when getContents() is called.
- **BUG** Paste plugin: paste into an editable in an editable is now working
- **BUG** Selection of content in an contenteditable=false which is not a child of an Aloha Editor instance now works like expected
- **ENHANCEMENT** Repositories: It is now possible to configure the timeout for querying repositories.
- **ENHANCEMENT** Floating menu: It is now possible to configure the floating menu to be 'append' to an other element. It is needed to set an extra option 'element' with the ID of the HTML DOM element where the fm should be attach to. The floating menu is attached to the same position as the 'element'.
- **ENHANCEMENT** Floating menu: If the floating menu is set to be not draggable, the drag&drop bar + pin will not be shown
- **BUG** engine.js: insert paragraph was sometimes broken in IE7 (copy of empty/all p-element attributes)
- **ENHANCEMENT** updated plugin: table of contents (toc) to work with the current Aloha Editor version
- **BUG** characterpicker plugin: fixed cursor position after inserting a character
- **ENHANCEMENT** Browser plugin: loading of required jQuery plugins is now changed so all can be loaded via CDN


## 0.20.5 - 2012/02/09

- **ENHANCEMENT** word contenthandler: cleanup for pasted word documents with table of contents
- **BUG** paste plugin: removed trim of pasted contents -- test[ text] + 2x c&p results now in test text text instead of testtexttext
- **BUG** format/table plugin: added a workaround in the format plugin to enable formating of selected cells
- **ENHANCEMENT** cite plugin: config option if sidebar should auto open or not (Aloha.settings.plugins.cite.sidebar.open: true|false)
- **BUG** The link plugin won't use a scope but will now hide/show it's buttons directly.
- **BUG** Fixed the way the table plugin unwrapped it's cell contents when deactivating a table - all dom object references where lost before. Now the objects are truly unwrapped, and just moved up one step within the dom structure.

## 0.20.4 - 2012/01/27

- **BUG** core: fixed IE7 browser crash caused by dereferencing element attributes.
- **BUG** floatingmenu: Fixed positioning of floating menu when it extends
          beyond the width of the viewport


## 0.20.3 - 2012/01/24

- **BUG** floatingmenu: Fixed float position of floatingmenu when it moves
          between editables.
- **BUG** core: Removes ExtJS' IE6 style fixes which break layout in IE9.
- **BUG** image-plugin: The image plugin will now only display the crop buttons
          when the cropping area selection was finished. This avoids a bug in
		  Internet Explorer 7 where the crop area could not be resized once the
		  user entered those crop buttons.
- **BUG** core: Fixed floating menu pinning with topalign behaviour
          (topalignOffset, horizontalOffset)


## 0.20.2 - 2012/01/19

- **BUG** image-plugin: Replaced unicode characters in the crop buttons with
          images to fix display issues within Internet Explorer 7.
- **BUG** core: Fixed problem where Internet Explorer 7 and jquery.store will
          not work with frames since it will fallback to window.name storage.
		  We'll now use a void storage for IE7. This means that IE7 will not be
		  able to store floating menu postion and other settings.
- **BUG** core: Fixed problem of Internet Explorer 7 crashing when invoking
          jQuery's `removeAttr`.
- **BUG** html5shims: Function `getRootParent` in ecma5schims.js no longer
          throws an error when `null` or `undefined` is passed to it.
- **BUG** core: fixed incorrect dependency on jquery.json-2.2 where util/json2
          is needed instead and made it globally available
- **ENHANCEMENT** core: Removed unneeded JSON empty function definition that
                  surpressed errors in IE.
- **ENHANCEMENT** guides: Updated guides. They now include a directory
                  structure explanation and a detailed release guide.
- **ENHANCEMENT** word contenthandler: html cleanup for empty tags, removal of
                  spans and the paragraph numbering from TOC feature.


## 0.20.1 2012/01/13

- **ENHANCEMENT** table-plugin: fixed incorrect repairing of tables (cells were
                  appended to rows containing th elements).


## 0.20.0 2011/12/27

- **ENHANCEMENT** doc/api: added first version of new API docs. Please note
                  that the API docs are currently work in progress.
- **BUG** floatingmenu: fixed a bug with topalign behaviour where scrolling
          would attach the floatingmenu to the left side of the screen.


## 0.20.0-RC9 - 2011/12/07

- **BUG** image-plugin: The saved aspect ratio will now be correcly
          recalculated when a cropping action is sucessfully ended. Previously
		  the aspect ratio was not recalculated and therefore resizing of
		  images resulted in unexpected image sizes.
- **FEATURE** formatlesspaste plugin: The elements stripped by the
              formatlesspaste plugin can now be configured like this

```javascript
	"formatlesspaste" :{
				formatlessPasteOption : true,
				strippedElements : [
				"strong",
				"i",
				"b",
				"u"]
			}
```

- **FEATURE** wai-lang plugin: The styling of the language input field, and
              dropdown suggestion box has been improved.
- **ENHANCEMENT** listenforcer-plugin: The enforce method is now a private
                  function.
- **FEATURE** listenforcer-plugin: List enforcer plugin configuration should
              change

```javascript
	// ... from this:

	"listenforcer" : {
		"editables" : {
			".myselector" : [ "true" ]
		},
		"config" : "false"
	}

	//... to this:

	"listenforcer" : {
		"editables" : [ ".myselector" ]
	}
```

- **FEATURE** listenforcer-plugin: The listenforcer plugin removes any non-list
              top-level elements to ensure that an editable in which lists are
			  enforced will contain exactly one list as the only immediate
			  child of the editable.
- **ENHANCEMENT** some changes in the Browser Plugin (browser.js) to allow
                  multiple, distinguishable instances of browsers on the same
				  page
- **BUG** customizable numerated-header plugin: when header content is deleted,
          the numeration tag will be deleted, too


## 0.20.0-RC8 - 2011/11/22

- **ENHANCEMENT** listenforcer-plugin: The listenforcer plugin was refactored.
                  Method names were changed and the way the plugin works with
				  lists was also changed. It will now no longer replace list
				  dom elments. Instead it will move sibling lists into the
				  first list element within the editable. Previously the whole
				  element was replaced and thus the selection was lost. This
				  caused problems with the floating menu. The user had to click
				  two times into a list to make the floating menu appear since
				  the selection was lost due to dom replacements. This is now
				  fixed.
- **BUG** core: The aloha-editable-activated will now no longer invoked twice.
- **BUG** image-plugin: Fixed handling of width and height when the user
          entered the cropping mode. You can resize the crop area by entering
		  values in the width and height field. 
- **BUG** list-plugin/link-plugin: The list plugin interfered with the link
          plugin behaviour. Previously it was not possible to create links
		  within a list due to a bug within the list plugin. The list plugin
		  will now no longer use the Aloha.List scope.
- **BUG** link-plugin: Fixed problem with auto-suggestion mechanism for the
          link input field causing the the wrong href value to be taken.


## 0.20.0-RC7 - 2011/11

- **BUG** link-plugin: Fixed javascript error that occured when linking items
          using the repository browser in Internet Explorer 8.
- **BUG** boilerplate demo: Fixed javascript error that occured in Internet
          Explorer 8.
- **ENHANCEMENT** flag-icons plugin: It is now necessary to add the flag-icons
                  plugin in the aloha plugin load order before any plugins that
				  need to use the shared flag icons.
- **ENHANCEMENT** metaview-plugin: Fixed metaview plugin to use shared flags
                  icon from flag-icons plugin, for consistancy between plugins.
- **ENHANCEMENT** wai-lang-plugin: Improved wai-lang language selection ui.
                  Organized flags to be in a plugin their own plugin so that
				  the icons can be shared between other components.
- **BUG** link-plugin: The autocomplete list is now closed properly when esc
          was pressed.

## 0.20.0-RC6 - 2011/11

- **BUG** link-plugin/linkbrowser-plugin: Previously the highlight css for a
          link was not removed after an item was selected by the linkbrowser.
		  Now highlight css will be correctly removed and the cursor will be
		  placed back into the content. Previously the selection was lost.
- **BUG** table-plugin: Fixed a bug that deactivated tables after 5 seconds.
          This issue was caused by a failure within the table registry. Instead
		  of loading the cloned object the original table was loaded and
		  deactivated.


## 0.20.0-RC5 - 2011/11

- **BUG** link-plugin: The link plugin will no longer remove repository data
          attributes from the link when the user clicks a link and leaves it
		  imediately. Previously those repository data attributes where removed
		  when the repository lookup was not finished on time (before the user
		  left the link). For the user the repository link was transformed to a
		  normal link. This is now fixed.


## 0.20.0-RC4 - 2011/11

- **BUG** FloatingMenu: The FloatingMenu will now check the
          Aloha.settings.floatingmenu.topalignOffset parameter to be not
		  undefined, as checking for 'number' was too strict


## 0.20.0-RC3 - 2011/11

- **FEATURE** link-plugin: The default behaviour for the link plugin has
              changed. Links with empty hrefs will not be removed automatically
			  any longer - removing the current href has to be confirmed by
			  pressing enter to delete the link itself. Use the unlink button
			  to remove the link directly.


## 0.20.0-RC2 - 2011/11

- **BUG** link-plugin: Fixed bug in link-plugin, which prevented correct
          selection of items from the repository browser when creating a link
		  on a fresh page
- **BUG** browser-plugin: Fixed a bug that prevented the browser plugin to load
          its dependencies correctly.


## 0.20.0-RC1 - 2011/11

- **BUG** link-plugin: Fixed a bug that prevented correct selection of items
          from the repository browser when a new link was created on a fresh
		  loaded page.


## 0.20.0 - 2011/11
- core: Add option for "cls" property to be added to ui-attributefields. cls will be an optional extra CSS class that will be added to this component's Element. This can be useful for adding customized styles to the component or any of its children using standard CSS rules. (http://docs.sencha.com/ext-js/4-0/#!/api/Ext.AbstractComponent-cfg-cls)
- ribbon-plugin: The ribbon will no longer be visible by default. Instead you can use the show function to make it appear.
- image-plugin: The plugin will now use a different method to calculate the width/height when using a fixed aspect ratio.
- core: Fixed floatingmenu to stay visible, if pinned and window is resized.
- core: Added new Method to FloatingMenu: activateTabOfButton(name) will activate the tab containing the button with given name (if tab is visible)
- core: Fixed all plugins to not use FloatingMenu.userActivatedTab, but FloatingMenu.activateTabOfButton instead. This will ensure that switching Tabs will also work, if floatingmenu is configured individually.
	- fixed link-plugin to bind events to links when editables are created. Also bind events to new created links. This ensures that Hotkey CTRL+L to create a new link works, and links can be followed by clicking on them while holding CTRL
	- enforced correct highlighting of selection within the input field
	- fixed handling of external links. Previously it was not possible to change a repository link to an external link.
	- initially clicking on an existing link before the link tab has been rendered would leave you with an empty href field. This is actually an ExtJS issue, which has been workarounded.
	- fixed: autosuggest sometimes left fragments on the screen when closing the autosuggest field early.
- listenforcer-plugin: fixed a bug which would cause an error when activating or deactivating an editable
- listenforcer-plugins: Fixed a possible jquery error within the listforcer plugin. Previously this plugin was not requiring aloha using require.js. This was now corrected. 
- format-plugin: tags removed by the "remove format" button may now be configured by setting Aloha.settings.plugins.format.removeFormats = ['b', 'strong', 'whatever']; The default set of formats to be removed is: 'strong', 'em', 'b', 'i', 'cite', 'q', 'code', 'abbr', 'del', 'sub', 'sup'
- browser-plugin
	- The browser now supports i18n and has better paging support, if the repositories provides meta information (numItems, hasMoreItems)
	- fixed a bug with the paging algorithm when jumping to the last page
- sidebar: The sidebar can now be disabled using the Aloha.settings.sidebar.disabled flag.
- core: added +Aloha.ready( function() {} )+ 
- core: Aloha base url is now auto-detected
- core: Aloha plugins are now loaded in through `data-plugins="format,table"` on the aloha `script` element
	- See demos for more usage information
- core: moved to requireJS
	- Structure overhaul
		- `WebContent` is now `src`
		- `build/out` is now `out`
		- Plugins are now nicely named, and have dropped their ExtJS prefixes. Eg. the format plugin was renamed from 'com.gentics.aloha.plugins.Format' to 'format'. Have a look at the plugin folder for a complete overview of new plugin names.
	- refactored respecting commonJS package structure
	- AMD loading	- Convert Plugins to RequireJS structure	- improved plugin lodaing (lib, css, doc, i18n)	- Major Source Code Structure Refinements	- build		- CSS Bundling & Compression		- JavaScript Bundling & Compression		- The GENTICS namespace has been completely removed from all objects in Aloha Editor's core	- Building overhaul		- Building has moved from Java + Ant to Node.js + Buildr		- Building now runs in seconds instead of minutes, with greater compression ratios		- Building will run strict JSHint code quality tests		- Output is now more consistent with source, demos can remain untouched between using the src and out versions		- JavaScript and CSS files are now bundled into `aloha.js` and `aloha.css`- core: documentation
	- guides for using Aloha Editor
	- JSdoc	
- core: tests
	- added testbox for developer
	- commandAPI test suite
	- improve core tests
	- added plugin API tests
	- added repository API tests
- core: ranslations as JSON files
- core: Support for Opera (>11)
- core: update jQuery to 1.7
- contenthandler-plugin: (for copy/paste)
	- sanitize (configureable HTML elements and attributes)
	- word
	- generic (for html and text)
- core: implemented Aloha.execCommand stack
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
- table-plugin
	- merging and splitting
	- repair tables if they are broken
- list-plugin
	- fixed issues in IE with empty list nodes 
- sidebar-plugin: new 
- image: new
- horizontalruler-plugin: new 
- characterpicker-plugin: new
- undo-plugin: new
- new extra plugins
	- cite
	- headerids
	- metaview
	- wai-lang
	- speak
	- googletranslate
	- Introduced a new plugin that numerates all headers. (e.g. 1. Header1 1.1 Header2 2 Header1 ....)
	- Introduced a new plugin that lets you paste from word without formating. It will strip formatings like bold, italic, ...

- Fixed: the genericcontenthandler caused problems when an editable was initialized

  The genericcontenthandler was enabled by default for the initialization of editables. The genericcontenthandler is too brutal and does more cleanups and conversions than one would normally want. The fix was to remove the genericcontenthandler from the default setting.

  In particular, the conversion from strong tags to b tags (and other tag conversions) is unwanted.

  An issue was created for a replacement of the genericcontenthandler for the initialization of editables:
  https://github.com/alohaeditor/Aloha-Editor/issues/348
  
- FloatingMenu
	The FloatingMenu now accepts the Aloha.settings.floatingmenu.topalignOffset setting, which will define the vertical offset to the editable when the "topalign" behavior is used. The default value is 90px, so if you activate the FloatingMenu's topalign behaviour the FloatingMenu will hover 90px above the currently active editable. Switch it to any meaningful integer offset you prefer.

## 0.10.-0.19.0
The reason for not releasing this builds was the ongoing refactoring of the core engine to implement all functionallities based on execCommand.
Non of these releases reached a production ready state. We still increased the release number due to the fact that we also tested the new release process with maven and archivia and it would brake dependencies if we wouldn't have increased the version number.

## 0.9.3 - October 2010
	- Link/Href handling
	- Repository browser
		- As well as sample Delicious and LinkList Repositories
	- Textarea and $('#myTextarea').aloha() support
	- Table plugin
	- Paste from Microsoft Word
	- Plugins are now submodules
	- Abbreviation plugin
	- LinkChecker plugin
