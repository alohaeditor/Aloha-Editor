/* This is auto generated on build-dev-include build. Templates at /build/deps/includejs* */
(function(window, undefined) {

	// Prepare
	var includes = [], jquery = 'jquery-1.5.1.js';
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];
	window.Aloha_loaded_plugins['format'] = true;
	window.Aloha_loaded_plugins['link'] = true;
	window.Aloha_loaded_plugins['linkchecker'] = true;
	window.Aloha_loaded_plugins['table'] = true;
	includes.push('dep/jquery-1.5.1.js');
	includes.push('dep/extjs/ext-jquery-adapter.js');
	includes.push('dep/extjs/ext-foundation.js');
	includes.push('dep/extjs/cmp-foundation.js');
	includes.push('dep/extjs/data-foundation.js');
	includes.push('dep/extjs/data-json.js');
	includes.push('dep/extjs/data-list-views.js');
	includes.push('dep/extjs/ext-dd.js');
	includes.push('dep/extjs/window.js');
	includes.push('dep/extjs/resizable.js');
	includes.push('dep/extjs/pkg-buttons.js');
	includes.push('dep/extjs/pkg-tabs.js');
	includes.push('dep/extjs/pkg-tips.js');
	includes.push('dep/extjs/pkg-tree.js');
	includes.push('dep/extjs/pkg-grid-foundation.js');
	includes.push('dep/extjs/pkg-toolbars.js');
	includes.push('dep/extjs/pkg-menu.js');
	includes.push('dep/extjs/pkg-forms.js');
	includes.push('dep/jquery.json-2.2.min.js');
	includes.push('dep/jquery.getUrlParam.js');
	includes.push('dep/jquery.store.js');
	includes.push('core/jquery.aloha.js');
	includes.push('core/license.js');
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

	var value,url;
	for ( i=0,n=window.GENTICS_Plugins.length; i<n; ++i ) {
		value = window.GENTICS_Plugins[i];
		if ( value.indexOf('/') === -1 ) {
			value += '/plugin.js';
		}
		url = 'plugins/com.gentics.aloha.plugins.' + value;
		includes.push(url);
	}

	for ( i=0,n=includes.length; i<n; ++i ) {
		value = includes[i];
		document.write('<script src="'+value+'"></script>');
	}

})(window);
