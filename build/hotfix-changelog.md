All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----


- **BUG**: plugin metaview: language annotations would result in background images being repeated over and over again - fixed that problem.
- **BUG**: format-plugin: removeFormat for quote and others (#577); enabled the useage of the u element (#580)
- **BUG**: core: Fixed copying of attributes when transforming DOM objects into other DOM objects (e.g. when transforming a list into a paragraph), which caused strange attributes to be written in IE, that caused editing problems (e.g. could not set cursor into paragraph, etc.)
- **BUG**: repository-browser: Some images for the repository browser were changed because Internet Explorer 7+8 don't know how to handle alpha in PNGs.
- **BUG**: repository-browser: Columns that are not sortable will now no longer be displayed like they were sortable.
- **BUG**: formatlesspaste-plugin: Fixed javascript error that ocurred when no custom editable configuration was set
- **BUG**: dom-to-xhtml-plugin: When used in IE7 (or IE8 in IE7 mode), classes of elements were removed. This lead to unexpected behaviour with the BR-tags with class aloha-end-br, that are automatically added, when using the blockelementcontenthandler.
- **BUG**: characterpicker-plugin: Fixed inserting a special character with a collapsed selection, when using IE.
- **BUG**: table-plugin: Enabled proper selection (with mouse or keys) in the editable caption of a table.
- **BUG**: table-plugin: When the contents of a table cell gains the focus, the whole cell is no longer selected. This also affects applying format to contents of a table cell.
- **BUG**: table-plugin: New Captions are now added as first child of the table (before the tbody), according to the HTML5 specification.
- **BUG**: table-plugin: The table plugin will now remove table id's on cleanup.
- **BUG**: numerated-headers-plugin: Fixed error that annotations would not be removed when converting a header to a paragraph. The plugin also added leading spaces to the heading's text. This was removed.
- **ENHANCEMENT**: contenthandler: Modified contenthandlers to allow language annotations made by the wai-lang plugin. This enables copy & paste of language annotations.
