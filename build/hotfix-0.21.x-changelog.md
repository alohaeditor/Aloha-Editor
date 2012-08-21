All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: the sidebar didn't always update the height of panels correctly.

- **ENHANCEMENT**: error was turned into a warning

	The error message "encountered range object without start or end
	container" was incorrectly logged as an error instead of a
	warning.

- **BUG**: Fixed JS error in Aloha.unbind()

- **ENHANCEMENT**: Added jQuery method mahaloBlock() to "unblock" the elements from a jQuery collection. Added method .unblock() for Blocks to "unblock" a block instance (in both cases without removing the DOM element from the DOM).

- **BUG**: Fixed adding of unwanted <span>'S before tables every time an editable was deactivated when the table plugin and block plugin was used.
