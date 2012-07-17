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
