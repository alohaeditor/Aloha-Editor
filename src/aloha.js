// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Utils = window.GENTICS.Utils || {};
window.Aloha = window.Aloha || {};
window.Aloha.settings = window.Aloha.settings || {};
window.Aloha.ui = window.Aloha.ui || {};
window.Aloha_loaded_plugins = window.Aloha_loaded_plugins || [];
window.Aloha_pluginDir = window.Aloha_pluginDir || false;
window.Aloha_base = window.Aloha_base || false;

/* This is auto generated on build-dev-include build. Templates at /build/deps/includejs* */
(function(window, undefined) {

	// Prepare Script Loading
	var
		includes = [],
		$body = $('body'),
		counter = 0,
		scriptEl,
		appendEl = document.head;
	function loadJsFileAtIncludesCounter() {
		var depitem = includes[counter++],
			depfile;
		scriptEl = document.createElement('script');
		scriptEl.src = window.GENTICS_Aloha_base + '/' + depitem;
		scriptEl.setAttribute('defer','defer'); 
		scriptEl.onload = function(event) {
			$body.trigger('alohaLoadJs',{'file':includes[counter],'ref': counter,'total':includes.length});
		}
		appendEl.appendChild(scriptEl);
	}
	// Prepare baseUrl
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');

	// Prepare Plugin Loading
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];
	window.Aloha_loaded_plugins['format'] = true;
	includes.push('util/base.js');
	includes.push('dep/ext-3.2.1/adapter/jquery/ext-jquery-adapter.js');
	includes.push('dep/ext-3.2.1/ext-all.js');
	includes.push('dep/jquery.json-2.2.min.js');
	includes.push('dep/jquery.getUrlParam.js');
	includes.push('dep/jquery.store.js');
	includes.push('core/jquery.js');
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
	
	// Define recursive event handler
	$body.bind('alohaLoadJs', function(event, data){
		if (includes.length > counter) {
			loadJsFileAtIncludesCounter();
		}
	});
	//Initialize
	loadJsFileAtIncludesCounter();
	
	
	/* Insert Scripts
	var value, url, scriptEl, appendEl = document.head;
	for ( i=0,n=includes.length; i<n; ++i ) {
		// Prepare
		value = includes[i];
		url = window.GENTICS_Aloha_base + '/' + value;

		// Append via Write
		document.write('<script defer src="'+url+'"></script>');
		continue;

		// Append via jQuery
		window.jQuery.ajax({
			dataType : 'script',
			url: url
		});
		continue;

		// Append via DOM
		scriptEl = document.createElement('script');
		scriptEl.src = url;
		scriptEl.setAttribute('defer','defer');
		appendEl.appendChild(scriptEl);
		continue;
	} // */

// </closure>
})(window);
