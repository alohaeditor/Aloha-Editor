- **MANUAL CHANGE**: Updated impress.js to work with jQuery UI
- **MANUAL CHANGE**: Updated demo-app to work with jQuery UI; added simple system test to check file permissions;
- **MANUAL CHANGE**: Updated the guides for the contenthandler configuration;
- **MANUAL CHANGE**: removed not needed demo/test.html (was for testing per editable config)
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
	

