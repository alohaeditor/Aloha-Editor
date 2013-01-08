All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: table-plugin: Tables inside blocks will no longer be transformed
           into editable Aloha tables.
- **BUG**: table-plugin: Fixed the cursor problem with ie7. Now ie7 shows the 
           system default arrows.
- **BUG**: core: getEditableHost() returns nearest editable rather than the
           furthest.
- **BUG**: blocks: Selecting with <CTRL>+A, when inside of a nested editable,
           will now only select all of the contents of the immediate editable,
           rather the contents of parent editables as well.
- **BUG**: ui: Floating toolbar will attempt to adjust is positioning to remain
		   entirely in the viewport whenever possible.
- **BUG**: core: Fixes numerous issues with repository manager including how
           query() and getChildren() handle immediate, and asynchronous
           repositories.
- **BUG**: vendor/repository-browser: Updates repository browser with fix to
		   not listing repository folders mutliple times into wrong repositories
		   on the tree.
- **BUG**: core: Fixed disappearing attributes in browsers that do not support
           outerHTML.
- **BUG**: link-plugins: Fixed inserting of links so that links that span
           multiple elements are not unnecessarily split into fragments.
- **BUG**: image-plugin: Fix numerous bugs with resizing and cropping and
           improve overall usability
