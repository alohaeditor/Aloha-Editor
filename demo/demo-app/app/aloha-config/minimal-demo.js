(function(window, undefined) {

	if (window.Aloha === undefined || window.Aloha === null) {
		var Aloha = window.Aloha = {};
	}
	
	/*
		This is a minimal Aloha Editor configuration
		
		In this Aloha Editor Demo Demo we add a custom plugin.
		This plugin is located in our own specific plugin bundle.
	*/
	Aloha.settings = {
		logLevels: { 'error': true, 'warn': true, 'info': true, 'debug': true, 'deprecated': true },
		locale: 'en',
		bundles: {
			// Path for custom bundle relative from Aloha.settings.baseUrl usually path of aloha.js
			cmsplugin: '../demo/demo-app/app/aloha-plugins'
		}
	};
})(window);