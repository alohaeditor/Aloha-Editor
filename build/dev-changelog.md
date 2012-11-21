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
- **ENHANCEMENT**: Added a demo of placeholders to boilerplate;
- **BUG**: Fix calling mahalo in a blur event handler
- **BUG**: Fix support for editable anchor elements
- **BUG**: images-plugin: global fix and debug interactions with draganddropfiles
- **BUG**: draganddropfiles-plugin: fix for Firefox in order to send fileName
- **ENHANCEMENT**: draganddropfiles-plugin: Send id target element in headers to inform the server where in page the file has been dropped
- **ENHANCEMENT**: The Ephmera API was changed
	aloha-cleanme class has been renamed to aloha-ephemera.
	aloha-ui-* classes have been renamed to aloha-ephemera-*.
	Ephemera.ephemera() now doesn't merge the given value any more, but sets it (see function documentation for more information).
	ephemera.attrMap doesn't accept 'ELEMENT.attribute': true entries any more, instead use 'attribute': ['ELEMENT'].
	The mark* functions are now optional (modifications performed by these functions are documented and part of the API).
- **ENHANCEMENT**: jquery-ui and jquery.layout were upgraded
- **BUG**: Fixes image path in css file in repository browser #764
- **ENHANCEMENT**: used hints from #749 to improve file size of icons
- **BUG**: link-plugin: Fix anchor class would always be set to cssclass even when cssclassregex was not configured
- **BUG**: link-plugin: Fix metaKey + click doesn't follow link (still doesn't work on IE7)

