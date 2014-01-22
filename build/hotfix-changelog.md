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

