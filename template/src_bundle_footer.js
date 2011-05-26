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