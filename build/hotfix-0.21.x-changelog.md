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

- **ENHANCEMENT**: Added a new block implementation of Aloha Editor blocks, which 
				   doesn't render any tag fill icons or borders. This is useful for 
				   tags that should be editable with Aloha Editor.

				   To use this block type, just wrap your tag content in a <div> 
				   with the following attribute: 

				   data-aloha-block-type="EmptyBlock"
