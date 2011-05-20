window.alohaQuery = window.jQuery.sub();
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
(function(window,document) {

	// Prepare Script Loading
	var
		$ = window.alohaQuery,
		counter = 0,
		scriptEl;
	
	// Wait for jQuery and DOM
	$(function(){
		var includes = [],
			alohaInit = false,
			appendEl = document.getElementsByTagName('head')[0],
			atAlohaFileLoaded = function(event) {
				var $this = $(this);
//			console.log("Aloha file loaded " + $this.attr('src'));
//			console.log(event);
//			try {
					//console.log("alohaLoadJs trigger for "  + (($('body').data('events')||{})['alohaLoadJs']||[]).length + " binded handlers");
					$('body').trigger('alohaLoadJs', {'script': $this.attr('src')});
//			} catch(e) {
//				console.log(e);
//			}
			},
			loadJsFileAtIncludesCounter = function() {
				var depitem =includes.pop(),
					depfile, onload,
					url;
				//console.log("Loading file " + depitem);
				url = window.GENTICS_Aloha_base + '/' + depitem;
//			if ($.browser.webkit) {
					scriptEl = document.createElement('script');
					scriptEl.src = url;
					scriptEl.setAttribute('defer','defer'); 
					// ie
					scriptEl.onreadystatechange = atAlohaFileLoaded;
					// webkit + FF
					scriptEl.onload = atAlohaFileLoaded;
					appendEl.appendChild(scriptEl);
			};
			// Define recursive event handler
			$('body').bind('alohaLoadJs', function(event, data){
				if (includes.length > 0) {
					loadJsFileAtIncludesCounter();
				} else {
					//Last file loaded
//				console.log("Initialize aloha")
					if (!alohaInit) {
						var $body = $('body');
						alohaInit = true;
						$body.createPromiseEvent('aloha');
						window.Aloha.init();
						
					}
				}
			});	
//		console.log("Binded alohaLoadJs "  + (($('body').data('events')||{})['alohaLoadJs']||[]).length);
			
			
			// Prepare baseUrl
			window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');
			
			// Prepare Plugin Loading
			window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];			includes.push('util/base.js');
			includes.push('dep/ext-3.2.1/adapter/jquery/ext-jquery-adapter.js');
			includes.push('dep/ext-3.2.1/ext-all.js');
			includes.push('dep/jquery.json-2.2.min.js');
			includes.push('dep/jquery.getUrlParam.js');
			includes.push('dep/jquery.store.js');
			includes.push('core/jquery.aloha.js');
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
		includes = includes.reverse();
		loadJsFileAtIncludesCounter();
	}); // DOM event
// </closure>
})(window, document);
