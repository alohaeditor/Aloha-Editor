All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: xyz-plugin: The change introduces a new feature, or modifies the
               function, usage, or intent of an existing one.

----


- **BUGFIX**: core: (Internet Explorer) When using the cursor keys to move the
              cursor up and down across blocks (non editable areas) it was possible
              to actually place the cursor inside the block. The cursor would be
              trapped in this state and using the cursor up/down keys would scroll
              the page up and down (with some strange rendering of the cursor).
              This has been fixed now to prevent entering non editable areas with
              the cursor. #RT57706
              
- **BUGFIX**: link plugin: When typing the URL for a link and then pressing Enter,
              it creates the link but you must click tow times to open the link
              properties. The fix allows the user to click just once. RT#57711
