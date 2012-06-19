All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **ENHANCEMENT**: Removed unwanted behaviour from the block plugin's sidebarattributeedtior, which will clear out the whole sidebar when loaded
- **ENHANCEMENT**: added / updated guides for plugins
- **ENHANCEMENT**: enabled linklist.js so it's possible to use the settings for your own list (removed the default entries)
- **ENHANCEMENT**: table plugin: enabled format tab when a whole row/column is selected via click on the row/column header
- **ENHANCEMENT**: sanitize contenthandler: allow attribute target for the a element in the relaxed config
- **ENHANCEMENT**: plugin highlighteditables: configurable per editable; CSS can be adapted;
- **ENHANCEMENT**: added a new helper function jQuery.isEmpty() to check if a mixed var is empty or not
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
- **ENHANCEMENT**: A whole lot of Plugins can now be configured editable-specific configuration: abbr, highlighteditables, list, horizontalruler, link, paste, headerids, listenforcer, metaview, numerated-headers, wai-lang, cite, characterpicker, formatlesspaste, dom-to-xhtml. Have a look at the individual plugin guides for detailed information on how to configure them.
- **ENHANCEMENT**: Added functional description for plugins
- **BUG**: core: When using the delete button in IE7, so that after deleting the cursor is supposed to be in between two spaces, some unexpected text "undefined" was added to the editable. This has been fixed now.
- **BUG**: metaview: Fixed bug that caused a javascript error when no configuration was provided for the metaview plugin.
- **BUG**: core: Fixed a bug within jquery that caused problems in IE9 when invoking getContents for an editable that contains an embedded object (e.g. flash player).
- **BUG**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.