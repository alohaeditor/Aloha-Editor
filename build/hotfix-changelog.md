All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUGFIX**: (blocks) The floating toolbar will now be shown when clicking
              inside of editables that are nested inside of standalone Empty
              blocks.

- **BUGFIX**: (ui) It is now possible to configure the toolbar to not float at
              all.

- **BUGFIX**: (format) It is no longer possible to use formatting hotkeys to
              apply disallowed formatting in an editable.

- **BUGFIX**: (contenthandler) The content sanitizer has been corrected to use
              the editable that is passed to it's handler() function rather than
              the currently active aditable.

- **BUGFIX**: (headerids) Fixed generation of invalid HTML ID's for headings when
              the headings start with a number.
