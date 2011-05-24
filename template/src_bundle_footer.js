	// Variables
	var
		// jQuery
		jQuery = window.alohaQuery, $ = jQuery,
		// Loading
		webkit = /WebKit/.test(navigator.userAgent),
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
		scriptLoaded = function(){
			if ( exited ) {
				throw new Error('Too late, Aloha Editor already loaded');
			}
			else {
				completed++;
				if ( completed === total ) {
					exited = true;
					next();
				}
				else if ( !webkit ) {
					appendEl.appendChild(scriptEls[completed]);
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
		if ( webkit ) {
			appendEl.appendChild(scriptEl);
		}
		else {
			scriptEls.push(scriptEl);
		}
	}

	// Non-Webkit
	if ( !webkit ) {
		appendEl.appendChild(scriptEls[0]);
	}

// </closure>
})(window);