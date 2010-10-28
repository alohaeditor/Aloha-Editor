/* This is auto generated on build-dev-include build. Templates at /build/deps/includecss* */ 
(function(){
	
	if ( typeof this.GENTICS_Aloha_autoloadcss == 'undefined' || !(this.GENTICS_Aloha_autoloadcss == false) ) {
	
		/* Check if base DIR is set through configuration otherwise set to default */
		var base = GENTICS.Aloha.autobase;
		if (typeof GENTICS_Aloha_base != 'undefined') {
				base = GENTICS_Aloha_base;
		}
	
		/* load stylsheets */
		var header = document.getElementsByTagName("head")[0];
		header.appendChild(cssElement(base + 'css/aloha.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'deps/extjs/resources/css/ext-all.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'deps/extjs/resources/css/xtheme-gray.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'deps/prettyPhoto/resources/css/prettyPhoto.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'plugins/com.gentics.aloha.plugins.Table/resources/table.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'plugins/com.gentics.aloha.plugins.Link/css/Link.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'plugins/com.gentics.aloha.plugins.HighlightEditables/css/HighlightEditables.css?v=' + GENTICS.Aloha.version));
		header.appendChild(cssElement(base + 'plugins/com.gentics.aloha.plugins.LinkChecker/css/LinkChecker.css?v=' + GENTICS.Aloha.version));

	}

	/* Generate xHTML valid css Elements */
	function cssElement( link ) {
		var csslink = document.createElement("link");
		csslink.setAttribute("rel", "stylesheet");
		csslink.setAttribute("type", "text/css");
		csslink.setAttribute("href", link);
		csslink.setAttribute("media", "all");
		return csslink;
	}
})();
