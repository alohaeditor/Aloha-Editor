
	// Variables
	var
		// jQuery
		jQuery = window.alohaQuery, $ = jQuery,
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
			}
		},
		// Loop
		value, url, scriptEl, appendEl = document.head || document.getElementsByTagName('head')[0];

	// Insert Scripts
	for ( i=0,n=total; i<n; ++i ) {
		// Prepare
		value = includes[i];
		url = window.GENTICS_Aloha_base + '/' + value;

		// Append via DOM
		scriptEl = document.createElement('script');
		scriptEl.src = url;
		scriptEl.setAttribute('defer','defer');
		scriptEl.onreadystatechange = scriptLoaded;
		scriptEl.onload = scriptLoaded;
		scriptEl.onerror = scriptLoaded;
		appendEl.appendChild(scriptEl);
	}

// </closure>
})(window);