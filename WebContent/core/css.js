(function(){
	var base = GENTICS.Aloha.autobase;
	if (typeof GENTICS_Aloha_base != 'undefined') {
			base = GENTICS_Aloha_base;
	}
document.write('<link type="text/css" href="' + base + 'css/aloha.css?v=' + GENTICS.Aloha.version + '" rel="stylesheet" />');
document.write('<link type="text/css" href="' + base + 'plugins/com.gentics.aloha.plugins.Table/resources/table.css?v=' + GENTICS.Aloha.version + '" rel="stylesheet" />');
document.write('<link type="text/css" href="' + base + 'deps/extjs/resources/css/ext-all.css?v=' + GENTICS.Aloha.version + '" rel="stylesheet" />');
document.write('<link type="text/css" href="' + base + 'deps/extjs/resources/css/xtheme-gray.css?v=' + GENTICS.Aloha.version + '" rel="stylesheet" />');
})();
