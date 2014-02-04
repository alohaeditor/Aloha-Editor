All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: xyz-plugin: The change introduces a new feature, or modifies the
               function, usage, or intent of an existing one.

----

- **BUGFIX**: table-plugin: (Firefox) Pressing tab in the last cell of last
              row creates a row, but the cursor was placed outside the
              table. With this fix the cursor is placed in the first cell of
              the created row. #RT57686

