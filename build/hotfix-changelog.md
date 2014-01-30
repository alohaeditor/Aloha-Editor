All changes are categorized into one of the following keywords:

- **BUGFIX**: core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: xyz-plugin: The change introduces a new feature, or modifies the
               function, usage, or intent of an existing one.

----

- **BUGFIX**: core: Performances fixes introduced a regression which resulted
              in pressing ENTER to break paragraphs incorrectly.  This has been
              fix so that pressing enter in an empty editable will result in a
              new paragraph being inserted after rather than before. RT#57660

- **BUGFIX**: align plugin: Setting alignment to content inside of a table cell
              will no longer result in all of the content in the cell being
              aligned, but only the content that is selected (up to the nearest
              block-level element).

- **BUGFIX**: drag-n-drop: Dragging a block element into an non-editable region
              resulted in a JavaScript error. This error caused HTML artifacts
              to be left in the region. Fixing the  JavaScript error corrects
              this behavior. RT#57629

- **BUGFIX**: copy-pate: Copy and paste text content from MS-Word to Aloha content
              in IE9 Browser, added line break between paragraphs. When
              copying from MS-Word unrendered whitespaces are added between
              paragraphs and are rendered as lines break for Aloha Editor.
              Removing these unrendered whitespaces solves the line break problem.
              RT#57725

- **BUGFIX**: button tooltip: 'Insert Table' button tooltip did not disappear when selecting
              the rows and the columns of the table. This has been fixed so the tooltip does
              disappear. RT#57677


