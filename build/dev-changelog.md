- **BUG**: In the sidebar the panel entry for the format plugin was always shown; now when the formatOptions is empty the empty (useless) sidebar panel will be hidden
- **BUG**: Align Plugin button status was not shown correctly
- **FEATURE**: Image Caption Plugin: caption now supports sanitize contenthandler & disable / enable of line breaks;
	<code>
	Aloha.settings.contentHandler.handler: {
		sanitize: {
			'.aloha-captioned-image-caption': { elements: [ 'em', 'strong' ] }
		}
	}
	</code>

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
