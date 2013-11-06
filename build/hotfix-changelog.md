All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----


- **BUGFIX**:      Change table cell size by drag & drop
                   The line which is shown when you drag & drop the size of cell,
                   is not showed for the last row or last column. RT#55437

- **BUGFIX**:      Tooltip covers color palette
                   The colors tooltip does not disappear when the color palette is shown.
                   RT#57078

- **BUGFIX**: Formatless Copy/Paste not working.
              When paste action was made the formatlesshandler was never called.
              We manually call this handler before pasting the content into the DOM element.
              RT#56692
