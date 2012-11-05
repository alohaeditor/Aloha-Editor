All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----
- **BUG**: All repositories have been queried even if a target repository

	has been spezified. Now only the spezified repository is queried.

- **FEATURE**: core: makeClean is in the process of being obsoleted in favor of the aloha/ephemera.js module. See http://aloha-editor.org/guides/writing_plugins.html
- **BUG**: core/aloha-links: Prevents yellow borders around aloha-links blocks
- **BUG**: link-plugin: link scope remains active after the selection leaves an anchor element
- **BUG**: blocks: The floating menu will appear when the editor double-clicks
           in an editable block.
- **BUG**: core/selection: Aloha no longer inadvertently removes ranges that
		   are outside of editables.
