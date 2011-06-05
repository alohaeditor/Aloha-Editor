# Aloha Editor Changelog

This document is to serve as a "what has been done" in terms of the [Roadmap](http://aloha-editor.org/wiki/Roadmap)



## Impementing

### 0.11

- 0.11-dev
	- Plugin architecture overhaul
	- UI overhaul
		- Includes jQuery UI support


### 0.10

- 0.10.1-dev
	- Drag & Drop Plugin
	- Support for Opera

- 0.10.0-dev
	- Buildr overhaul
		- Cleaner
		- Asynchronous
		- Better CSS compression and merging
	- Image plugin fixes



## Implemented

### 0.11

- 0.11-dev


### 0.10

- 0.10-dev



## Released

### 0.10

- 0.10.0-alpha, Pending
	- Structure overhaul
		- `WebContent` is now `src`
		- `build/out` is now `out`
		- Plugins are now nicely named, and have dropped their ExtJS prefixes
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