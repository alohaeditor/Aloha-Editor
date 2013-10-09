All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.

----


- **BUGFIX**: Copy/Paste text don't insert content in the same line
              The problem was in the paste-plugin. A wrap tag was created to contain the copy content
              this tag was inserted in the DOM too.
              RT#56692
