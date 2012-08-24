# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap]
(http://aloha-editor.org/wiki/Roadmap).

All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **MANUAL CHANGE**: The change requires changes to existing implementation.

# 0.20.x

## 0.20.23 - 2012/08/24

- **ENHANCEMENT**: changed loading procedure of languages in wai lang plugin from AJAX to require.js
- **BUG**: resolved issue with opening the sidebar when clicking on table WAI button.

## 0.20.22 - 2012/08/16

- **ENHANCEMENT**: link-plugin: Removed unwanted margins from the sidebar panel of the link attribute.
- **BUG**: Fixed block formatting (p, h1, ...)

    To reproduce the error

    * insert two paragraphs into an editable

    "
    Paragraph1
    Paragraph2
    "

    * select both paragraphs and format them as h2
    * click into the second paragraph and format as h3

    The result before this fix would have been that in the last step both
    paragraphs were formatted as h3.

- **BUG**: core: We now also remove jquery* attributes before the content is saved.
- **BUG**: core: We now log a warning to the console if repositories run into timeouts.
- **BUG**: wai-lang: We now load the language dataset in the query method. This fixes the issue that if the first request went wrong it was never loaded again.
- **BUG**: sidebar: The sidebar now remembers the current selection and refreshes itself when it is being opened.
- **BUG**: wordcontenthandler: Fixed the pasting of tables with empty cells.
- **BUG**: wordcontenthandler: Fixed the pasting of lists in chrome and IE9.


## 0.20.21 - 2012/08/06

- **MANUAL CHANGE**: Changed the aloha-smart-content-changed event

    The snapshotContent property provided bythe
    aloha-smart-content-changed event was replaced with the
    getSnapshotContent property which is a function that must be
    called to retrieve the value that was provided by snapshotContent.

    This was done to make snapshotting of the editable contents
    optional, since it is a very expensive operation.

- **ENHANCEMENT**: numerated-headers-plugin: Added a &nbsp to the annotation, to seperate it from the heading's text.

- **ENHANCEMENT**: table-plugin: We now show the summary textarea in the sidebar if a click on the wai-image was issued.

- **BUG**: Fixed IE7 mode paragraph margin

    The problem is that with a DOM like the following:

    ```html
    <style>p { margin-top: 2em; }</style>
    <p><br class='aloha-end-br'/></p>
    <p></p>
    ```

    The margin between the paragraphs will not take effect because
    IE8 in compatibility mode considers the paragraph with the ```<br>```
    in it empty. Normal IE8 will render the margin.

    To make IE8 in compatibility mode render the margin, some content
    must be put into the ```<p>```. That is not a big problem, since there
    usually should be no reason to have empty paragraphs in your
    content.

    However, if the content is entered by hand (if it is not there to
    begin with) then the margin will not be immediately updated. Only
    when, after entering some content into the first paragraph, the
    selection is put into the second paragraph, will the margin be
    updated.

    Although I don't see an easy workaround for the first problem
    (that the margin is not displayed when the paragraph is empty)
    there is an easy workaround for the second problem (that the
    margin isn't updated even after some content has been
    entered). The workaround is simply, when some content is entered,
    to insert and remove an arbitrary DOM node into the second
    paragraph, which will force IE to re-render the paragraph.

    Problem was verified to exist on IE7 and IE8 in compatibility
    mode with IE7 document type. May also exist in other IE7 modes.

- **BUG**: Fixed some random and weird selection problems in IE7, where some
	actions (like Enter behaviour) were not performed on the correct cursor
	position. Sometimes there also occurred some JS errors.
	
- **BUG**: Fixed Transforming an empty contenteditable into a list, which
	caused the contenteditable container to disappear.

- **BUG**: headerids-plugin: Fixed a bug in the headerids plugin that the ids were not generated when the getContents was called.

- **BUG**: numerated-headers-plugin: Fixed a bug in the numerated-headers plugin, that the selection was not properly updated when the annotations were removed.

- **BUG**: core: Fixed that sanitizing was not executed for IE7 because of an error with modifying style attributes in IE7. We now execute sanitizing, but ignore style attributes.

- **BUG**: core: Added the removal of sizzle attributes to the basic content handler.

- **BUG**: core: We now catch an exception that is thrown when the selection is not properly updated. This exception would lead to unexpected behaviour.

- **BUG**: core&numerated-headers-plugin: Fixed that sometimes DOM INDEX EXCEPTIONS occured when formating a list of paragraphs.


## 0.20.20 - 2012/07/25

- **BUG**: core: An Internet Explorer 7 crash fix was fixed. Previously the fix caused the whole content to be selected for a short period of time when appling inline format elements.
- **BUG**: core: An issue that resize handles were displayed on inline elements that contained a new lines in IE7/8 was fixed. 

## 0.20.19 - 2012/07/25

- **BUG**: cite-plugin: Removal of a cite specific data attribute caused a crash in Native Internet Explorer 7. The removal will now be skipped for Native Internet Explorer 7.

## 0.20.18 - 2012/07/25

- **ENHANCEMENT**: cite-plugin: Fixed cite plugin DOM element attributes. It is not needed to add attributes to blockquote and q tags unless you have defined a referencecontainer.
- **ENHANCEMENT**: contenthandler: Modified contenthandlers to allow language annotations made by the wai-lang plugin. This enables copy & paste of language annotations.
- **ENHANCEMENT**: list-plugin: Some internet explorer specific attributes (hidefocus, tabindex) will now be removed on makeClean.
- **ENHANCEMENT**: wai-lang-plugin: The plugin now supports both ISO-639-1 (two letter) and ISO-639-2 (three letter) language codes. The languages can be searched in english or german (depending on the user's locale). Additionally, it is now possible to switch on/off the display of country flags when searching for language codes.
- **BUG**: format-plugin: removeFormat for quote and others (#577); enabled the useage of the u element (#580)
- **BUG**: core: Fixed copying of attributes when transforming DOM objects into other DOM objects (e.g. when transforming a list into a paragraph), which caused strange attributes to be written in IE, that caused editing problems (e.g. could not set cursor into paragraph, etc.)
- **BUG**: core: A basic content handler was added to the core that will cleanup the dom and html that gets processed by the getContents method. Currently this basic contenthandler is used to remove attributes (tabindex, hidefocus, contenteditable) that were added when using the Internet Explorer.
- **BUG**: repository-browser: Some images for the repository browser were changed because Internet Explorer 7+8 don't know how to handle alpha in PNGs.
- **BUG**: repository-browser: Columns that are not sortable will now no longer be displayed like they were sortable.
- **BUG**: formatlesspaste-plugin: Fixed javascript error that ocurred when no custom editable configuration was set
- **BUG**: dom-to-xhtml-plugin: When used in IE7 (or IE8 in IE7 mode), classes of elements were removed. This lead to unexpected behaviour with the BR-tags with class aloha-end-br, that are automatically added, when using the blockelementcontenthandler.
- **BUG**: characterpicker-plugin: Fixed inserting a special character with a collapsed selection, when using IE.
- **BUG**: table-plugin: Enabled proper selection (with mouse or keys) in the editable caption of a table.
- **BUG**: table-plugin: When the contents of a table cell gains the focus, the whole cell is no longer selected. This also affects applying format to contents of a table cell.
- **BUG**: table-plugin: New Captions are now added as first child of the table (before the tbody), according to the HTML5 specification.
- **BUG**: table-plugin: The table plugin will now remove table id's on cleanup.
- **BUG**: table-plugin: Fixed the removal of the aloha-table-cell_active once a table gets deactivated.
- **BUG**: numerated-headers-plugin: Fixed error that annotations would not be removed when converting a header to a paragraph. The plugin also added leading spaces to the heading's text. This was removed.
- **BUG**: linkbrowser-plugin/numerated-headers-plugin: A bug in the numerated headers plugin caused a javascript error when the linkbrowser window should be closed. This bug was fixed and the linkbrowser window closes now propely.
- **BUG**: wai-lang-plugin: We now remove data attributes generated by the repository on makeClean and we add an xml:lang attribute with the value of the lang attribute.
- **BUG**: wai-lang-plugin: The key combination ctrl+i caused a javascript error in IE8 when using the wai-lang-plugin together with the link plugin. This javascript error was now fixed.
- **BUG**: metaview-plugin: Modified CSS for language annotations to always show a generic icon for language annotated spans.
- **BUG**: metaview-plugin: language annotations would result in background images being repeated over and over again - fixed that problem.
- **BUG**: cite-plugin: Fixed editing of saved citation links.
- **BUG**: cite-plugin: The css animations for the cite plugin were removed because they were poluting the dom with style attributes.
- **BUG**: Fixed trailing comma in array literal.

## 0.20.17 - 2012/07/09

- **ENHANCEMENT**: contenthandler plugin: A new Blockelement Content Handler has been added, that handles breaks in blockelements upon initialization and getContents
- **ENHANCEMENT**: draganddropfiles: A security issue with the upload.php example file was found. The example will no longer be executable by default.
- **BUG**: core: The implementation for adding br-Tags in Blockelements has been fixed to realize a more consistent behaviour across all browsers and also with the metaview plugin turned on.

## 0.20.16 - 2012/07/04

- **ENHANCEMENT**: numerated-headers plugin: Added configuration option 'trailingdot' to switch format of generated headers.
- **BUG**: numerated-headers plugin: Fixed misleading interpretation of the 'numeratedactive' for configuration per editable. 'numeratedactive' will now only determine, whether headers shall be numerated by default (if button not unclicked by the editor). To disable the function for an editable, choose an empty 'headingselector'.
- **BUG**: numerated-headers plugin: Fixed numeration, when the headers are not starting with the highest level (e.g. when using h2 h1 h2 h3, the first h2 will be omitted and numeration will start at the h1)
- **BUG**: core: fixed missing space when selecting a word between two spaces and deleting (by [DEL] or [BACKSPACE]). The result will now be like expected: having the cursor between two spaces.
- **BUG**: characterpicker-plugin: Fixed inserting characters with a non-collapsed selection. Instead of adding the character after the selection, the inserted character will now replace the selection (like expected).
- **BUG**: paste-plugin: Disabled handling paste on IE by executing the command 'paste', because this causes incorrect cursor positions after pasting.
- **BUG**: paste-plugin: Fixed setting focus and selection into the editable before inserting pasted html. That fixes strange behaviour in FF after pasting.

## 0.20.15 - 2012/06/27

- **BUG**: core: Fixed browser crashes in IE9 (and above), after splitting DOM nodes using ENTER and placing the cursor afterwards, that occurred due to a browser bug in IE9

## 0.20.14 - 2012/06/27

- **ENHANCEMENT**: A whole lot of Plugins can now be configured editable-specific configuration: abbr, highlighteditables, list, horizontalruler, link, paste, headerids, listenforcer, metaview, numerated-headers, wai-lang, cite, characterpicker, formatlesspaste, dom-to-xhtml. Have a look at the individual plugin guides for detailed information on how to configure them.
- **ENHANCEMENT**: Added functional description for plugins
- **ENHANCEMENT**: plugin numerated-headers: will now be more tolerant with its configuration options
- **ENHANCEMENT**: sanitize contenthandler: Added 'del' as allowed element to the default configuration of the sanitize contenthandler.
- **ENHANCEMENT**: repository browser: searches in the repository browser will now be done recursively.
- **ENHANCEMENT**: plugin formatlesspaste: will now be more tolerant with the button and formatlessPasteOption setting and not only accept boolean values
- **ENHANCEMENT**: plugin cite: will now be more tolerant with the sidebar.open setting and not only accept boolean values. Additionally, the default config will now show both the quote and blockquote button.
- **BUG**: core: When using the delete button in IE7, so that after deleting the cursor is supposed to be in between two spaces, some unexpected text "undefined" was added to the editable. This has been fixed now.
- **BUG**: metaview: Fixed bug that caused a javascript error when no configuration was provided for the metaview plugin.
- **BUG**: core: Fixed a bug within jquery that caused problems in IE9 when invoking getContents for an editable that contains an embedded object (e.g. flash player).
- **BUG**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
- **BUG**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
- **BUG**: repositorymanager: Fixed a bug in the repository manager that caused an javascript error when no result items were passed to the processResults method.
- **BUG**: generic contenthandler: Do not trim text nodes in list elements, because this could remove spaces between words, where one word is formatted.
- **BUG**: plugin format: The format plugin will now support 'del' instead of 's' for strikethrough ('s' is deprecated), like explained in the documentation.
- **BUG**: plugin metaview: Metaview plugin would add a grey backdrop to lists on IE7. Added more specific styles.
- **BUG**: core: Implemented deleting tables with "delete" or "forwarddelete" commands (pressing [DEl] or [BACKSPACE]). 
- **BUG**: core: Fixed strange cursor behaviour when using [BACKSPACE] to delete the first character in a text node, using IE9. 
- **BUG**: enumerated-headers plugin: Added default configuration, which fixes some javascript error, if no other configuration is set.
- **BUG**: wai-lang plugin: Fixed toggle button to be pressed when a language is set, and unpressed if not. Hide language tab, when language is removed.

## 0.20.13 - 2012/06/15

- **ENHANCEMENT**: Removed unwanted behaviour from the block plugin's sidebarattributeedtior, which will clear out the whole sidebar when loaded
- **ENHANCEMENT**: added / updated guides for plugins
- **ENHANCEMENT**: enabled linklist.js so it's possible to use the settings for your own list (removed the default entries)
- **ENHANCEMENT**: table plugin: enabled format tab when a whole row/column is selected via click on the row/column header
- **ENHANCEMENT**: sanitize contenthandler: allow attribute target for the a element in the relaxed config
- **ENHANCEMENT**: plugin highlighteditables: configurable per editable; CSS can be adapted;
- **ENHANCEMENT**: added a new helper function jQuery.isEmpty() to check if a mixed var is empty or not
- **ENHANCEMENT**: A whole lot of Plugins can now be configured editable-specific configuration: abbr, highlighteditables, list, horizontalruler, link, paste, headerids, listenforcer, metaview, numerated-headers, wai-lang, cite, characterpicker, formatlesspaste, dom-to-xhtml. Have a look at the individual plugin guides for detailed information on how to configure them.
- **ENHANCEMENT**: Added functional description for plugins
- **ENHANCEMENT**: core: The getEditableConfig will now also return the selector within the configuration object. This only applies to custom editable configurations that provide objects instead of arrays since arrays can't be extended with custom properties. The returned object will now also contain nested arrays. Previously nested arrays were omitted.
- **BUG**: core: Fixed the fix for IE7 crashes
- **BUG**: core: Fixed Javascript errors that occurred in IE7 when pressing Enter at the end of paragraphs (multiple times).
- **BUG**: core: Fixed possible Javascript error when cleanup operation is done (e.g. after pasting text into an editable).
- **BUG**: commands: Fixed possible browser hang (due to an infinite loop) that occurred, when using the command 'inserthtml' to insert content into an editable span, that is not allowed inside a span (e.g. a h1). This browser hang could occur when using the paste plugin to paste content, since that uses the command 'inserthtml'.
- **BUG**: generic contenthandler: Changed to always remove div, span and font tags, regardless of the setting of the contentEditable attribute. This fixes problems, when e.g. having an editable span and then pressing [CTRL-A] [CTRL-C] [CTRL-V].
- **BUG**: commands: Fixed unwrapping of tags in fixDisallowedAncestors, which possibly removed the editing host when pasting into spans, h1, ...
- **BUG**: sanitize contenthandler: disabled for IE7, because it does not work well in IE7 (sanitize tries to set attributes via setAttributeNode() to DOM Elements, and this does not work for the "style" attribute in IE7)
- **BUG**: commands: fixed weird behaviour when using the backspace key to delete text (cursor was jumping).
- **BUG**: core: Fixed enter behaviour in lists. Before executing command "insertparagraph", whitespace textnodes around list elements are removed, because the algorithm isn't prepared to handle whitespace textnodes.
- **BUG**: citation plugin: Fixed javascript errors on initialization and possible endless loop when adding inline citations.

## 0.20.12 - 2012/05/24

- **MANUAL CHANGE**: wai-lang: The wai lang plugin will now fail loading when the flag-icons plugin was not loaded. Previously the plugin did not fail loading but showed broken flag icon images. Please note that it is currently mandatory to add third party dependencies for some plugins to the data-aloha-plugins attribute otherwise those dependencies can't be resolved correctly.
- **BUG**: browser-plugin: The browser will now open at a more centered position.
- **BUG**: core: A IE7 crash workaround was reverted because it caused all eventhandlers to be lost when getContents() was invoked. The new workaround will remove the jquery expando attributes in IE7 for some elements.
- **BUG**: core: Fixes bugs in the handeling of delete and forward delete. These bugs were introduced in an attempt to fix issues with deleting behaviour near multiple white spaces.  An alernative should be sought for a better solution for handeling white spaces.

## 0.20.11 - 2012/05/10

- **BUG** image plugin: fixes distorted images when in portrait format
- **BUG** table plugin: fixes bug in IE7 that second click on table cell was not activating the table
- **ENHANCEMENT** link plugin: removed linklist (and slowlinklist) which where loaded by default (we should not force everyone to have them active by default)
- **BUG**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups.
- **BUG**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups.
- **ENHANCEMENT**: browser-plugin: The browser plugin will now calculate the browser width automatically.
- **BUG**: IE7 - #516 navigate with arrow keys through several paragraphs
- **BUG**: IE7 - #515 gray text after list
- **ENHANCEMENT**: Removed unwanted behaviour from the block plugin's sidebarattributeedtior, which will clear out the whole sidebar when loaded
- **BUT**: floatingmenu: Fixed regeneration of ext components for floatingmenu, when buttons are added after the floatingmenu was initialized
- **FEATURE** plugin: Adding the sourceview plugin, which visualizes the current selection in the sidebar to help developers of Aloha Editor with debugging.

## 0.20.10 - 2012/04/17

- **BUG**: core: Fixed a typo in the previous bugfix: Fixed a javascript error in IE9 stating that the method createContextualFragment doesn't exist

## 0.20.9 - 2012/04/16

- **BUG**: block-plugin: Fixed 'e.srcElement is undefined' error in blockmanager.js which affected firefox 11
- **BUG** floatingmenu: Fixed problem with creating new buttons after Aloha is ready.
- **ENHANCEMENT**: updated integration of Aloha Blocks to the most recent version
- **BUG** floatingmenu: Fixed problem with showing floatingmenu shadow too early
- **BUG** core: Fixed a permission error in Firefox, when Aloha Editor tried to access a document property of an external ressource
- **BUG** table-plugin: Fixed the cleanup of the table cells on blur not cleaning up correctly (caused by a typo in the element class)
- **BUG** core: Fixed a javascript error in IE9 stating that the method createContextualFragment doesn't exist (fixed in extjs)

## 0.20.8 - 2012/04/06

- **BUG** core: UP and DOWN cursor key will now not be processed specially by Aloha, they will be left to native handeling.
- **BUG** core: Adds a guard in `execCommand()' to prevent `INDEX_SIZE_ERR' exceptions.
- **BUG** core: The cursor processing around non-contenteditable elements (blocks) was not functioning as described or desired.  It now behaves with more stability especially on Internet Explorer.
- **ENHANCEMENT** core: Improved efficiency of cursor processing, especially around blocks.
- **FEATURE** core: It is now possible to place the caret between two adjecent non-contenteditable elements.
- **ENHANCEMENT** core: The jquery-plugin require plugin will now be able to return loaded plugins. Previously loaded plugins were just accessible through the extended jquery object.
- **FEATURE** editable.js: introduced method setContents() -- use Aloha.getEditableById('my-editable').setContents('Aloha World') to set the contents of the editable with the ID my-editable
- **BUG** smartContentChange is now again triggered when pressing enter key; and new: delete / backspace keys
- **ENHANCEMENT** enabled image plugin in boilerplate demo. needs some enhancements to be more user friendly
- **BUG** updated dom.js to reflect HTML5 spec changes; format with u and i tags is now available; updated default button config
- **ENHANCEMENT** config options per editable for plugin common/horizontalruler and extra/toc
- **ENHANCEMENT** configure the sidebar handle position via Aloha.settings.sidebar.handle.top
- **ENHANCEMENT** table plugin: disable split / merge cell buttons when not possible to use
- **ENHANCEMENT** dom-to-xhtml plugin: non-specified attributes are excluded from serialization, making attribute serialization more consistent on IE7 and IE8.
- **ENHANCEMENT** load plugins via config option

## 0.20.7 - 2012/03/07

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
