All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.

----

- **BUGFIX**: Formatless Copy/Paste not working.
              When paste action was made the formatlesshandler was never called.
              We manually call this handler before pasting the content into the DOM element.
              RT#56692
