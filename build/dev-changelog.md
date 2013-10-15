All changes are categorized into one of the following keywords:

- **BUGFIX**: The change fixes a bug.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.

----

- **BUGFIX**: Header ID not showing when an Heading is created
              The solution to the problem is that every time the selection is in
              Heading, check for ID attribute and if ID doesn't exists, it creates it.
              RT#56670