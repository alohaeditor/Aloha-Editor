All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**:	   core: An IE bug that caused editables to not be activated correctly upon the first mouseclick was resolved. 
			 Previously the cursor position inside the editable was not set. The user had to click twice to place the cursor correctly. RT#57224
- **BUGFIX**:	   autoparagraph: The autoparagraph plugin will now fill empty editables with an paragraph. RT#57660
