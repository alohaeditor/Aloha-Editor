All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUGFIX**: fixed handling of closing angle brackets in the DOM-to-XHTML
              plugin, which caused problems when these were includes in
              attributes.

- **BUGFIX**: Character-plugin: Fixed the overlay not defining a font color
              for the characters in the overlay and inheriting the color from
              the content. If the font color was white the text in the overlay
              wasn't visible.
