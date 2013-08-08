All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**:      core: Fixed selection bug in FF where it was possible to move the selection
                   into a HR (by clicking on it)
- **BUGFIX**:      textcolor: The button for changing the textcolor can no longer be accidentally
overwritten by custom background images.
- **BUGFIX**:      table: The table plugin will now handle pressing down in the last cell as well
				   as pressing up in the first cell by positioning the cursor directly before or after the table.
- **FEATURE**:     autoparagraph-plugin: The Autoparagraph Plugin checks the contents of editables
                   and wraps content that is not contained in block level elements into paragraphs.
- **BUGFIX**:      table-plugin: The table plugin will now not lose the drag handles any more, when getContents()
                   is called for the editable (which is done on smart content change)
