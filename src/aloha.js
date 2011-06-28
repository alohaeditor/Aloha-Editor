// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Utils = window.GENTICS.Utils || {};
window.Aloha = window.Aloha || {};
window.Aloha.settings = window.Aloha.settings || {};
window.Aloha.ui = window.Aloha.ui || {};
window.Aloha_loaded_plugins = window.Aloha_loaded_plugins || [];
window.Aloha_pluginDir = window.Aloha_pluginDir || false;
window.Aloha_base = window.Aloha_base || false;

// Handle
(function(window,undefined) {

	// alohaQuery should always be available
	window.alohaQuery = window.alohaQuery||window.jQuery;

	// Prepare Script Loading
	var
		document = window.document,
		includes = [];

	// Prepare baseUrl
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');

	// Prepare Plugin Loading
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];

    /*
	  Script elements are added to the head element one after the other.
	  Because when adding all script elements at once, they may be loaded
	  and executed in ANY ORDER (unlike the behaviour when the script tags
	  were present in the head in the pages source)

	  The scripts are not loaded using jQuery.getScript (or jQuery.ajax),
	  because those scripts would not show up in the debuggers, which is
	  inconvenient for debugging.

	  In order to ensure the execution order of the scripts also for IE,
	  we MUST NOT even generate the script elements before appending the first
	  one to the head, because IE starts loading the scripts when the src attribute
	  of the DOM element is set (although the DOM element is not even appended
	  to the head).

	  Therefore, the only secure way to do this is:
	  1. create the script element for the first script
	  2. append it to the head
	  3. wait until the script is fully loaded (and executed),
		 then proceed with step 1. for the next script
	*/

	// Add all core files and dependencies
			includes.push('util/base.js');
			includes.push('dep/ext-3.2.1/adapter/jquery/ext-jquery-adapter.js');
			includes.push('dep/ext-3.2.1/ext-all.js');
			includes.push('dep/jquery.json-2.2.min.js');
			includes.push('dep/jquery.getUrlParam.js');
			includes.push('dep/jquery.store.js');
			includes.push('core/jquery.aloha.js');
			includes.push('util/lang.js');
			includes.push('util/range.js');
			includes.push('util/position.js');
			includes.push('util/dom.js');
			includes.push('core/ext-alohaproxy.js');
			includes.push('core/ext-alohareader.js');
			includes.push('core/ext-alohatreeloader.js');
			includes.push('core/core.js');
			includes.push('core/ui.js');
			includes.push('core/ui-attributefield.js');
			includes.push('core/ui-browser.js');
			includes.push('core/editable.js');
			includes.push('core/floatingmenu.js');
			includes.push('core/log.js');
			includes.push('core/markup.js');
			includes.push('core/message.js');
			includes.push('core/plugin.js');
			includes.push('core/selection.js');
			includes.push('core/sidebar.js');
			includes.push('core/repositorymanager.js');
			includes.push('core/repository.js');
			includes.push('core/repositoryobjects.js');
			includes.push('core/rangy-core.js');
	// Variables
	var
		// jQuery
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		completed = 0,
		total = includes.length,
		exited = false,
		// this method will be called after the last script has been loaded (and executed)
		next = function(){
			$(function(){
				$('body').addClass('alohacoreloaded').trigger('alohacoreloaded');
			});
		},
		// get the script element for loading the script with given url
		getScriptElement = function(url) {
			// generate full url
			var fullUrl = window.GENTICS_Aloha_base + '/' + url, scriptEl;

			// Create the script element for loading the specified script
			scriptEl = document.createElement('script');

			// this event handler is for IE
			scriptEl.onreadystatechange = scriptLoaded;

			// these event handlers are for all other browsers
			scriptEl.onload = scriptLoaded;
			scriptEl.onerror = scriptLoaded;

			// finally add the source
			scriptEl.src = fullUrl;

			return scriptEl;
		},
		// this method will be called whenever a script has been loaded (and executed)
		scriptLoaded = function(event){
			// Prepare
			var nextScriptEl;

			// This checks for IE, whether the script has been loaded
			if ( typeof this.readyState !== 'undefined' && this.readyState !== 'complete'
				&& this.readyState !== 'loaded' ) {
				return;
			}

			// Check whether there are more scripts to be loaded.
			if ( !exited ) {
				completed++;
				if ( completed === total ) {
					// all the scripts have be loaded
					exited = true;
					next();
				} else {
					nextScriptEl = getScriptElement(includes[completed]);
					appendEl.appendChild(nextScriptEl);
				}
			}
		},
		appendEl = document.head || document.getElementsByTagName('head')[0];

	// Add the first script element to the head. This will start the loading procedure
	appendEl.appendChild(getScriptElement(includes[0]));

// </closure>
})(window);