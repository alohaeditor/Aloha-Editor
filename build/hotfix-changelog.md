All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **ENHANCEMENT**: A whole lot of Plugins can now be configured editable-specific configuration: abbr, highlighteditables, list, horizontalruler, link, paste, headerids, listenforcer, metaview, numerated-headers, wai-lang, cite, characterpicker, formatlesspaste, dom-to-xhtml. Have a look at the individual plugin guides for detailed information on how to configure them.
- **ENHANCEMENT**: Added functional description for plugins
- **BUG**: core: When using the delete button in IE7, so that after deleting the cursor is supposed to be in between two spaces, some unexpected text "undefined" was added to the editable. This has been fixed now.
- **BUG**: metaview: Fixed bug that caused a javascript error when no configuration was provided for the metaview plugin.
- **BUG**: core: Fixed a bug within jquery that caused problems in IE9 when invoking getContents for an editable that contains an embedded object (e.g. flash player).
- **BUG**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
