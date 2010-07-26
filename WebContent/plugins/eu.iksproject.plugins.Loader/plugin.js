if (typeof eu == "undefined") {
    var eu = {};
    
    if (typeof eu.iksproject == "undefined") {
        eu.iksproject = {};
    }
}

eu.iksproject.LoaderPlugin = new GENTICS.Aloha.Plugin('eu.iksproject.plugins.Loader');
eu.iksproject.LoaderPlugin.loadedAssets = {};

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

eu.iksproject.LoaderPlugin.loadAsset = function(pluginNamespace, assetName, assetType) {
    if (typeof assetType == 'undefined') {
        assetType = 'js';
    }
    
	var assetPath = '' + GENTICS_Aloha_base + '/plugins/' + pluginNamespace + '/' + assetName + '.' + assetType;
    
    if (this.loadedAssets[assetPath]) {
        return;
    }
    
    this.loadedAssets[assetPath] = true;
    
    if (assetType == 'js') {
        jQuery('<script type="text/javascript" />').attr('src', assetPath).appendTo('head');
    } else if (assetType == 'css') {
        jQuery('<link rel="stylesheet" />').attr('href', assetPath).appendTo('head');
    }
};

