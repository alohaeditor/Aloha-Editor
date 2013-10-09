All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: tables: When selection is placed into table, all other tables will
              now have their visual selection removed.

- **BUGFIX**: tables: The Row and Column floating toolbar tabs will now be shown
              at the first click of a row or column.

- **BUGFIX**: tables: Selecting inside of tables will no longer results in
              sometimes having the selection deselected on mouseup in IE.

- **BUGFIX**: blocks: Blocks will immediately be given padding landing areas (if
              needed) as soon as they are inserted into active editables.

- **BUGFIX**: tables: It is now possible to click once and start editing table
              summaries.

- **BUGFIX**: tables: It is now possible to delete entire rows or columns using
              the delete key.

- **BUGFIX**: Formatless Copy/Paste not working.
              When paste action was made the formatlesshandler was never called.
              We manually call this handler before pasting the content into the DOM element.
              RT#56692
