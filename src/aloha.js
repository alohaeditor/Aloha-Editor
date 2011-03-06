// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Aloha = window.GENTICS.Aloha || {};
window.GENTICS.Aloha.settings = window.GENTICS.Aloha.settings || {};
window.GENTICS.Aloha.ui = window.GENTICS.Aloha.ui || {};
window.Aloha_loaded_plugins = window.Aloha_loaded_plugins || [];
window.GENTICS_Aloha_pluginDir = window.GENTICS_Aloha_pluginDir || false;
window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || false;
/* This is auto generated on build-dev-include build. Templates at /build/deps/includejs* */
(function(window, undefined) {

	// Prepare Script Loading
	var
		includes = [];

	// Prepare baseUrl
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');

	// Prepare Plugin Loading
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];
	window.Aloha_loaded_plugins['format'] = true;
	window.Aloha_loaded_plugins['link'] = true;
	window.Aloha_loaded_plugins['linkchecker'] = true;
	window.Aloha_loaded_plugins['table'] = true;
	includes.push('dep/ext-3.3.1/adapter/jquery/ext-jquery-adapter.js');
	includes.push('dep/ext-3.3.1/ext-all-debug.js');
	includes.push('dep/jquery.json-2.2.min.js');
	includes.push('dep/jquery.getUrlParam.js');
	includes.push('dep/jquery.store.js');
	includes.push('core/jquery.aloha.js');
	includes.push('util/jquery.js');
	includes.push('util/lang.js');
	includes.push('util/range.js');
	includes.push('util/position.js');
	includes.push('util/dom.js');
	includes.push('util/indexof.js');
	includes.push('core/ext-alohaproxy.js');
	includes.push('core/ext-alohareader.js');
	includes.push('core/ext-alohatreeloader.js');
	includes.push('core/core.js');
	includes.push('core/ui.js');
	includes.push('core/ui-attributefield.js');
	includes.push('core/ui-browser.js');
	includes.push('core/editable.js');
	includes.push('core/event.js');
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
	includes.push('plugin/link/src/link.js');
	includes.push('plugin/linkchecker/src/linkchecker.js');
	includes.push('plugin/table/src/table.js');

	// Insert Scripts
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
	}

// </closure>
})(window);
