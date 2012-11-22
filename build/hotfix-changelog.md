All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: formatlesspaste-plugin: Formatless Paste Plugin fixed to correctly
           process configuration settings.
- **BUG**: table-plugin: Ensures that the range is maintained when clicking
		   inside table cells.
- **BUG**: the underline button didn't show up in the toolbar
           after adding the 'u' in the format-plugin configuration.
- **BUG**: All repositories have been queried even if a target repository has been spezified. Now only the spezified repository is queried.
- **BUG**: core/aloha-links: Prevents yellow borders around aloha-links blocks
- **BUG**: link-plugin: link scope remains active after the selection leaves an anchor element
- **BUG**: blocks: The floating menu will appear when the editor double-clicks
           in an editable block.
- **BUG**: core/selection: Aloha no longer inadvertently removes ranges that
		   are outside of editables.
- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
- **ENHANCEMENT**: table plugin: IE fix -- the selection of multiple cells was not possible when the selection started in the text; there was no workaround so it's now possible to select coherent cells when you "shift-click" into the second cell of the range you want to select
- **BUG**: characterpicker: popup now follows the floating menu while scrolling
- **BUG**: dom utils: fixes potential bug that may cause attributes with the
	   slash '/' character in the name to appear in the result of
	   getContents().
- **BUG**: word content handler: Fixed handling of pasted MS Word content to
           not result in broken markup when the content contains tables with
           cells that are all empty.
- **BUG**: core/plugins: Fixed plugin initialization to ensure that the
           "aloha-ready" event is not fired before all plugins have notified
           that they are fully initialized.
