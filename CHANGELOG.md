# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](https://github.com/alohaeditor/Aloha-Editor/wiki/Roadmap)


All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **MANUAL CHANGE**: The change requires changes to existing implementation.


## 0.21.0 - 2012/07/26

- **MANUAL CHANGE**: Updated naming from Aloha to Aloha Editor in boilerplate demo.

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
- **BUG**: abbr-plugin: Fixed a javascript error when Aloha.activeEditable.obj / Aloha.activeEditable was not defined
- **BUG**: fixing placeholder bug where it appears twice in some cases
- **BUG**: commands.delete: fixed a bug with the delete command when contents are preceded by ignorable whitespace. also added a delete test for that.
- **BUG**: image plugin: building a selection from scratch when an image is clicked isn't safe as conflictual browser behaviours
- **BUG**: image plugin: containing editable not selectable after image plugin activation.
- **BUG**: image plugin: when plugin activated on an image, clicking a second image don't disable resize on first one.
- **BUG**: image plugin: fixing focus and value of srcField when image is clicked (previously handled by selectionChange)
- **BUG**: fixes alohaeditor/Aloha-Editor##424 -- SmartContentChanged is not triggered when hitting
- **BUG**: browser: fixes alohaeditor/Aloha-Editor#415 -- Repositorie entries appears twice in explorer
- **BUG**: browser: fixes alohaeditor/Aloha-Editor#460 -- Error when multiple repositories are configured
- **BUG**: block sidebar attribute editor: when using backspace/del in an input field the block was removed
- **BUG**: cite-plugin: Fixed a javascript error when the cite plugin had no explicit sidebar configuration.

- **DISCUSS**: It would make sense to support also input (like textarea) elements
    eg. for basic formattings like strong / em -- but prevent insertation of br / p ?


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

## 0.20.8 - 2012/04/06

- **BUG** core: UP and DOWN cursor key will now not be processed specially by Aloha, they will be left to native handeling.
- **BUG** core: Adds a guard in `execCommand()' to prevent `INDEX_SIZE_ERR' exceptions.
- **BUG** core: The cursor processing around non-contenteditable elements (blocks) was not functioning as described or desired.  It now behaves with more stability especially on Internet Explorer.
- **ENHANCEMENT** core: Improved efficiency of cursor processing, especially around blocks.
- **FEATURE** core: It is now possible to place the caret between two adjecent non-contenteditable elements.
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
