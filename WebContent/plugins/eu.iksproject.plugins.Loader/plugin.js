if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

eu.iksproject.LoaderPlugin = new GENTICS.Aloha.Plugin('eu.iksproject.plugins.Loader');

/**
 * Initialize the plugin, register the buttons
 */
eu.iksproject.LoaderPlugin.init = function() {
	var that = this;
};

eu.iksproject.LoaderPlugin.load = function(pluginNamespace) {
    var pluginPath = '' + GENTICS_Aloha_base + '/plugins/' + pluginNamespace + '/plugin.js';
	jQuery('<script type="text/javascript" />').attr('src', pluginPath).appendTo('head');
};

eu.iksproject.LoaderPlugin.loadAsset = function(pluginNamespace, assetName) {
	var assetPath = '' + GENTICS_Aloha_base + '/plugins/' + pluginNamespace + '/' + assetName;
	jQuery('<script type="text/javascript" />').attr('src', assetPath).appendTo('head');
};

