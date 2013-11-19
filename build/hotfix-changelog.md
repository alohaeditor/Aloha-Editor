All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: blocks: The dragging and dropping of Aloha Blocks has been fixed
              to no longer use jQueryUi's sortable().  Aloha Editor's own
              functionality is to be used instead.  This allows implementers to
              use sortable() to enable drag and drop for blocks which are
              inside of blocks that have been made draggable by Aloha Editor.
              RT#56973
