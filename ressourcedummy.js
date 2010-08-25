
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Ressources.Dummy = new GENTICS.Aloha.Ressource('com.gentics.aloha.resources.Dummy');

/**
 * Initialize the Ressource
 */
GENTICS.Aloha.Ressources.Dummy.init = function () {

	var data = [ 
	            {id: 1, text:'Link A', url:'/page1'},
	            {id: 2, text:'Link B', url:'/page2'},
	            {id: 3, text:'Link C', url:'/page3'},
	            {id: 4, text:'Link D', url:'/page4'}
	];
	// Nothing to do here
};

/** 
 * Searches a ressource for ressourceObjects matching attrs
 * @param {attrs} Array of attributes to query for ressourceObjects
 * @return {Array} Array of ressourceObjects
 */
GENTICS.Aloha.Ressources.Dummy.query = function(attrs) {
   return this.data;
};

/**
 * resolves a jquery object to a ressource object or returns false
 * @param {jQuery} obj is a jQuery Object on which a ressource should be resolved
 * @return {RessourceObject} res is ressourceObjects or null
 */
GENTICS.Aloha.Ressources.Dummy.resolve = function(obj) {
	// find object in this.data
	return null;
};