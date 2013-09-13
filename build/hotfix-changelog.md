All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: blocks: Improving features of new drag and drop implementation.
              1) Dropping a dragged block into itself will no longer result in
                 the block disappearing.
              2) It is no longer possible to accidentally drop the block into
                 the floating toolbar.
              3) Restore selection and scroll position after drop in Internet
                 Explorer.

