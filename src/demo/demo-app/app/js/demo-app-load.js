/*
	Aloha Editor Demo

	The following files should act as a simple example how to use Aloha Editor with a backend to store and read data.
	Theres no user authentication so use this scripts just for educational purposes. Not for production Sites!
*/


/** load style sheets **/
/*
	Bootstrap CSS

	This is part of the Twitter Bootstrap Toolkit used for a nice look and feel
	See: http://twitter.github.com/bootstrap/ 
*/
loadCSS('app/css/bootstrap.css');

/*
	This file includes all application specific styles for the UI
*/
loadCSS('app/css/aloha-editor-demo.css');


/** load javascripts **/
var alohaEditorPath = '../../';

// load requireJS
loadJS( alohaEditorPath + 'lib/require.js');


/*
	jQuery

	Here we add our own jQuery version for demonstration usage.
	You can also just use the jQuery version delivered with Aloha Editor.
*/
loadJS( alohaEditorPath + 'lib/vendor/jquery-1.7.2.js');

/*
	Load scripts to prepare a demo page
	
	eg. load the navigation and show / hide page elements where aloha is not needed...
*/
setTimeout(function() {
	loadJS('app/js/demo-app-prepare.js');
}, 100);



/* 
	Aloha Editor

	First we add our configuration.
	The configuration is not needed by default but handy to configure Aloha to your needs.

	The second step is to include aloha.js and define the desired plugins in the "data-aloha-plugins" attribute.
	In this Demo we also load a custom plugin from our Aloha Editor Demo bundle (defined in the configuration).

	And the final step is to include the needed stylesheet for Aloha Editor.
*/
// we need all running on a server (ajax stuff)
if ( document.location.href.match(/^file:\/\//gi ) ) {
	alert( 'This demo needs to run on a server over http:// not file:// ' );
}

// check for aloha environment
// local app version
//var alohaEditorPath = 'app/aloha-editor/aloha/';
//loadJS('app/aloha-config/minimal.js');

// config for demo-app in aloha dev github repos
loadJS('app/aloha-config/minimal-demo.js');

// load Aloha Editor
loadJS( alohaEditorPath + 'lib/aloha.js', 	'common/ui, \
													common/format, \
													common/table, \
													common/list, \
													common/link,  \
													common/highlighteditables, \
													common/block, \
													common/undo, \
													common/commands, \
													common/paste, \
													common/abbr, \
													common/image,  \
													common/contenthandler, \
													cmsplugin/cms');

loadCSS( alohaEditorPath + 'css/aloha.css');


setTimeout(function() {
/*
	This file handles some functionality for our "Aloha Editor Demo"

	We provide functionality to edit / save changes of a page (all editables at once)
	...
*/
loadJS('app/js/demo-app.js');

	
/*
	In this file we handle the storage of content edited with Aloha Editor.

	When an editable is deactivated the content of that editable is sent to the server.
	On the server a PHP backend script saves the data to our database (sqlite).
	Note: There's no user authentication available! Use it not on production sites.

	Note: If you don't want to enable saving on every deactivation of an editable
	you can disable this script and use the "save button" provided with demo-app.js
*/
// uncomment if you want to save to the backend after every deactivation of an editable
//loadJS('app/js/aloha-save-to-backend.js');

/*
	In this file we handle reading of content for editables from a database / session.

	When a page is loaded we read the data for all editables for that page from a database and update the HTML.
	On the server we read the database and send the results to the client.
	Note: This just shows how it can be used and we do not care about SEO / disabled JavaScript on the client.
*/
// uncomment if you use the store to file backend
loadJS('app/js/aloha-read-from-backend.js');

}, 400);


/**
 * helpers ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

/**
 * insert a css script tag into the head of a html page
*/
function loadCSS( href, media ) {
	var headID = document.getElementsByTagName("head")[0];         
	var cssNode = document.createElement('link');
	
	cssNode.type = 'text/css';
	cssNode.rel = 'stylesheet';
	cssNode.href = href;
	if ( media ) {
		cssNode.media = media;
	}
	
	headID.appendChild(cssNode);
}

/**
 * insert a js script tag into the head of a html page
*/
function loadJS( src, plugins ) {
	var headID = document.getElementsByTagName("head")[0];         
	var newScript = document.createElement('script');
	
	newScript.type = 'text/javascript';
	newScript.src = src;
	if ( plugins ) {
		newScript.setAttribute('data-aloha-plugins', plugins);
	}
	
	headID.appendChild(newScript);
}

/**
 * check if a file exists
*/
function fileExists( url ) {
	oHttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	oHttp.open("HEAD", url, false);
	oHttp.send();
	return ( oHttp.status == 404 ) ? false : true;
}