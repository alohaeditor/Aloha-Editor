// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Utils = window.GENTICS.Utils || {};
window.Aloha = window.Aloha || {};
window.Aloha.settings = window.Aloha.settings || {};
window.Aloha.ui = window.Aloha.ui || {};
window.Aloha_loaded_plugins = window.Aloha_loaded_plugins || [];
window.Aloha_pluginDir = window.Aloha_pluginDir || false;
window.Aloha_base = window.Aloha_base || false;

define(
	'aloha',
	[
		'order!dep/jquery-1.5.1',
		'order!util/base',
		'order!dep/ext-3.2.1/adapter/jquery/ext-jquery-adapter',
		'order!dep/ext-3.2.1/ext-all',
		'order!dep/jquery.json-2.2.min',
		'order!dep/jquery.getUrlParam',
		'order!dep/jquery.store',
		'order!core/jquery.aloha',
		'order!util/lang',
		'order!util/range',
		'order!util/position',
		'order!util/dom',
		'order!core/ext-alohaproxy',
		'order!core/ext-alohareader',
		'order!core/ext-alohatreeloader',
		'order!core/core',
		'order!core/ui',
		'order!core/ui-attributefield',
		'order!core/ui-browser',
		'order!core/editable',
		'order!core/floatingmenu',
		'order!core/log',
		'order!core/markup',
		'order!core/message',
		'order!core/plugin',
		'order!core/selection',
		'order!core/sidebar',
		'order!core/repositorymanager',
		'order!core/repository',
		'order!core/repositoryobjects',
		'order!core/rangy-core'
	],
	function() {
		$('body')
			.addClass('alohacoreloaded')
			.trigger('alohacoreloaded');
	}
);
