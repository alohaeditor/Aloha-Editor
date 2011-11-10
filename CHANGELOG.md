# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](http://aloha-editor.org/wiki/Roadmap)


### 0.20

- 0.20.1
		- core: Adds option for "cls" property to be added to ui-attributefields.
	       cls will be an optional extra CSS class that will be added to this component's Element. This can be useful for adding customized styles to the component or any of its children using standard CSS rules. (http://docs.sencha.com/ext-js/4-0/#!/api/Ext.AbstractComponent-cfg-cls)
		- ribbon-plugin: The ribbon will no longer be visible by default. Instead you can use the show function to make it appear.
		- image-plugin: The plugin will now use a different method to calculate the width/height when using a fixed aspect ratio.
		- core: Fixed floatingmenu to stay visible, if pinned and window is resized.
		- core: Added new Method to FloatingMenu: activateTabOfButton(name) will activate the tab containing the button with given name (if tab is visible)
 	       Fixed all plugins to not use FloatingMenu.userActivatedTab, but FloatingMenu.activateTabOfButton instead. This will ensure that switching Tabs will also work, if floatingmenu is configured individually.
	- link-plugin: Fixed link-plugin to bind events to links when editables are created. Also bind events to new created links. This ensures that Hotkey CTRL+L to create a new link works, and links can be followed by clicking on them while holding CTRL
        - link-plugin: Fixed handling of external links. Previously it was not possible to change a repository link to an external link.
	- listenforcer-plugin: fixed a bug which would cause an error when activating or deactivating an editable
	- format-plugin: tags removed by the "remove format" button may now be configured by setting Aloha.settings.plugins.format.removeFormats = ['b', 'strong', 'whatever']; The default set of formats to be removed is: 'strong', 'em', 'b', 'i', 'cite', 'q', 'code', 'abbr', 'del', 'sub', 'sup'

### 0.10

- 0.10.0-alpha, Pending
	- Structure overhaul
		- `WebContent` is now `src`
		- `build/out` is now `out`
		- Plugins are now nicely named, and have dropped their ExtJS prefixes. Eg. the format plugin was renamed from 'com.gentics.aloha.plugins.Format' to 'format'. Have a look at the plugin folder for a complete overview of new plugin names.
		- The GENTICS namespace has been completely removed from all objects in Aloha Editor's core
	- Building overhaul
		- Building has moved from Java + Ant to Node.js + Buildr
		- Building now runs in seconds instead of minutes, with greater compression ratios
		- Building will run strict JSHint code quality tests
		- Output is now more consistent with source, demos can remain untouched between using the src and out versions
		- JavaScript and CSS files are now bundled into `aloha.js` and `aloha.css`
	- Image plugin
		- Supports inserting via src
		- Title editing
		- Size increase/decrease
		- Padding increase/decrease
		- Alignment
	- Translations are now JSON files
	- Initialisation and load process are now asynchronous (less initialisation problems)
	- Introduction of the `$('body').bind('aloha',function(){/*your code*/});` event for creating editables
	- Aloha base url is now auto-detected
	- Aloha plugins are now loaded in through `data-plugins="format,table"` on the aloha `script` element
		- See demos for more usage information
	- Great speed increases
	- Introduction of the CLI to increase developer/contributor effeciency


### 0.9

- 0.9.3 - October 2010
	- Link/Href handling
	- Repository browser
		- As well as sample Delicious and LinkList Repositories
	- Textarea and $('#myTextarea').aloha() support
	- Table plugin
	- Paste from Microsoft Word
	- Plugins are now submodules
	- Abbreviation plugin
	- LinkChecker plugin