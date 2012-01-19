# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](http://aloha-editor.org/wiki/Roadmap)

## 0.20.2 - 2012/01/19
- image-plugin: Replaced unicode characters in the crop buttons with images to fix display issues within Internet Explorer 7.
- core: Fixed problem where Internet Explorer 7 and jquery.store will not work with frames since it will fallback to window.name storage. We'll now use a void storage for IE7. This means that IE7 will not be able to store floating menu postion and other settings.
- core: Fixed problem of Internet Explorer 7 crashing when invoking jQuery's `removeAttr`.
- ecma5shims: Function `getRootParent` in ecma5schims.js no longer throws an
              error when `null` or `undefined` is passed to it.
- core: fixed incorrect dependency on jquery.json-2.2 where util/json2 is needed instead and made it globally available
- core: Removed unneeded JSON empty function definition that surpressed errors in IE
- guides: Updated guides. They now include a directory structure explanation and a detailed release guide.

## 0.20.1 2012/01/13

- table-plugin: fixed incorrect repairing of tables (cells were appended to rows containing th elements)

## 0.20.0 2011/12/27

- doc/api: added first version of new API docs. Please note that the API docs are currently work in progress.
- floatingmenu: fixed a bug with topalign behaviour where scrolling would attach the floatingmenu to the left side of the screen

## 0.20.0-RC9 - 2011/12/07

- image-plugin: The saved aspect ratio will now be correcly recalculated when a cropping action is sucessfully ended. Previously the aspect ratio was not recalculated and therefore resizing of images resulted in unexpected image sizes.
- formatlesspaste plugin: The elements stripped by the formatlesspaste plugin can now be configured like this

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

- wai-lang plugin: The styling of the language input field, and dropdown suggestion box has been improved.
- listenforcer-plugin: The enforce method is now a private function.
- listenforcer-plugin: List enforcer plugin configuration should change

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

- listenforcer-plugin: The listenforcer plugin removes any non-list top-level elements to ensure that an editable in which lists are enforced will contain exactly one list as the only immediate child of the editable.
- some changes in the Browser Plugin (browser.js) to allow multiple, distinguishable instances of browsers on the same page
- customizable numerated-header plugin. Fixed issue: when header content is deleted, the numeration tag will be deleted, too

## 0.20.0-RC8 - 2011/11/22

- listenforcer-plugin: The listenforcer plugin was refactored. Method names were changed and the way the plugin works with lists was also changed. It will now no longer replace list dom elments. Instead it will move sibling lists into the first list element within the editable. Previously the whole element was replaced and thus the selection was lost. This caused problems with the floating menu. The user had to click two times into a list to make the floating menu appear since the selection was lost due to dom replacements. This is now fixed.
- core: The aloha-editable-activated will now no longer invoked twice.
- image-plugin: Fixed handling of width and height when the user entered the cropping mode. You can resize the crop area by entering values in the width and height field. 
- list-plugin/link-plugin: The list plugin interfered with the link plugin behaviour. Previously it was not possible to create links within a list due to a bug within the list plugin. The list plugin will now no longer use the Aloha.List scope.
- link-plugin: Fixed problem with auto-suggestion mechanism for the link input field causing the the wrong href value to be taken.

## 0.20.0-RC7 - 2011/11

- link-plugin: Fixed javascript error that occured when linking items using the repository browser in Internet Explorer 8.
- boilerplate demo: Fixed javascript error that occured in Internet Explorer 8.
- flag-icons plugin: It is now necessary to add the flag-icons plugin in the aloha plugin load order before any plugins that need to use the shared flag icons.
- metaview-plugin: Fixed metaview plugin to use shared flags icon from flag-icons plugin, for consistancy between plugins.
- wai-lang-plugin: Improved wai-lang language selection ui. Organized flags to be in a plugin their own plugin so that the icons can be shared between other components.
- link-plugin: The autocomplete list was not closed properly when esc was pressed.

## 0.20.0-RC6 - 2011/11

- link-plugin/linkbrowser-plugin: Previously the highlight css for a link was not removed after an item was selected by the linkbrowser. Now highlight css will be correctly removed and the cursor will be placed back into the content. Previously the selection was lost.
- table-plugin: Fixed a bug that deactivated tables after 5 seconds. This issue was caused by a failure within the table registry. Instead of loading the cloned object the original table was loaded and deactivated.

## 0.20.0-RC5 - 2011/11

- link-plugin: The link plugin will no longer remove repository data attributes from the link when the user clicks a link and leaves it imediately. Previously those repository data attributes where removed when the repository lookup was not finished on time (before the user left the link). For the user the repository link was transformed to a normal link. This is now fixed.


## 0.20.0-RC4 - 2011/11

- FloatingMenu: The FloatingMenu will now check the Aloha.settings.floatingmenu.topalignOffset parameter to be not undefined, as checking for 'number' was too strict

## 0.20.0-RC3 - 2011/11

- link-plugin: The default behaviour for the link plugin has changed. Links with empty hrefs will not be removed automatically any longer - removing the current href has to be confirmed by pressing enter to delete the link itself. Use the unlink button to remove the link directly.

## 0.20.0-RC2 - 2011/11

- link-plugin: Fixed bug in link-plugin, which prevented correct selection of items from the repository browser when creating a link on a fresh page
- browser-plugin: Fixed a bug that prevented the browser plugin to load its dependencies correctly.

## 0.20.0-RC1 - 2011/11

- link-plugin: Fixed a bug that prevented correct selection of items from the repository browser when a new link was created on a fresh loaded page.

## 0.20-BETA - 2011/11
- core: Add option for "cls" property to be added to ui-attributefields. cls will be an optional extra CSS class that will be added to this component's Element. This can be useful for adding customized styles to the component or any of its children using standard CSS rules. (http://docs.sencha.com/ext-js/4-0/#!/api/Ext.AbstractComponent-cfg-cls)
- ribbon-plugin: The ribbon will no longer be visible by default. Instead you can use the show function to make it appear.
- image-plugin: The plugin will now use a different method to calculate the width/height when using a fixed aspect ratio.
- core: Fixed floatingmenu to stay visible, if pinned and window is resized.
- core: Added new Method to FloatingMenu: activateTabOfButton(name) will activate the tab containing the button with given name (if tab is visible)
- core: Fixed all plugins to not use FloatingMenu.userActivatedTab, but FloatingMenu.activateTabOfButton instead. This will ensure that switching Tabs will also work, if floatingmenu is configured individually.
- link-plugin
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
