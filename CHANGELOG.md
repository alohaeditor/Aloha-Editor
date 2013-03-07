# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](https://github.com/alohaeditor/Aloha-Editor/wiki/Roadmap)


All changes are categorized into one of the following keywords:

- **MANUAL CHANGE**: The change requires changes to existing implementation.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **BUGFIX**: The change fixes a bug.

## 0.23.0 - 2013/02/28

- **ENHANCEMENT**: format-plugin: b/strong and i/em handling
                   The "b" button will show as pressed if the selection contains
                   "strong" formatting, and will unformat the "strong" if
                   unpressed. The same behaviour was implemented for the i/em
                   combination.
- **ENHANCEMENT**: Place the caret after the character that is inserted by
                   characterpicker.
- **ENHANCEMENT**: Introducing Modal.modal()--a stripped down modal dialog that
                   can be customized for specific purposes.
- **ENHANCEMENT**: The Ephmera API was changed
	aloha-cleanme class has been renamed to aloha-ephemera.
	aloha-ui-* classes have been renamed to aloha-ephemera-*.
	Ephemera.ephemera() now doesn't merge the given value any more, but sets it (see function documentation for more information).
	ephemera.attrMap doesn't accept 'ELEMENT.attribute': true entries any more, instead use 'attribute': ['ELEMENT'].
	The mark* functions are now optional (modifications performed by these functions are documented and part of the API).
- **ENHANCEMENT**: jquery-ui and jquery.layout were upgraded
- **ENHANCEMENT**: used hints from #749 to improve file size of icons
- **BUGFIX**: Fix support for editable anchor elements
- **BUGFIX**: table-plugin: Tables which are inside editables what are inside of blocks will now
                            transformed into Aloha Tables as they ought to be.
- **BUGFIX**: table-plugin: Formatting a table row as header will now correctly set the scope of
                            the header elements to refer to the column.
- **BUGFIX**: Fixes image path in css file in repository browser #764
- **BUGFIX**: link-plugin: Fix anchor class would always be set to cssclass even when cssclassregex was not configured
- **BUGFIX**: link-plugin: Fix metaKey + click doesn't follow link (still doesn't work on IE7)
- **BUGFIX**: core: when a placeholder was defined for an editable, a placeholder wrapper element was injected into
	                all editables instead of only the editable the placeholder was defined for.
- **BUGFIX**: core: Aloha.settings.locale property was not honored.

## 0.22.7 - 2013/01/08

- **FEATURE**: textcolor-plugin: Introducing the textcolor plugin, which will allow you to apply color to sections of text
- **FEATURE**: table-plugin: Introducing table cell resize capabilities [table plugin](http://www.aloha-editor.org/guides/plugin_table.html) - Note: the feature is currently disabled by default.
- **BUGFIX**: table-plugin: Tables inside blocks will no longer be transformed
           into editable Aloha Editor tables.
- **BUGFIX**: table-plugin: Fixed the cursor problem with ie7. Now ie7 shows the 
           system default arrows.
- **BUGFIX**: core: getEditableHost() returns nearest editable rather than the
           furthest.
- **BUGFIX**: blocks: Selecting with <CTRL>+A, when inside of a nested editable,
           will now only select all of the contents of the immediate editable,
           rather the contents of parent editables as well.
- **BUGFIX**: ui: Floating toolbar will attempt to adjust is positioning to remain
		   entirely in the viewport whenever possible.
- **BUGFIX**: core: Fixes numerous issues with repository manager including how
           query() and getChildren() handle immediate, and asynchronous
           repositories.
- **BUGFIX**: vendor/repository-browser: Updates repository browser with fix to
		   not listing repository folders multiple times into wrong repositories
		   on the tree.
- **BUGFIX**: core: Fixed disappearing attributes in browsers that do not support
           outerHTML.
- **BUGFIX**: link-plugins: Fixed inserting of links so that links that span
           multiple elements are not unnecessarily split into fragments.
- **BUGFIX**: image-plugin: Fix numerous bugs with resizing and cropping and
           improve overall usability


## 0.22.6 - 2012/12/10

- **ENHANCEMENT**: documentation: Guides and documentation was improved for the validation plugin 

## 0.22.5 - 2012/12/04

- **FEATURE**: validation-plugin: Introducing [validation plugin](http://www.aloha-editor.org/guides/plugin_validation.html)
- **BUGFIX**: metaview-plugin: We now disable the metaview once the editable is deactivated.
- **BUGFIX**: core: Some i18n strings within some modal dialog buttons were fixed.  
- **BUGFIX**: core: Fixed Aloha's initialization order to ensure that repositorymanager will be initialized before plugins are initialized.

## 0.22.4 - 2012/12/03

- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
- **ENHANCEMENT**: table plugin: IE fix -- the selection of multiple cells was not possible when the selection started in the text; there was no workaround so it's now possible to select coherent cells when you "shift-click" into the second cell of the range you want to select
- **ENHANCEMENT**: The metaview view can now be enabled per editable.
Aloha.settings = {
			plugins: {
				metaview: {
					editables: {
						'#top-text': ['metaview','enabled']
					}
				}
			}
		};

- **BUGFIX**: formatlesspaste-plugin: Formatless Paste Plugin fixed to correctly
           process configuration settings.
- **BUGFIX**: table-plugin: Ensures that the range is maintained when clicking
		   inside table cells.
- **BUGFIX**: the underline button didn't show up in the toolbar
           after adding the 'u' in the format-plugin configuration.
- **BUGFIX**: All repositories have been queried even if a target repository has been spezified. Now only the spezified repository is queried.
- **BUGFIX**: core/aloha-links: Prevents yellow borders around aloha-links blocks
- **BUGFIX**: link-plugin: link scope remains active after the selection leaves an anchor element
- **BUGFIX**: blocks: The floating menu will appear when the editor double-clicks
           in an editable block.
- **BUGFIX**: core/selection: Aloha no longer inadvertently removes ranges that
		   are outside of editables.
- **BUGFIX**: characterpicker: popup now follows the floating menu while scrolling
- **BUGFIX**: dom utils: fixes potential bug that may cause attributes with the
		   slash '/' character in the name to appear in the result of
		   getContents().
- **BUGFIX**: word content handler: Fixed handling of pasted MS Word content to
           not result in broken markup when the content contains tables with
           cells that are all empty.
- **BUGFIX**: core/plugins: Fixed plugin initialization to ensure that the
		   "aloha-ready" event is not fired before all plugins have notified
		   that they are fully initialized.
- **BUGFIX**: characterpicker & horizontalruler: Fixes icon styling to display
		   correct images event when a user-specified jquery ui stylsheet is
		   included in the page.
- **BUGFIX**: block-plugin: Fixed activation of correct block when active editable
		   is changed using Keys (Tab, Shift-Tab) or programmatically.
- **BUGFIX**: block-plugin: Fixed handling of copy & paste in editables that are
		   nested inside blocks. Before this fix, when pressing CTRL-C to copy
		   the current selection in an editable nested inside a block, the whole
		   block was selected and copied.

## 0.22.3 - 2012/11/06

- **MANUAL CHANGE**: Updated UI CSS regarding button selector;
- **MANUAL CHANGE**: Added a demo of placeholders to boilerplate;
- **FEATURE**: align-plugin: The align plugin is now capable of aligning table cell contents.
- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
- **FEATURE**: improved translation export from gengo.com to Aloha Editor
	<code>
	Aloha.settings.plugins: {
		captionedImage: {
			allowLinebreak: [ 'p' ], // ['br', 'p'], true or false (default)
		}
	}
	</code>
- **ENHANCEMENT**: browser: The old browser plugin was removed. The browser-plugin was replaced by the repository browser vendor plugin. 
- **ENHANCEMENT**: RepositoryBrowser: The repository browser will now correctly handle localisation for the languages english and german.
- **ENHANCEMENT**: Trigger the 'aloha-smart-content-changed' event with `triggerType` = `block-change` whenever an attribute of an Aloha Block is changed.
- **BUGFIX**: table-plugin: Fixed a javascript error that occurred when pressing enter in the table wai attribute field.
- **BUGFIX**: Fix base tag breaks Aloha Editor UI
- **BUGFIX**: Fix calling mahalo in a blur event handler
- **BUGFIX**: Fix support for editable anchor elements
- **BUGFIX**: All repositories have been queried even if a target repository

	has been specified. Now only the specified repository is queried.

- **BUGFIX**: core/aloha-links: Prevents yellow borders around aloha-links blocks
- **BUGFIX**: link-plugin: link scope remains active after the selection leaves an anchor element
- **BUGFIX**: blocks: The floating menu will appear when the editor double-clicks
           in an editable block.
- **BUGFIX**: core/selection: Aloha no longer inadvertently removes ranges that
		   are outside of editables.
- **BUGFIX**: added aloha-cleanme class to aloha-block-handle to prevent potential
		   issues with temporary elements not being cleaned up.

- **FEATURE**: align-plugin: the align plugin is now capable of aligning table cell contents
- **FEATURE**: table-plugin: table cells can now have individual classes like rows and columns

## 0.22.2 - 2012/10/08

- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
- **BUGFIX**: table-plugin: A javascript error was fixed that occured when removing the whole table.

## 0.22.1 - 2012/09/26

- **FEATURE**: core: Added method Aloha.getEditableHost() to get the editable, that contains the given jQuery object.

- **FEATURE**: repository browser: If one of the repositories runs into a timeout during query, the browser will now call the method handleTimeout().

- **FEATURE**: abbr-plugin: We added a remove abbreviation button to make the functionality more consistent with the wai-lang plugin.

- **FEATURE**: metaview: We now also display HR tags in the metaview. We also 
				removed the dependency to the flag-icons plugin.

- **FEATURE**: list-plugin: When transforming a list from ul to ol or back all sub elements that are selected are also transformed.

- **ENHANCEMENT**: Aloha Blocks will now publish a message on the channel
                   "aloha.blocks.initialized" when a block is fully initialized.
                   
- **ENHANCEMENT**: The Block Plugin now allows you to configure your own root tags 
				   for block creation. Every time you create a new block, the block 
				   plugin will check if its root node is supported. You may now change 
				   the roots nodes and use your own list root tags. If you want 
				   to use Aloha Blocks drag'n drop functionalities we strongly 
				   suggest that you do not use other root tags than div and span.
				   See the guides at http://www.aloha-editor.org/guides/plugin_block.html 
				   for further information.

- **ENHANCEMENT**: Aloha Editor will no longer annotate end <br> tags, which
				   are used to prop up empty block-level elements that would be
				   otherwise rendererd invisbly, with the "aloha-end-br" class.
				   This should result in cleaner markup.


                   

- **BUGFIX**: Added missing icon for the block plugins toggledragdrop button

- **BUGFIX**: Rangy Core: Patches Rangy to include a workaround for html5shiv's
        violation of document.createElement().

        As detailed in this discussion:
        https://github.com/aFarkas/html5shiv/issues/64: html5shiv monkey
        patches the native document.createElement() function in browsers like
        IE8 and older, which do no support HTML5.  However, it does in a way
        that seriously deviates from the contract that the native
        document.createElement() function establishes, because it creates
        elements which have non-null siblings and parentNode.

        This violation causes Rangy to throw an exception in IE8 or IE7.

        The workaround prevents this error by detaching the element that was
        created via html4shiv's implementation of document.createElement() from
        its parentNode, near the critical area of code where the exception
        occurs.

- **BUGFIX**: Moved call to execCommand('enableObjectResizing', false, false) to init method of editable.
		Otherwise, FF 15 (and above) will throw a JS error, if execCommand('enableObjectResizing', false, false)
		is called with no contenteditable elements found in the page.

- **BUGFIX**: Fixed Javascript error when doing searches in the repository browser (which caused to search to not be done).

- **BUGFIX**: added the del format button to the possible format plugin buttons

	The del button is not enabled by default. To enable it, it has to
	be configured. For example

	Aloha.settings.plugins.format.config = ['del', ...];

	See http://aloha-editor.org/guides/plugin_format.html

- **BUGFIX**: characterpicker-plugin: Fixed a bug that when inserting a special character using the character picker plugin, the focus would be sometimes set to the start of the active editable (e.g. when inserting into a table cell).

- **BUGFIX**: listenforcer-plugin: Fixed a bug that would only mark the first editable matching a configured selector as an enforced editable. Also when leaving an editable, we now remove the added list properly.

- **BUGFIX**: core: Sometimes when putting the cursor at the first position of an editable, the cursor would vanish or be put outside the editable. This has been fixed.

## 0.22.0 - 2012/09/03

- **MANUAL CHANGE**: Updated UI CSS regarding button selector.

- **MANUAL CHANGE**: Added a demo of placeholders to boilerplate.

- **FEATURE**: Image Caption Plugin: caption now supports sanitize contenthandler & disable / enable of line breaks;
	<code>
	Aloha.settings.contentHandler.handler: {
		sanitize: {
			'.aloha-captioned-image-caption': { elements: [ 'em', 'strong' ] }
		}
	}
	</code>

	<code>
	Aloha.settings.plugins: {
		captionedImage: {
			allowLinebreak: [ 'p' ], // ['br', 'p'], true or false (default)
		}
	}
	</code>

- **BUGFIX**: In the sidebar the panel entry for the format plugin was always shown; now when the formatOptions is empty the empty (useless) sidebar panel will be hidden.

- **BUGFIX**: Align Plugin button status was not shown correctly.

# 0.21.x

## 0.21.4 - 2012/09/03

- **ENHANCEMENT**: Added labels to the image-plugin url, title, width, height input fields

	This change also rearranges the order of image-plugin components in the toolbar.

- **BUGFIX**: Fixed the ContentHandlerManager to use the content handlers in the correct order.

- **BUGFIX**: Fixed clicking custom block handles activates the image plugin

## 0.21.3 - 2012/08/24

- **ENHANCEMENT**: An error was turned into a warning

	The error message "encountered range object without start or end
	container" was incorrectly logged as an error instead of a
	warning.
	
- **ENHANCEMENT**: repository-browser: The repository browser will now automatically increase its height.

- **ENHANCEMENT**: Added a new block implementation of Aloha Editor blocks, which 
				   doesn't render any tag fill icons or borders. This is useful for 
				   tags that should be editable with Aloha Editor.

				   To use this block type, just wrap your tag content in a <div> 
				   with the following attribute: 

				   data-aloha-block-type="EmptyBlock"

- **ENHANCEMENT**: Added jQuery method mahaloBlock() to "unblock" the elements from a jQuery collection. Added method .unblock() for Blocks to "unblock" a block instance (in both cases without removing the DOM element from the DOM).

- **BUGFIX**: The sidebar didn't always update the height of panels correctly.

- **BUGFIX**: Fixed JS error in Aloha.unbind()

- **BUGFIX**: Fixed adding of unwanted <span>'S before tables every time an editable was deactivated when the table plugin and block plugin was used.

- **BUGFIX**: Fixed selecting with keyboard or mouse in editables that are nested in blocks, when using the Internet Explorer.

- **BUGFIX**: Fixed block draghandles are sometimes missing

## 0.21.2 - 2012/08/16

- **MANUAL CHANGE**: Updated impress.js to work with jQuery UI

- **MANUAL CHANGE**: Updated demo-app to work with jQuery UI; added simple system test to check file permissions;

- **MANUAL CHANGE**: Updated the guides for the contenthandler configuration;

- **MANUAL CHANGE**: removed not needed demo/test.html (was for testing per editable config)

- **ENHANCEMENT**: link-plugin: Removed unwanted margins from the sidebar panel of the link attribute.

- **ENHANCEMENT**: Addition to the API
                   Aloha.Editable.setContentSerializer() was added to the API.
                   Aloha.Editable.getContentSerializer() was implemented and
				   added to the API.

- **ENHANCEMENT**: pubsub/repository-browser: Upgrades the PubSub, and
                   RepositoryBrowser dependencies.

- **BUGFIX**: Editable.getContents(true) doesn't make defensive copies.
		   Invoking Editable.getContents(true) multiple times in a row would
		   return the same object, causing unexpected behaviour when client
		   code modified that object.

- **BUGFIX**: building/undo-plugin: The undo plugin was removed from the list of 
           plugins that are included in the build process because it caused some 
           silent javascript errors with content in frameset environments.

- **BUGFIX**: image-plugin: The reset image button function was fixed.  Previously
           a javascript error occured when the button was pressed.

- **BUGFIX**: wai-lang-plugin: Language annotations were not enhanced.
		   The short name ('de') of language annotations was displayed instead
		   of of the full name from the repository ('German').

- **BUGFIX**: block-plugin: Selection was lost when using the cursor keys to move
           across inline blocks.

- **BUGFIX**: block-plugin: Fixes problem in how droppable containers were being
		   determined while drapping blocks.  The algorithm was miss-identifing
		   any container that had a <br> tags with the "aloha-end-br" class as
		   an "empty" container, even if it contained other content along with
		   the propping <br>.  We now use a stricter check to remove this false
		   positive.

- **BUGFIX**: Fixed block formatting (p, h1, ...)

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


- **BUGFIX**: core: We now also remove jquery* attributes before the content is saved.

- **BUGFIX**: core: We now log a warning to the console if repositories run into timeouts.

- **BUGFIX**: wai-lang: We now load the language dataset in the query method. This fixes the issue that if the first request went wrong it was never loaded again.

- **BUGFIX**: sidebar: The sidebar now remembers the current selection and refreshes itself when it is being opened.

- **BUGFIX**: wordcontenthandler: Fixed the pasting of tables with empty cells.

- **BUGFIX**: wordcontenthandler: Fixed the pasting of lists in chrome and IE9.

- **BUGFIX**: In the sidebar the panel entry for the format plugin was always shown; now when the formatOptions is empty the empty (useless) sidebar panel will be hidden

## 0.21.1 - 2012/08/06

- **MANUAL CHANGE**: The API Method setActiveButton() of the MultiSplit component changed: the parameter must be the name of the button to set active, not the index.

- **MANUAL CHANGE**: Changed the aloha-smart-content-changed event

    The snapshotContent property provided bythe
    aloha-smart-content-changed event was replaced with the
    getSnapshotContent property which is a function that must be
    called to retrieve the value that was provided by snapshotContent.

    This was done to make snapshotting of the editable contents
    optional, since it is a very expensive operation.
    
- **FEATURE**: Toolbar configurability was extended

	The now Aloha.toolbar.settings.tab[i].exclusive property was implemented.
	See the ui guide for more information.

- **FEATURE**: UiPlugin API addition

	UiPlugin.showToolbar() was added to the UiPlugin API.
	This function provides better control over when the toolbar is
	shown.

- **FEATURE**: Aloha Blocks dropzones and configuration

	Aloha Blocks now allow for additional configuration settings which
	allow you to disable the drag'n'drop functionality of blocks
	globally or for individual editables as well as defining custom
	dropzones for each editable. See
	http://www.aloha-editor.org/guides/plugin_block.html#en-disabling-drag-drop-for-blocks
	for details.

- **ENHANCEMENT**: Aloha Editor will now add the browser version to the html dom node (see http://www.aloha-editor.org/guides/core.html#initialization-process)

- **BUGFIX**: A debugger statement was removed.

- **BUGFIX**: Missing implementations to show and hide items in a multisplit button have been added.

- **ENHANCEMENT**: numerated-headers-plugin: Added a &nbsp to the annotation, to seperate it from the heading's text.

- **ENHANCEMENT**: table-plugin: We now show the summary textarea in the sidebar if a click on the wai-image was issued.

- **BUGFIX**: Fixed IE7 mode paragraph margin

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

- **BUGFIX**: Fixed some random and weird selection problems in IE7, where some
	actions (like Enter behaviour) were not performed on the correct cursor
	position. Sometimes there also occurred some JS errors.
	
- **BUGFIX**: Fixed Transforming an empty contenteditable into a list, which
	caused the contenteditable container to disappear.

- **BUGFIX**: Loading errors that occured when a second jQuery was loaded below aloha.js were fixed.

- **BUGFIX**: Fixed the qUnit tests for following commands to work in IE 7/8/9, latest Firefox and Chrome.
  * Bold
  * Italic
  * Subscript
  * Superscript
  * CreateLink
  * Unlink
  * Underline
  * Strikethrough
  * FormatBlock
  * RemoveFormat
  * Indent
  * Outdent
  * InsertOrderedList
  * InsertUnorderedList  


## 0.21.0 - 2012/07/26

- **MANUAL CHANGE**: Most plugins don't load their css files through require any more

    Before this change, plugins loaded the necessary css automatically.
    Now, it is necessary to include aloha/css/aloha.css to get the css
    that is necessary to make plugins work.

- **MANUAL CHANGE**: The jquery requirejs dependency was renamed from aloha/jquery to just jquery.

    define(['aloha/jquery', function($) { });

    must be changed to

    define(['jquery', function($) { });

- **MANUAL CHANGE**: The following jQuery extensions were removed

    jQuery.isBoolean - Instead consider typeof x === 'boolean'. 
    jQuery.isEmpty

- **MANUAL CHANGE**: The default jQuery version distributed with Aloha was updated from 1.6.1 to 1.7.2.

    The jQuery.isNumeric extension added to jQuery by Aloha was removed
    to account for jQuery's own isNumeric function added in 1.7.

- **MANUAL CHANGE**: The browser plugin was removed

    The browser plugin is obsolete. Please see linkbrowser and
    imagebrowser plugins.

- **MANUAL CHANGE**: Added the ui-plugin and removed ui specific code from the Aloha core

    Due to a complete re-implementation of the Aloha user interface in
    the form of the ui-plugin, most of the ui specific Aloha API has
    changed.

    * FloatingMenu - removed

    * Aloha.ui - removed

      Affects
      Aloha.ui.AttributeField
      Aloha.ui.Button
      Aloha.ui.MultiSplitButton
      Aloha.isMessageVisible
      Aloha.hideMessage
      Aloha.ui.MultiSplitButton.idCounter
      Aloha.showMessage
      Aloha.i18n
      Plugin.i18n (has been deprecated for some time now)

    * Aloha.Message - removed

    * Aloha.settings.plugins.table.summaryinsidebar - meaning changed

      This setting decided whether the summary was displayed either in
      the side bar or in the floating-menu. This setting now only
      decides whether or not a summary is displayed in the sidebar.

      The table-plugin defines a component with the name
      tableSummary. It is up to the toolbar configuration whether or not
      this component is displayed in the toolbar.

    * image-plugin - the following settings are obsolete

       Aloha.settings.plugins.image.ui.oneTab
       Aloha.settings.plugins.image.ui.insert
       Aloha.settings.plugins.image.ui.meta
       Aloha.settings.plugins.image.ui.reset
       Aloha.settings.plugins.image.ui.align
       Aloha.settings.plugins.image.ui.margin
       Aloha.settings.plugins.image.ui.crop
       Aloha.settings.plugins.image.ui.resize
       Aloha.settings.plugins.image.ui.aspectRatioToggle

      It is now up to the toolbar configuration whether or not and how
      to display these components.

    * Selection.isFloatingMenuVisible - removed
 
    All settings associated with the removed components do not have any
    effect any more.

    Most Aloha css rules have been re-implemented.
    
    In particular, the Aloha block handles now have z-index 10000, the
    floating menu has 10100, and Aloha dialogs have 10200. The sidebar
    continues to have a z-index of 999999999.

    The new common/ui plugin is now required for the user interface to
    be shown. This plugin is not loaded automatically. Most plugins
    require a user interface and will fail to load if this plugin is not
    configured to be loaded.

    The requirejs plugins order! and jquery-plugin!  have been removed.

    Many plugins exposed buttons, attribute-field and multi-split-button
    components as non-private members. For example, as in the case of
    the cite plugin, buttons were pushed onto the exposed
    multi-split-button of the Format plugin. Most of these exposed
    components were removed.

    The removal of the Ext.* namespace and the ExtJs css may
    inadvertently affect the behaviour and display of any site that
    includes Aloha.

    In particular the trim() function on the String object was provided
    by ExtJs for older versions of IE. Since ExtJs is gone, calling this
    function will now probably cause errors on older versions of
    IE. jQuery.trim() may be used as an alternative.

    See the ui.html guide for more information about the new UI.

- **MANUAL CHANGE**: Several files have been removed

    - src/lib/aloha/ext-alohatreeloader.js
    - src/lib/aloha/ui-browser.js
    - src/lib/aloha/ecma5.js

    These files are not in use by any of the main Aloha plugins and as
    such are deemed obsolete. These files were never loaded and their
    removal should not have any side-effect.

    Custom plugins should be checked for a possible dependency on these
    files.

- **MANUAL CHANGE**: baseUrl and data-aloha-plugins attribute detection changed slightly

    This change can be ignored if aloha.js is loaded in a page where
    only a single script element refers to a file with this name and if
    this script include is also the one carrying the data-aloha-plugins
    attribute, and no other script include is carrying this attribute -
    this should normally be the case. If this is not the case, aloha may
    not load correctly due to this change.

    The exact rules are now as follows:

    If Aloha.settings.baseUrl is not specified, it will be taken from
    the first script element that has a data-aloha-plugins attribute,
    or, if there is no such script element, the first script element of
    which the src attribute matches /\/aloha.js$/.
     
    If Aloha.settings.plugins.load is not specified, it will be taken
    from the data-aloha-plugins attribute of the first script element
    carrying this attribute.

- **MANUAL CHANGE**: The Aloha.requirePaths property has been removed.

- **MANUAL CHANGE**: The jquery.store and jquery.json plugins have been removed

    The jquery.store plugin was used for persisting the floating menu
    position and pinned state. The functionality provided by
    jquery.store has been replaced with amplify.store.

    The jquery.json plugin has been removed since the functionality
    provided by this module is already provided by util/json2.

    This also fixes the problem that pinning the floating menu was not
    persisted in IE8 and below.

- **MANUAL CHANGE**: requirejs is not loaded as part of Aloha-Editor

    For aloha development the user must now load requirejs himself
    before loading aloha.js.

    When using a built version of Aloha, it's possible to choose between
    aloha-bare.js, which doesn't include requirejs (or jQuery), and
    aloha-full.js, which does include requirejs (and jQuery).

- **MANUAL CHANGE**: Properties exposed by Aloha.Selection or aloha/selection were changed

    - tagHierarchy
    - replacingElements
    - allowedToStealElements

    These properties are now maps of maps instead of maps of lists.

- **MANUAL CHANGE**: Aloha.define was removed as it didn't serve any purpose

- **MANUAL CHANGE**: The jQuery loaded by Aloha no longer performs a call to $.noConflict.

    The combined and minified aloha-full.js will contain the call to
    $.noConflict to preserve behaviour with earlier Aloha builds

    The combined and minified aloha-bare.js, or the unminified and
    uncombined form used during development, will not contain the call
    to $.noConflict.

    Aloha now loads jQuery asynchronously, unless the user passes in a
    jQuery instance himself. It is difficult to predictably call
    $.noConflict after loading jquery asynchronously - the global jQuery
    and $ variables may or may not be set to the jQuery loaded by Aloha
    for some time after loading has finished, resulting in possibly
    unpredictable behaviour if multiple jQuery instances are used.

    It is up to the user to load jQuery, call noConflict himself, and
    pass jQuery into Aloha via Aloha.settings.predefinedModules or
    Aloha.settings.jQuery.

- **MANUAL CHANGE**:    HotKey for inserting links is changed back to ctrl+k like documented here:
    https://github.com/alohaeditor/Aloha-Editor/blob/dev/doc/guides/source/core_hotkey.textile

- **FEATURE**: Added hotkey functionality.
- **FEATURE**: Added Aloha.settings.plugins.load to load plugins also via config
- **FEATURE**: plugin extra/proxy: as multiple plugins need a proxy script to access external resources there's now one for all to use
- **FEATURE**: The images browser plugin was added.
- **ENHANCEMENT**: Wrapping some Aloha.require calls in Aloha.ready calls is not necessary any more

    In some cases, wrapping an Aloha.require call in an Aloha.ready call
    is not necessary any more. There are some exceptions, because the
    module itself may assume that Aloha is ready before its API is used.

    At the time of this writing this affects most plugins, since most
    plugins are initialized when Aloha is ready. So, calling
    Aloha.require with the plugin as a dependency will work, but the API
    will likely not be initialized resulting in unpredictable behavior.

- **ENHANCEMENT**: Updated naming from Aloha to Aloha Editor in boilerplate demo.

- **ENHANCEMENT**: Aloha specific css rules that are not in use any more were removed:

    .aloha-editable-zerowidthfix
    .aloha-logo
    .aloha-maximize
    
- **ENHANCEMENT**:  It's now possible to deactivate the transformFormattings method in the genericcontenthandler with the following setting:
    
    Aloha.settings.contentHandler.handler.generic.transformFormattings = false
    
    By default the transformFormattings method is enabled.
    
- **ENHANCEMENT**: The vie plugin was removed
- **ENHANCEMENT**: block plugin: It is now possible to navigate with arrow keys when there are blocks.
- **ENHANCEMENT**: block plugin: Aloha Block Plugin has now been greatly cleaned up and improved. Besides greatly cleaned up API and documentation, the new features include Drag/Drop, Deletion and Copy/Paste support. Now fully cross-browser (IE7, IE8, IE9, Chrome, Firefox).
- **ENHANCEMENT**: core: The jquery-plugin require plugin will now be able to return loaded plugins. Previously loaded plugins were just accessible through the extended jquery object.
- **ENHANCEMENT**: image plugin: splitting main fat file (1500 lines) for easying maintenance and evolutions. The new file which contains the gui is called 'image-floatingMenu.js'. The all sources of the image plugin were jslinted.
- **ENHANCEMENT**: image plugin: abstracting ui calls and removing FloatingMenu dependency from main plugin file
- **ENHANCEMENT**: image plugin: new method getImgFocus used in place of findImgMarkup which is pointless now
- **ENHANCEMENT**: core: #448 Aloha Editor possibility to be loaded as requireJS module
- **ENHANCEMENT**: browser: commenting some methods and coding guidelines
- **BUGFIX**: abbr-plugin: Fixed a javascript error when Aloha.activeEditable.obj / Aloha.activeEditable was not defined
- **BUGFIX**: fixing placeholder bug where it appears twice in some cases
- **BUGFIX**: commands.delete: fixed a bug with the delete command when contents are preceded by ignorable whitespace. also added a delete test for that.
- **BUGFIX**: image plugin: building a selection from scratch when an image is clicked isn't safe as conflictual browser behaviours
- **BUGFIX**: image plugin: containing editable not selectable after image plugin activation.
- **BUGFIX**: image plugin: when plugin activated on an image, clicking a second image don't disable resize on first one.
- **BUGFIX**: image plugin: fixing focus and value of srcField when image is clicked (previously handled by selectionChange)
- **BUGFIX**: fixes alohaeditor/Aloha-Editor##424 -- SmartContentChanged is not triggered when hitting
- **BUGFIX**: browser: fixes alohaeditor/Aloha-Editor#415 -- Repositorie entries appears twice in explorer
- **BUGFIX**: browser: fixes alohaeditor/Aloha-Editor#460 -- Error when multiple repositories are configured
- **BUGFIX**: block sidebar attribute editor: when using backspace/del in an input field the block was removed
- **BUGFIX**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.

- **DISCUSS**: It would make sense to support also input (like textarea) elements
    eg. for basic formattings like strong / em -- but prevent insertation of br / p ?

- **BUGFIX**: headerids-plugin: Fixed a bug in the headerids plugin that the ids were not generated when the getContents was called.

- **BUGFIX**: numerated-headers-plugin: Fixed a bug in the numerated-headers plugin, that the selection was not properly updated when the annotations were removed.

- **BUGFIX**: core: Fixed that sanitizing was not executed for IE7 because of an error with modifying style attributes in IE7. We now execute sanitizing, but ignore style attributes.

- **BUGFIX**: core: Added the removal of sizzle attributes to the basic content handler.

- **BUGFIX**: core: We now catch an exception that is thrown when the selection is not properly updated. This exception would lead to unexpected behaviour.

- **BUGFIX**: core&numerated-headers-plugin: Fixed that sometimes DOM INDEX EXCEPTIONS occured when formating a list of paragraphs.


# 0.20.x

## 0.20.24 - 2012/09/26

- **FEATURE**: metaview: We now also display HR tags in the metaview. We also removed the dependency to the flag-icons plugin.
- **FEATURE**: list-plugin: When transforming a list from ul to ol or back all sub elements that are selected are also transformed.
- **FEATURE**: core: Added method Aloha.getEditableHost() to get the editable, that contains the given jQuery object.
- **FEATURE**: repository browser: If one of the repositories runs into a timeout during query, the browser will now call the method handleTimeout().
- **BUGFIX**: characterpicker-plugin: Fixed a bug that when inserting a special character using the character picker plugin, the focus would be sometimes set to the start of the active editable (e.g. when inserting into a table cell).
- **BUGFIX**: listenforcer-plugin: Fixed a bug that would only mark the first editable matching a configured selector as an enforced editable. Also when leaving an editable, we now remove the added list properly.
- **BUGFIX**: floatingmenu: Fixed a bug in the floating menu that the position would not be adjusted if the height of the floating menu changed. This is needed in the topalign mode to not hide parts of the editable.
- **BUGFIX**: core: Sometimes when putting the cursor at the first position of an editable, the cursor would vanish or be put outside the editable. This has been fixed.
- **BUGFIX**: abbr-plugin: A possible dereference error was fixed in the plugin.

## 0.20.23 - 2012/08/24

- **ENHANCEMENT**: changed loading procedure of languages in wai lang plugin from AJAX to require.js
- **BUGFIX**: resolved issue with opening the sidebar when clicking on table WAI button.

## 0.20.22 - 2012/08/16

- **ENHANCEMENT**: link-plugin: Removed unwanted margins from the sidebar panel of the link attribute.
- **BUGFIX**: Fixed block formatting (p, h1, ...)

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

- **BUGFIX**: core: We now also remove jquery* attributes before the content is saved.
- **BUGFIX**: core: We now log a warning to the console if repositories run into timeouts.
- **BUGFIX**: wai-lang: We now load the language dataset in the query method. This fixes the issue that if the first request went wrong it was never loaded again.
- **BUGFIX**: sidebar: The sidebar now remembers the current selection and refreshes itself when it is being opened.
- **BUGFIX**: wordcontenthandler: Fixed the pasting of tables with empty cells.
- **BUGFIX**: wordcontenthandler: Fixed the pasting of lists in chrome and IE9.

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

- **BUGFIX**: Fixed IE7 mode paragraph margin

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

- **BUGFIX**: Fixed some random and weird selection problems in IE7, where some
	actions (like Enter behaviour) were not performed on the correct cursor
	position. Sometimes there also occurred some JS errors.
	
- **BUGFIX**: Fixed Transforming an empty contenteditable into a list, which
	caused the contenteditable container to disappear.

- **BUGFIX**: headerids-plugin: Fixed a bug in the headerids plugin that the ids were not generated when the getContents was called.

- **BUGFIX**: numerated-headers-plugin: Fixed a bug in the numerated-headers plugin, that the selection was not properly updated when the annotations were removed.

- **BUGFIX**: core: Fixed that sanitizing was not executed for IE7 because of an error with modifying style attributes in IE7. We now execute sanitizing, but ignore style attributes.

- **BUGFIX**: core: Added the removal of sizzle attributes to the basic content handler.

- **BUGFIX**: core: We now catch an exception that is thrown when the selection is not properly updated. This exception would lead to unexpected behaviour.

- **BUGFIX**: core&numerated-headers-plugin: Fixed that sometimes DOM INDEX EXCEPTIONS occured when formating a list of paragraphs.

## 0.20.20 - 2012/07/25

- **BUGFIX**: core: An Internet Explorer 7 crash fix was fixed. Previously the fix caused the whole content to be selected for a short period of time when appling inline format elements.
- **BUGFIX**: core: An issue that resize handles were displayed on inline elements that contained a new lines in IE7/8 was fixed. 

## 0.20.19 - 2012/07/25

- **BUGFIX**: cite-plugin: Removal of a cite specific data attribute caused a crash in Native Internet Explorer 7. The removal will now be skipped for Native Internet Explorer 7.

## 0.20.18 - 2012/07/25

- **ENHANCEMENT**: cite-plugin: Fixed cite plugin DOM element attributes. It is not needed to add attributes to blockquote and q tags unless you have defined a referencecontainer.
- **ENHANCEMENT**: contenthandler: Modified contenthandlers to allow language annotations made by the wai-lang plugin. This enables copy & paste of language annotations.
- **ENHANCEMENT**: list-plugin: Some internet explorer specific attributes (hidefocus, tabindex) will now be removed on makeClean.
- **ENHANCEMENT**: wai-lang-plugin: The plugin now supports both ISO-639-1 (two letter) and ISO-639-2 (three letter) language codes. The languages can be searched in english or german (depending on the user's locale). Additionally, it is now possible to switch on/off the display of country flags when searching for language codes.
- **BUGFIX**: format-plugin: removeFormat for quote and others (#577); enabled the useage of the u element (#580)
- **BUGFIX**: core: Fixed copying of attributes when transforming DOM objects into other DOM objects (e.g. when transforming a list into a paragraph), which caused strange attributes to be written in IE, that caused editing problems (e.g. could not set cursor into paragraph, etc.)
- **BUGFIX**: core: A basic content handler was added to the core that will cleanup the dom and html that gets processed by the getContents method. Currently this basic contenthandler is used to remove attributes (tabindex, hidefocus, contenteditable) that were added when using the Internet Explorer.
- **BUGFIX**: repository-browser: Some images for the repository browser were changed because Internet Explorer 7+8 don't know how to handle alpha in PNGs.
- **BUGFIX**: repository-browser: Columns that are not sortable will now no longer be displayed like they were sortable.
- **BUGFIX**: formatlesspaste-plugin: Fixed javascript error that ocurred when no custom editable configuration was set
- **BUGFIX**: dom-to-xhtml-plugin: When used in IE7 (or IE8 in IE7 mode), classes of elements were removed. This lead to unexpected behaviour with the BR-tags with class aloha-end-br, that are automatically added, when using the blockelementcontenthandler.
- **BUGFIX**: characterpicker-plugin: Fixed inserting a special character with a collapsed selection, when using IE.
- **BUGFIX**: table-plugin: Enabled proper selection (with mouse or keys) in the editable caption of a table.
- **BUGFIX**: table-plugin: When the contents of a table cell gains the focus, the whole cell is no longer selected. This also affects applying format to contents of a table cell.
- **BUGFIX**: table-plugin: New Captions are now added as first child of the table (before the tbody), according to the HTML5 specification.
- **BUGFIX**: table-plugin: The table plugin will now remove table id's on cleanup.
- **BUGFIX**: table-plugin: Fixed the removal of the aloha-table-cell_active once a table gets deactivated.
- **BUGFIX**: numerated-headers-plugin: Fixed error that annotations would not be removed when converting a header to a paragraph. The plugin also added leading spaces to the heading's text. This was removed.
- **BUGFIX**: linkbrowser-plugin/numerated-headers-plugin: A bug in the numerated headers plugin caused a javascript error when the linkbrowser window should be closed. This bug was fixed and the linkbrowser window closes now propely.
- **BUGFIX**: wai-lang-plugin: We now remove data attributes generated by the repository on makeClean and we add an xml:lang attribute with the value of the lang attribute.
- **BUGFIX**: wai-lang-plugin: The key combination ctrl+i caused a javascript error in IE8 when using the wai-lang-plugin together with the link plugin. This javascript error was now fixed.
- **BUGFIX**: metaview-plugin: Modified CSS for language annotations to always show a generic icon for language annotated spans.
- **BUGFIX**: metaview-plugin: language annotations would result in background images being repeated over and over again - fixed that problem.
- **BUGFIX**: cite-plugin: Fixed editing of saved citation links.
- **BUGFIX**: cite-plugin: The css animations for the cite plugin were removed because they were poluting the dom with style attributes.
- **BUGFIX**: Fixed trailing comma in array literal.

## 0.20.17 - 2012/07/09

- **ENHANCEMENT**: contenthandler plugin: A new Blockelement Content Handler has been added, that handles breaks in blockelements upon initialization and getContents
- **ENHANCEMENT**: draganddropfiles: A security issue with the upload.php example file was found. The example will no longer be executable by default.
- **BUGFIX**: core: The implementation for adding br-Tags in Blockelements has been fixed to realize a more consistent behaviour across all browsers and also with the metaview plugin turned on.

## 0.20.16 - 2012/07/04

- **ENHANCEMENT**: numerated-headers plugin: Added configuration option 'trailingdot' to switch format of generated headers.
- **BUGFIX**: numerated-headers plugin: Fixed misleading interpretation of the 'numeratedactive' for configuration per editable. 'numeratedactive' will now only determine, whether headers shall be numerated by default (if button not unclicked by the editor). To disable the function for an editable, choose an empty 'headingselector'.
- **BUGFIX**: numerated-headers plugin: Fixed numeration, when the headers are not starting with the highest level (e.g. when using h2 h1 h2 h3, the first h2 will be omitted and numeration will start at the h1)
- **BUGFIX**: core: fixed missing space when selecting a word between two spaces and deleting (by [DEL] or [BACKSPACE]). The result will now be like expected: having the cursor between two spaces.
- **BUGFIX**: characterpicker-plugin: Fixed inserting characters with a non-collapsed selection. Instead of adding the character after the selection, the inserted character will now replace the selection (like expected).
- **BUGFIX**: paste-plugin: Disabled handling paste on IE by executing the command 'paste', because this causes incorrect cursor positions after pasting.
- **BUGFIX**: paste-plugin: Fixed setting focus and selection into the editable before inserting pasted html. That fixes strange behaviour in FF after pasting.

## 0.20.15 - 2012/06/27

- **BUGFIX**: core: Fixed browser crashes in IE9 (and above), after splitting DOM nodes using ENTER and placing the cursor afterwards, that occurred due to a browser bug in IE9

## 0.20.14 - 2012/06/27

- **ENHANCEMENT**: A whole lot of Plugins can now be configured editable-specific configuration: abbr, highlighteditables, list, horizontalruler, link, paste, headerids, listenforcer, metaview, numerated-headers, wai-lang, cite, characterpicker, formatlesspaste, dom-to-xhtml. Have a look at the individual plugin guides for detailed information on how to configure them.
- **ENHANCEMENT**: Added functional description for plugins
- **ENHANCEMENT**: plugin numerated-headers: will now be more tolerant with its configuration options
- **ENHANCEMENT**: sanitize contenthandler: Added 'del' as allowed element to the default configuration of the sanitize contenthandler.
- **ENHANCEMENT**: repository browser: searches in the repository browser will now be done recursively.
- **ENHANCEMENT**: plugin formatlesspaste: will now be more tolerant with the button and formatlessPasteOption setting and not only accept boolean values
- **ENHANCEMENT**: plugin cite: will now be more tolerant with the sidebar.open setting and not only accept boolean values. Additionally, the default config will now show both the quote and blockquote button.
- **BUGFIX**: core: When using the delete button in IE7, so that after deleting the cursor is supposed to be in between two spaces, some unexpected text "undefined" was added to the editable. This has been fixed now.
- **BUGFIX**: metaview: Fixed bug that caused a javascript error when no configuration was provided for the metaview plugin.
- **BUGFIX**: core: Fixed a bug within jquery that caused problems in IE9 when invoking getContents for an editable that contains an embedded object (e.g. flash player).
- **BUGFIX**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
- **BUGFIX**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
- **BUGFIX**: repositorymanager: Fixed a bug in the repository manager that caused an javascript error when no result items were passed to the processResults method.
- **BUGFIX**: generic contenthandler: Do not trim text nodes in list elements, because this could remove spaces between words, where one word is formatted.
- **BUGFIX**: plugin format: The format plugin will now support 'del' instead of 's' for strikethrough ('s' is deprecated), like explained in the documentation.
- **BUGFIX**: plugin metaview: Metaview plugin would add a grey backdrop to lists on IE7. Added more specific styles.
- **BUGFIX**: core: Implemented deleting tables with "delete" or "forwarddelete" commands (pressing [DEl] or [BACKSPACE]). 
- **BUGFIX**: core: Fixed strange cursor behaviour when using [BACKSPACE] to delete the first character in a text node, using IE9. 
- **BUGFIX**: enumerated-headers plugin: Added default configuration, which fixes some javascript error, if no other configuration is set.
- **BUGFIX**: wai-lang plugin: Fixed toggle button to be pressed when a language is set, and unpressed if not. Hide language tab, when language is removed.

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
- **BUGFIX**: core: Fixed the fix for IE7 crashes
- **BUGFIX**: core: Fixed Javascript errors that occurred in IE7 when pressing Enter at the end of paragraphs (multiple times).
- **BUGFIX**: core: Fixed possible Javascript error when cleanup operation is done (e.g. after pasting text into an editable).
- **BUGFIX**: commands: Fixed possible browser hang (due to an infinite loop) that occurred, when using the command 'inserthtml' to insert content into an editable span, that is not allowed inside a span (e.g. a h1). This browser hang could occur when using the paste plugin to paste content, since that uses the command 'inserthtml'.
- **BUGFIX**: generic contenthandler: Changed to always remove div, span and font tags, regardless of the setting of the contentEditable attribute. This fixes problems, when e.g. having an editable span and then pressing [CTRL-A] [CTRL-C] [CTRL-V].
- **BUGFIX**: commands: Fixed unwrapping of tags in fixDisallowedAncestors, which possibly removed the editing host when pasting into spans, h1, ...
- **BUGFIX**: sanitize contenthandler: disabled for IE7, because it does not work well in IE7 (sanitize tries to set attributes via setAttributeNode() to DOM Elements, and this does not work for the "style" attribute in IE7)
- **BUGFIX**: commands: fixed weird behaviour when using the backspace key to delete text (cursor was jumping).
- **BUGFIX**: core: Fixed enter behaviour in lists. Before executing command "insertparagraph", whitespace textnodes around list elements are removed, because the algorithm isn't prepared to handle whitespace textnodes.
- **BUGFIX**: citation plugin: Fixed javascript errors on initialization and possible endless loop when adding inline citations.

## 0.20.12 - 2012/05/24

- **MANUAL CHANGE**: wai-lang: The wai lang plugin will now fail loading when the flag-icons plugin was not loaded. Previously the plugin did not fail loading but showed broken flag icon images. Please note that it is currently mandatory to add third party dependencies for some plugins to the data-aloha-plugins attribute otherwise those dependencies can't be resolved correctly.
- **BUGFIX**: browser-plugin: The browser will now open at a more centered position.
- **BUGFIX**: core: A IE7 crash workaround was reverted because it caused all eventhandlers to be lost when getContents() was invoked. The new workaround will remove the jquery expando attributes in IE7 for some elements.
- **BUGFIX**: core: Fixes bugs in the handeling of delete and forward delete. These bugs were introduced in an attempt to fix issues with deleting behaviour near multiple white spaces.  An alernative should be sought for a better solution for handeling white spaces.

## 0.20.11 - 2012/05/10

- **BUGFIX** image plugin: fixes distorted images when in portrait format
- **BUGFIX** table plugin: fixes bug in IE7 that second click on table cell was not activating the table
- **ENHANCEMENT** link plugin: removed linklist (and slowlinklist) which where loaded by default (we should not force everyone to have them active by default)
- **BUGFIX**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups.
- **BUGFIX**: browser-plugin: In some cases a javascript error would be thrown when using the browser plugin with Internet Explorer. IE does not support 'new Image' calls within popups.
- **ENHANCEMENT**: browser-plugin: The browser plugin will now calculate the browser width automatically.
- **BUGFIX**: IE7 - #516 navigate with arrow keys through several paragraphs
- **BUGFIX**: IE7 - #515 gray text after list
- **ENHANCEMENT**: Removed unwanted behaviour from the block plugin's sidebarattributeedtior, which will clear out the whole sidebar when loaded
- **BUT**: floatingmenu: Fixed regeneration of ext components for floatingmenu, when buttons are added after the floatingmenu was initialized
- **FEATURE** plugin: Adding the sourceview plugin, which visualizes the current selection in the sidebar to help developers of Aloha Editor with debugging.

## 0.20.10 - 2012/04/17

- **BUGFIX**: core: Fixed a typo in the previous bugfix: Fixed a javascript error in IE9 stating that the method createContextualFragment doesn't exist

## 0.20.9 - 2012/04/16

- **BUGFIX**: block-plugin: Fixed 'e.srcElement is undefined' error in blockmanager.js which affected firefox 11
- **BUGFIX** floatingmenu: Fixed problem with creating new buttons after Aloha is ready.
- **ENHANCEMENT**: updated integration of Aloha Blocks to the most recent version
- **BUGFIX** floatingmenu: Fixed problem with showing floatingmenu shadow too early
- **BUGFIX** core: Fixed a permission error in Firefox, when Aloha Editor tried to access a document property of an external ressource
- **BUGFIX** table-plugin: Fixed the cleanup of the table cells on blur not cleaning up correctly (caused by a typo in the element class)
- **BUGFIX** core: Fixed a javascript error in IE9 stating that the method createContextualFragment doesn't exist (fixed in extjs)

## 0.20.8 - 2012/04/06

- **BUGFIX** core: UP and DOWN cursor key will now not be processed specially by Aloha, they will be left to native handeling.
- **BUGFIX** core: Adds a guard in `execCommand()' to prevent `INDEX_SIZE_ERR' exceptions.
- **BUGFIX** core: The cursor processing around non-contenteditable elements (blocks) was not functioning as described or desired.  It now behaves with more stability especially on Internet Explorer.
- **ENHANCEMENT** core: Improved efficiency of cursor processing, especially around blocks.
- **FEATURE** core: It is now possible to place the caret between two adjecent non-contenteditable elements.
- **ENHANCEMENT** core: The jquery-plugin require plugin will now be able to return loaded plugins. Previously loaded plugins were just accessible through the extended jquery object.
- **FEATURE** editable.js: introduced method setContents() -- use Aloha.getEditableById('my-editable').setContents('Aloha World') to set the contents of the editable with the ID my-editable
- **BUGFIX** smartContentChange is now again triggered when pressing enter key; and new: delete / backspace keys
- **ENHANCEMENT** enabled image plugin in boilerplate demo. needs some enhancements to be more user friendly
- **BUGFIX** align plugin: Fixed alignment behavior and place the buttons in the format tab instead of a new one.
- **FEATURE** hints plugin: Implemented using Tipsy as tooltip library and the latest Aloha-Editor plugin standard.
- **ENHANCEMENT** block plugin: added data-attribute to prevent triggering scope changes when a block is activated
- **ENHANCEMENT** block plugin: revamped colors for highlighting blocks
- **BUGFIX** updated dom.js to reflect HTML5 spec changes; format with u and i tags is now available; updated default button config
- **ENHANCEMENT** config options per editable for plugin common/horizontalruler and extra/toc
- **ENHANCEMENT** configure the sidebar handle position via Aloha.settings.sidebar.handle.top
- **ENHANCEMENT** table plugin: disable split / merge cell buttons when not possible to use
- **ENHANCEMENT** dom-to-xhtml plugin: non-specified attributes are excluded from serialization, making attribute serialization more consistent on IE7 and IE8.
- **FEATURE** API docs: added first version of new API docs
- **FEATURE** HotKey feature added for link, format and wai-lang plugin
- **ENHANCEMENT** load plugins via config option
- **BUGFIX** added missing endprologue. and regenerated guides; jslint for image plugin
- **ENHANCEMENT** Added very simple example for loading Aloha Editor. Simplyfied "Using Aloha Editor" guides page.
- **ENHANCEMENT** adding documentation about Aloha Editor events

## 0.20.7 - 2012/03/07

- **BUGFIX** link: fixed a bug in the link list static repository plugin that would cause aloha to fail when no settings for the linklist repository were specified.
- **BUGFIX** formatlesspaste plugin: fixed IE syntax error caused by a comma at the end of a list.

## 0.20.6 - 2012/03/01

- **BUGFIX** link: fixed a bug in the link list static repository plugin that caused Internet Explorer to fail handling repository links.
- **BUGFIX** dom-to-xhtml plugin: fixed attribute names are not lowercased
- **BUGFIX** floatingmenu: fixed floating menu's reading of configuration values
          so that they are parsed into numbers.
- **BUGFIX** floatingmenu: fixed floating menu positioning when view port is
          scrolled so that it takes into account the aligntopOffset setting.

- **ENHANCEMENT** Added jslint setup to guides and fixed error output in build script.
- **ENHANCEMENT** The new plugin dom-to-xhtml attempts to create a valid XHTML serialization of the document when getContents() is called.
- **BUGFIX** Paste plugin: paste into an editable in an editable is now working
- **BUGFIX** Selection of content in an contenteditable=false which is not a child of an Aloha Editor instance now works like expected
- **ENHANCEMENT** Repositories: It is now possible to configure the timeout for querying repositories.
- **ENHANCEMENT** Floating menu: It is now possible to configure the floating menu to be 'append' to an other element. It is needed to set an extra option 'element' with the ID of the HTML DOM element where the fm should be attach to. The floating menu is attached to the same position as the 'element'.
- **ENHANCEMENT** Floating menu: If the floating menu is set to be not draggable, the drag&drop bar + pin will not be shown
- **BUGFIX** engine.js: insert paragraph was sometimes broken in IE7 (copy of empty/all p-element attributes)
- **ENHANCEMENT** updated plugin: table of contents (toc) to work with the current Aloha Editor version
- **BUGFIX** characterpicker plugin: fixed cursor position after inserting a character
- **ENHANCEMENT** Browser plugin: loading of required jQuery plugins is now changed so all can be loaded via CDN


## 0.20.5 - 2012/02/09

- **ENHANCEMENT** word contenthandler: cleanup for pasted word documents with table of contents
- **BUGFIX** paste plugin: removed trim of pasted contents -- test[ text] + 2x c&p results now in test text text instead of testtexttext
- **BUGFIX** format/table plugin: added a workaround in the format plugin to enable formating of selected cells
- **ENHANCEMENT** cite plugin: config option if sidebar should auto open or not (Aloha.settings.plugins.cite.sidebar.open: true|false)
- **BUGFIX** The link plugin won't use a scope but will now hide/show it's buttons directly.
- **BUGFIX** Fixed the way the table plugin unwrapped it's cell contents when deactivating a table - all dom object references where lost before. Now the objects are truly unwrapped, and just moved up one step within the dom structure.

## 0.20.4 - 2012/01/27

- **BUGFIX** core: fixed IE7 browser crash caused by dereferencing element attributes.
- **BUGFIX** floatingmenu: Fixed positioning of floating menu when it extends
          beyond the width of the viewport


## 0.20.3 - 2012/01/24

- **BUGFIX** floatingmenu: Fixed float position of floatingmenu when it moves
          between editables.
- **BUGFIX** core: Removes ExtJS' IE6 style fixes which break layout in IE9.
- **BUGFIX** image-plugin: The image plugin will now only display the crop buttons
          when the cropping area selection was finished. This avoids a bug in
		  Internet Explorer 7 where the crop area could not be resized once the
		  user entered those crop buttons.
- **BUGFIX** core: Fixed floating menu pinning with topalign behaviour
          (topalignOffset, horizontalOffset)


## 0.20.2 - 2012/01/19

- **BUGFIX** image-plugin: Replaced unicode characters in the crop buttons with
          images to fix display issues within Internet Explorer 7.
- **BUGFIX** core: Fixed problem where Internet Explorer 7 and jquery.store will
          not work with frames since it will fallback to window.name storage.
		  We'll now use a void storage for IE7. This means that IE7 will not be
		  able to store floating menu postion and other settings.
- **BUGFIX** core: Fixed problem of Internet Explorer 7 crashing when invoking
          jQuery's `removeAttr`.
- **BUGFIX** html5shims: Function `getRootParent` in ecma5schims.js no longer
          throws an error when `null` or `undefined` is passed to it.
- **BUGFIX** core: fixed incorrect dependency on jquery.json-2.2 where util/json2
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
- **BUGFIX** floatingmenu: fixed a bug with topalign behaviour where scrolling
          would attach the floatingmenu to the left side of the screen.


## 0.20.0-RC9 - 2011/12/07

- **BUGFIX** image-plugin: The saved aspect ratio will now be correcly
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
- **BUGFIX** customizable numerated-header plugin: when header content is deleted,
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
- **BUGFIX** core: The aloha-editable-activated will now no longer invoked twice.
- **BUGFIX** image-plugin: Fixed handling of width and height when the user
          entered the cropping mode. You can resize the crop area by entering
		  values in the width and height field. 
- **BUGFIX** list-plugin/link-plugin: The list plugin interfered with the link
          plugin behaviour. Previously it was not possible to create links
		  within a list due to a bug within the list plugin. The list plugin
		  will now no longer use the Aloha.List scope.
- **BUGFIX** link-plugin: Fixed problem with auto-suggestion mechanism for the
          link input field causing the the wrong href value to be taken.


## 0.20.0-RC7 - 2011/11

- **BUGFIX** link-plugin: Fixed javascript error that occured when linking items
          using the repository browser in Internet Explorer 8.
- **BUGFIX** boilerplate demo: Fixed javascript error that occured in Internet
          Explorer 8.
- **ENHANCEMENT** flag-icons plugin: It is now necessary to add the flag-icons
                  plugin in the aloha plugin load order before any plugins that
				  need to use the shared flag icons.
- **ENHANCEMENT** metaview-plugin: Fixed metaview plugin to use shared flags
                  icon from flag-icons plugin, for consistancy between plugins.
- **ENHANCEMENT** wai-lang-plugin: Improved wai-lang language selection ui.
                  Organized flags to be in a plugin their own plugin so that
				  the icons can be shared between other components.
- **BUGFIX** link-plugin: The autocomplete list is now closed properly when esc
          was pressed.

## 0.20.0-RC6 - 2011/11

- **BUGFIX** link-plugin/linkbrowser-plugin: Previously the highlight css for a
          link was not removed after an item was selected by the linkbrowser.
		  Now highlight css will be correctly removed and the cursor will be
		  placed back into the content. Previously the selection was lost.
- **BUGFIX** table-plugin: Fixed a bug that deactivated tables after 5 seconds.
          This issue was caused by a failure within the table registry. Instead
		  of loading the cloned object the original table was loaded and
		  deactivated.


## 0.20.0-RC5 - 2011/11

- **BUGFIX** link-plugin: The link plugin will no longer remove repository data
          attributes from the link when the user clicks a link and leaves it
		  imediately. Previously those repository data attributes where removed
		  when the repository lookup was not finished on time (before the user
		  left the link). For the user the repository link was transformed to a
		  normal link. This is now fixed.


## 0.20.0-RC4 - 2011/11

- **BUGFIX** FloatingMenu: The FloatingMenu will now check the
          Aloha.settings.floatingmenu.topalignOffset parameter to be not
		  undefined, as checking for 'number' was too strict


## 0.20.0-RC3 - 2011/11

- **FEATURE** link-plugin: The default behaviour for the link plugin has
              changed. Links with empty hrefs will not be removed automatically
			  any longer - removing the current href has to be confirmed by
			  pressing enter to delete the link itself. Use the unlink button
			  to remove the link directly.


## 0.20.0-RC2 - 2011/11

- **BUGFIX** link-plugin: Fixed bug in link-plugin, which prevented correct
          selection of items from the repository browser when creating a link
		  on a fresh page
- **BUGFIX** browser-plugin: Fixed a bug that prevented the browser plugin to load
          its dependencies correctly.


## 0.20.0-RC1 - 2011/11

- **BUGFIX** link-plugin: Fixed a bug that prevented correct selection of items
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
