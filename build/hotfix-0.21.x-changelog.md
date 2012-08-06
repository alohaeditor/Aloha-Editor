All changes are categorized into one of the following keywords:

- **BUG**: The change fixes a bug.
- **ENHANCEMENT**: The change improves the software, but otherwise makes no
                   functional change to any feature.
- **FEATURE**: The change introduces a new feature, or modifies the function,
               usage, or intent of an existing one.

----

- **BUG**: Missing implementations to show and hide items in a multisplit button have been added.
- **MANUAL CHANGE**: The API Method setActiveButton() of the MultiSplit component changed: the parameter must be the name of the button to set active, not the index.
- **BUG**: Fixes loading errors when a second jQuery was loaded below aloha.js
- **ENHANCEMENT**: Aloha Editor will now add the browser version to the html dom node (see http://www.aloha-editor.org/guides/core.html#initialization-process)
- **FEATURE**: Toolbar configurability was extended

	The now Aloha.toolbar.settings.tab[i].exclusive property was implemented.
	See the ui guide for more information.

- **FEATURE**: UiPlugin API addition

	UiPlugin.showToolbar() was added to the UiPlugin API.
	This function provides better control over when the toolbar is
	shown.

- **FEATURE**: Aloha Blocks dropzones and configuration

	Aloha Blocks now allow for additional configuration settings which
	allow you to disable the drag'n'drop functionality of blocks
	globally or for individual editables as well as defining custom
	dropzones for each editable. See
	http://www.aloha-editor.org/guides/plugin_block.html#en-disabling-drag-drop-for-blocks
	for details.
