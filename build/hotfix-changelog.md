All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

**BUGFIX**: (core/engine) It is made possible to completely delete the contents
            of an editable while editing using commands like CTL+A, DEL.
**BUGFIX**: Cursor styles that are added inside tables for resizing are now
            correctly removed when the table is no longer editable.
**BUGFIX**: (table) This fix allows the active cell to be split into its parts
            if it has a col- or rowspan, even if it is not part of a selection.
