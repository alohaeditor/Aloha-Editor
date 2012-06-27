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
- **BUG**: FloatingMenu: in IE the FloatingMenu would not be clickable after deleting a table row because of a transparent .ext-shim iframe layered on top of it. Forcefully removed the iframe from the layout.
- **BUG**: repositorymanager: Fixed a bug in the repository manager that caused an javascript error when no result items were passed to the processResults method.
- **BUG**: generic contenthandler: Do not trim text nodes in list elements, because this could remove spaces between words, where one word is formatted.
- **BUG**: plugin format: The format plugin will now support 'del' instead of 's' for strikethrough ('s' is deprecated), like explained in the documentation.
- **ENHANCEMENT**: sanitize contenthandler: Added 'del' as allowed element to the default configuration of the sanitize contenthandler.
- **ENHANCEMENT**: repository browser: searches in the repository browser will now be done recursively.
- **BUG**: plugin metaview: Metaview plugin would add a grey backdrop to lists on IE7. Added more specific styles.
- **ENHANCEMENT**: plugin formatlesspaste: will now be more tolerant with the button and formatlessPasteOption setting and not only accept boolean values
- **BUG**: core: Implemented deleting tables with "delete" or "forwarddelete" commands (pressing [DEl] or [BACKSPACE]). 
- **ENHANCEMENT**: plugin cite: will now be more tolerant with the sidebar.open setting and not only accept boolean values. Additionally, the default config will now show both the quote and blockquote button.
- **BUG**: core: Fixed strange cursor behaviour when using [BACKSPACE] to delete the first character in a text node, using IE9. 
- **BUG**: enumerated-headers plugin: Added default configuration, which fixes some javascript error, if no other configuration is set.
- **BUG**: wai-lang plugin: Fixed toggle button to be pressed when a language is set, and unpressed if not. Hide language tab, when language is removed.
- **ENHANCEMENT**: plugin numerated-headers: will now be more tolerant with its configuration options
