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