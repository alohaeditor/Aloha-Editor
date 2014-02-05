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

- **BUGFIX**: core: (Internet Explorer) When using the cursor keys to move the
              cursor up and down across blocks (non editable areas) it was possible
              to actually place the cursor inside the block. The cursor would be
              trapped in this state and using the cursor up/down keys would scroll
              the page up and down (with some strange rendering of the cursor).
              This has been fixed now to prevent entering non editable areas with
              the cursor. #RT57706
