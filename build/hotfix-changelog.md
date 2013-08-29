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
- **BUGFIX**:      cite-plugin: Several issues with the citation plugin have been fixed: Pressing backspace in a 
                   blockquote will no longer wrap the blockquote into div's (which would break the behaviour).
                   The behaviour of pressing enter at the end of a blockquote multiple times has been changed to land
                   in a new empty paragraph after the blockquote (similar to lists).
                   When blockquote and quotes are nested, the controls of blockquote and quote will both show the
                   correct status now.
- **BUGFIX**:      repositorybrowser: Fix i18n of repository browser to use the language configured in Aloha.settings.locale
- **BUGFIX**: table plugin: The selection of table cells has been made more
              coherent.  A browser selection will be set on the entire content
              of the anchor cell of the virtual cell selection.
- **BUGFIX**: table plugin: Merging cell is now fixed to work correctly, after a
              previous fix introduced a bug through circular dependency.
- **BUGFIX**: utilities: Pressing backspace in a text node in a paragraph
			  adjacent to a table will now correctly delete the character to the
			  left of the cursor rather than jumping into the table.
- **BUGFIX**: table plugin: Merging table cells in IE8 will no longer result in
              the contents of merged cells from being lost.
- **BUGFIX**: table plugin: Pressing the tab key when the selection is in the
			  last cell of a table will correctly place the cursor in the first
			  cell of the newly created row.
