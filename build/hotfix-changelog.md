All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: Creation of several links or abbreviation is not fill with the same value.
              When create several links in different paragraphs or item list
              the value is not set the same for all the links but only for the first
              in the range selection.

              Changes were made so several links or abbreviation in the same selection
              have the same value. RT#55298
