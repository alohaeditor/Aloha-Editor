All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**:     xyz-plugin: The change introduces a new feature, or modifies the function,
                   usage, or intent of an existing one.

----

- **BUGFIX**: block plugin: Fix the error "Member not found" occuring when initializing a block
              with links in it. This error occurs on IE 10 compatbility mode with document mode 7.

- **BUGFIX**: paste plugin: Pasting will no longer always break the line.
              A wrapping element will no longer be created to contain the copy
              content. RT#56692

- **BUGFIX**: header ids plugin: A header ID will now automatically be added as
              soon as the heading is created if the header id plugins is
              activated. RT#56670
