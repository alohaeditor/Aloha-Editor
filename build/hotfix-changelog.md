All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: numerated-headers plugin: Fixed misleading interpretation of the 'numeratedactive' for configuration per editable. 'numeratedactive' will now only determine, whether headers shall be numerated by default (if button not unclicked by the editor). To disable the function for an editable, choose an empty 'headingselector'.
- **BUG**: numerated-headers plugin: Fixed numeration, when the headers are not starting with the highest level (e.g. when using h2 h1 h2 h3, the first h2 will be omitted and numeration will start at the h1)
- **ENHANCEMENT**: numerated-headers plugin: Added configuration option 'trailingdot' to switch format of generated headers.
- **BUG**: core: fixed missing space when selecting a word between two spaces and deleting (by [DEL] or [BACKSPACE]). The result will now be like expected: having the cursor between two spaces.
- **BUG**: characterpicker-plugin: Fixed inserting characters with a non-collapsed selection. Instead of adding the character after the selection, the inserted character will now replace the selection (like expected).
