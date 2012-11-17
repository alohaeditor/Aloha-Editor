All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **ENHANCEMENT**: table plugin: IE fix -- the selection of multiple cells was not possible when the selection started in the text; there was no workaround so it's now possible to select coherent cells when you "shift-click" into the second cell of the range you want to select.
- **BUG**: formatlesspaste-plugin: Formatless Paste Plugin fixed to correctly
           process configuration settings.
- **BUG**: table-plugin: Ensures that the range is maintained when clicking
		   inside table cells.
- **BUG**: the underline button didn't show up in the toolbar
           after adding the 'u' in the format-plugin configuration.
- **BUG**: characterpicker: popup now follows the floating menu while scrolling

- **BUG**: dom utils: fixes potential bug that may cause attributes with the
	   slash '/' character in the name to appear in the result of
	   getContents().
