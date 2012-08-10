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

- **ENHANCEMENT**: Addition to the API
	Aloha.Editable.setContentSerializer() was added to the API.
	Aloha.Editable.getContentSerializer() was implemented and added to the API.


- **BUG**: image-plugin: The reset image button function was fixed. Previously a javascript error occured when the button was pressed.

- **BUG**: wai-lang-plugin: language annotations were not enhanced
	The short name ('de') of language annotations was displayed
	instead of of the full name from the repository ('German').

- **BUG**: block-plugin: selection was lost when using the cursor keys to move across inline blocks
