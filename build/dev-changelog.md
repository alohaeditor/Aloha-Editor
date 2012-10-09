All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----
- **BUG**: Fix base tag breaks Aloha Editor UI
- **ENHANCEMENT**: Trigger the 'aloha-smart-content-changed' event with `triggerType` = `block-change` whenever an attribute of an Aloha Block is changed.
- **FEATURE**: improved translation export from gengo.com to Aloha Editor
	<code>
	Aloha.settings.plugins: {
		captionedImage: {
			allowLinebreak: [ 'p' ], // ['br', 'p'], true or false (default)
		}
	}
	</code>

- **MANUAL CHANGE**: Updated UI CSS regarding button selector;
- **MANUAL CHANGE**: Added a demo of placeholders to boilerplate;
- **BUG**: Fix calling mahalo in a blur event handler
- **BUG**: Fix support for editable anchor elements
- **BUG**: images-plugin: global fix and debug interactions with draganddropfiles
- **BUG**: draganddropfiles-plugin: fix for Firefox in order to send fileName
- *ENHANCEMENT**: draganddropfiles-plugin: Send id target element in headers to inform the server where in page the file has been dropped
