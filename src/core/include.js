/* This is auto generated on build-dev-include build. Templates at /build/deps/includejs* */
(function(window, undefined) {

	window.GENTICS = window.GENTICS || {};
	window.GENTICS.Aloha = window.GENTICS.Aloha || {};
	window.GENTICS.Aloha.settings = window.GENTICS.Aloha.settings || {};
	window.GENTICS.Aloha.ui = window.GENTICS.Aloha.ui || {};
	window.GENTICS_Plugins = window.GENTICS_Plugins || [];

	/* Check if base DIR is set through configuration otherwise set to default */
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || '/Aloha/';

	var includes = [];


	/* Check if jQuery Exists, if not include it */
	if (typeof window.jQuery === 'undefined') {
		includes.push(window.GENTICS_Aloha_base + 'deps/jquery-1.5.1.js');
	}
	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/ext-jquery-adapter.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/ext-foundation.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/cmp-foundation.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/data-foundation.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/data-json.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/data-list-views.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/ext-dd.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/window.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/resizable.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-buttons.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-tabs.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-tips.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-tree.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-grid-foundation.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-toolbars.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-menu.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/extjs/pkg-forms.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/jquery.json-2.2.min.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/jquery.getUrlParam.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/prettyPhoto/jquery.prettyPhoto.js');

	includes.push(window.GENTICS_Aloha_base + 'deps/jquery.store.js');

	includes.push(window.GENTICS_Aloha_base + 'core/license.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/jquery.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/lang.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/range.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/position.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/dom.js');

	includes.push(window.GENTICS_Aloha_base + 'utils/indexof.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ext-alohaproxy.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ext-alohareader.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ext-alohatreeloader.js');

	includes.push(window.GENTICS_Aloha_base + 'core/core.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ui.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ui-attributefield.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ui-browser.js');

	includes.push(window.GENTICS_Aloha_base + 'core/css.js');

	includes.push(window.GENTICS_Aloha_base + 'core/editable.js');

	includes.push(window.GENTICS_Aloha_base + 'core/event.js');

	includes.push(window.GENTICS_Aloha_base + 'core/floatingmenu.js');

	includes.push(window.GENTICS_Aloha_base + 'core/ierange-m2.js');

	includes.push(window.GENTICS_Aloha_base + 'core/jquery.aloha.js');

	includes.push(window.GENTICS_Aloha_base + 'core/log.js');

	includes.push(window.GENTICS_Aloha_base + 'core/markup.js');

	includes.push(window.GENTICS_Aloha_base + 'core/message.js');

	includes.push(window.GENTICS_Aloha_base + 'core/plugin.js');

	includes.push(window.GENTICS_Aloha_base + 'core/selection.js');

	includes.push(window.GENTICS_Aloha_base + 'core/sidebar.js');

	includes.push(window.GENTICS_Aloha_base + 'core/repositorymanager.js');

	includes.push(window.GENTICS_Aloha_base + 'core/repository.js');

	includes.push(window.GENTICS_Aloha_base + 'core/repositoryobjects.js');


	var value,url;
	for ( i=0,n=window.GENTICS_Plugins.length; i<n; ++i ) {
		value = window.GENTICS_Plugins[i];
		if ( value.indexOf('/') === -1 ) {
			value += '/plugin.js';
		}
		url = window.GENTICS_Aloha_base + 'plugins/com.gentics.aloha.plugins.' + value;
		includes.push(url);
	}

	for ( i=0,n=includes.length; i<n; ++i ) {
		value = includes[i];
		document.write('<script src="'+value+'"></script>');
	}

})(window);
