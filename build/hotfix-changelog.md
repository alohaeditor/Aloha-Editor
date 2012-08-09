All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----


- **BUG**: core: We now also remove jquery* attributes before the content is saved.
- **BUG**: core: We now log a warning to the console if repositories run into timeouts.
- **BUG**: wai-lang: We now load the language dataset in the query method. This fixes the issue that if the first request went wrong it was never loaded again.
- **BUG**: sidebar: The sidebar now remembers the current selection and refreshes itself when it is being opened.
- **BUG**: wordcontenthandler: Fixed the pasting of tables with empty cells.
- **BUG**: wordcontenthandler: Fixed the pasting of lists in chrome and IE9.
- **ENHANCEMENT**: link-plugin: Removed unwanted margins from the sidebar panel of the link attribute.