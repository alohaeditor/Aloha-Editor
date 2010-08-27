
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Abstract Ressource Object
 * @namespace GENTICS.Aloha
 * @class Ressource
 * @constructor
 * @param {String} ressourcePrefix unique ressource prefix
 * @param {String} basePath (optional) basepath of the ressource (relative to 'ressources' folder). If not given, the basePath ressourcePrefix is taken
 */
GENTICS.Aloha.Ressource = function(ressourcePrefix, basePath) {
	/**
	 * Settings of the ressource
	 */
	this.prefix = ressourcePrefix;
	this.basePath = basePath ? basePath : ressourcePrefix;
	GENTICS.Aloha.RessourceRegistry.register(this);
};

/**
 * contains the ressource's settings object
 * @cfg {Object} settings the ressources settings stored in an object
 */
GENTICS.Aloha.Ressource.prototype.settings = null;

/**
 * Init method of the ressource. Called from Aloha Core to initialize this ressource
 * @return void
 * @hide
 */
GENTICS.Aloha.Ressource.prototype.init = function() {};

/** 
 * Searches a ressource for ressource objects matching attrs if none found returns null.
 * The ressource objects should look like
 * 
 * RessourceObject = {
 * 		id: null,
 * 		name: null,
 * 		url: null,
 * 		description: null,
 * 		icon: null
 * }
 * 
 * @param {attrs} Array of attributes to query for ressourceObjects
 * @return {Array} Array of ressourceObjects or null
 */
GENTICS.Aloha.Ressource.prototype.query = function(attrs) { return null; };

/**
 * resolves a jquery object to a ressource object or returns null
 * @param {jQuery} obj is a jQuery Object on which a ressource should be resolved
 * @return {RessourceObject} res is a ressourceObject or null
 */
GENTICS.Aloha.Ressource.prototype.resolveRessource = function(obj) { return null; };

