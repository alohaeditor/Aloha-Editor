/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

// Ensure Aloha settings namespace and default
Aloha = window.Aloha || {};

// reset defaults. Users should use settings. 
Aloha.defaults = {};

// guarantee the settings namespace even if not set by user
Aloha.settings = Aloha.settings || {};

//set Aloha.jQuery and alohaQuery 
Aloha.jQuery = Aloha.settings.jQuery || Aloha.jQuery || null;

// Aloha define, require, preserve original require
Aloha._require = require;
Aloha.define = define;

(function(){
	
	// Determs the base path of Aloha Editor which is supposed to be the path of aloha.js (this file)
	Aloha.settings.baseUrl = Aloha.settings.baseUrl || getBaseUrl();
	
	// aloha base path is defined by a script tag with the data attribute 
	// data-aloha-plugins and the filename aloha.js
	// no jQuery at this stage...
	function getBaseUrl() {
		
		var
			baseUrl = './',
			i,
			script,
			scripts = document.getElementsByTagName("script"),
			regexAlohaJs = /\/?aloha.js$/,
			regexJs = /[^\/]*\.js$/;
		
        for ( i = 0; i < scripts.length && ( script = scripts[i] ); ++i ) {
        	
            // take aloha.js or first ocurrency of data-aloha-plugins 
        	// and script ends with .js
        	if ( regexAlohaJs.test( script.src ) ) {
        		baseUrl = script.src.replace( regexAlohaJs , '' );
        		break;
        	}            
            if ( baseUrl === './' && script.getAttribute( 'data-aloha-plugins')
            		&& regexJs.test(script.src ) ) {
            	baseUrl = script.src.replace( regexJs , '' );
            }
        }
        
		return baseUrl;
	};
	
	// prepare the require config object and remember it
	Aloha.settings.requireConfig = {
			context: 'aloha',
			baseUrl: Aloha.settings.baseUrl,
			locale: Aloha.settings.locale
	};
	
	var req = require.config( Aloha.settings.requireConfig );
	window.Aloha.require = function( callback ) {
		
		// passes the Aloha object to the passed callback function
		if ( arguments.length == 1 && typeof callback === 'function' ) {
			return req( ['aloha'], callback );
		}
		return req.apply( this, arguments );
	};
	
})();

// cleanup require vars
delete require;
delete requireJS;
delete define;

