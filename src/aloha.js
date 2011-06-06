// Create jQuery
window.alohaQuery = window.jQuery;//.sub();

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

	// Prepare Script Loading
	var
		document = window.document,
		includes = [];

	// Prepare baseUrl
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');

	// Prepare Plugin Loading
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];		window.Aloha_loaded_plugins['format'] = true;
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
			includes.push('core/ierange-m2.js');
			includes.push('core/log.js');
			includes.push('core/markup.js');
			includes.push('core/message.js');
			includes.push('core/plugin.js');
			includes.push('core/selection.js');
			includes.push('core/sidebar.js');
			includes.push('core/repositorymanager.js');
			includes.push('core/repository.js');
			includes.push('core/repositoryobjects.js');
			includes.push('plugin/format/src/format.js');
	// Variables
	var
		// jQuery
		jQuery = window.alohaQuery, $ = jQuery,
		// Loading
		defer = false, /*
			Until browsers can support the defer attribute properly
			This should always be false
			Defer makes it so that they load in parrallel but execute in order
			If we don't have it then the script could execute in any order, which will cause errors
			So for the meantime, this flag will always be false.
			Which means that instead we load things one by one.
			It will be slower, but if you care for speed, then why are you using the uncompressed version of Aloha Editor?
			Alternatively we could introduce much better sniffing
			/WebKit/.test(navigator.userAgent), */
		scriptEls = [],
		// Async
		completed = 0,
		total = includes.length,
		exited = false,
		next = function(){
			$(function(){
				$('body').addClass('alohacoreloaded').trigger('alohacoreloaded');
			});
		},
		scriptLoaded = function(event){
			// Prepare
			var nextScriptEl;

			// Check
			if ( typeof this.readyState !== 'undefined' && this.readyState !== 'complete' ) {
				return;
			}

			// Clean
			if ( this.timeout ) {
				window.clearTimeout(this.timeout);
				this.timeout = false;
			}
			
			// Handle
			if ( !exited ) {
				completed++;
				if ( completed === total ) {
					exited = true;
					next();
				}
				else if ( !defer ) {
					nextScriptEl = scriptEls[completed];
					nextScriptEl.timeout = window.setTimeout(scriptLoaded,1000);
					appendEl.appendChild(nextScriptEl);
				}
			}
		},
		// Loop
		value, url, scriptEl, appendEl = document.head || document.getElementsByTagName('head')[0];
	
	// Insert Scripts
	for ( i=0,n=total; i<n; ++i ) {
		// Prepare
		value = includes[i];
		url = window.GENTICS_Aloha_base + '/' + value;

		// Create
		scriptEl = document.createElement('script');
		scriptEl.src = url;
		scriptEl.setAttribute('defer','defer');
		scriptEl.onreadystatechange = scriptLoaded;
		scriptEl.onload = scriptLoaded;
		scriptEl.onerror = scriptLoaded;

		// Add
		if ( defer ) {
			scriptEl.timeout = window.setTimeout(scriptLoaded,1000);
			appendEl.appendChild(scriptEl);
		}
		else {
			scriptEls.push(scriptEl);
		}
	}

	// No Defer Support
	if ( !defer ) {
		scriptEls[0].timeout = window.setTimeout(scriptLoaded,1000);
		appendEl.appendChild(scriptEls[0]);
	}

// </closure>
})(window);