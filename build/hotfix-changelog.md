All changes are categorized into one of the following keywords:

- **BUGFIX**:      core: The change fixes a bug.
- **ENHANCEMENT**: ui: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: xyz-plugin: The change introduces a new feature, or modifies the
               function, usage, or intent of an existing one.

----

- **BUGFIX**: formatlesspaste plugin: The strippedElements config parameter was
              previously ignored and is now respected again. If no configuration
              is specified for it, a default list of text level semantic elements
              is used.
