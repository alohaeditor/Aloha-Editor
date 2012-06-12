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
