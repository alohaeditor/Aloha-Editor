All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: Editable.getContents(true) doesn't make defensive copies
	Invoking Editable.getContents(true) multiple times in a row would return
	the same object, causing unexpected behaviour when client code modified that object.
