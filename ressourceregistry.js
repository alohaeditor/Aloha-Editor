/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Ressource Registry
 * @namespace GENTICS.Aloha
 * @class RessourceRegistry
 * @singleton
 */
GENTICS.Aloha.RessourceRegistry = function() {
	this.ressources = new Array();
};

/**
 * Register a Ressource
 * @param {Ressource} ressource Ressource to register
 */
GENTICS.Aloha.RessourceRegistry.prototype.register = function(ressource) {
	if (ressource instanceof GENTICS.Aloha.Ressource) {
		// TODO check for duplicate ressource prefixes
		this.ressources.push(ressource);
	}
};

/**
 * Initialize all registered ressources
 * @return void
 * @hide
 */
GENTICS.Aloha.RessourceRegistry.prototype.init = function() {
	
	// iterate through all registered ressources
	for ( var i = 0; i < this.ressources.length; i++) {
		var ressource = this.ressources[i];

		// get the ressource settings
		if (GENTICS.Aloha.settings.ressources == undefined) {
			GENTICS.Aloha.settings.ressources = {};
		}
		
		ressource.settings = GENTICS.Aloha.settings.ressources[ressource.prefix];
		
		if (ressource.settings == undefined) {
			ressource.settings = {};
		}
		
		if (ressource.settings.enabled == undefined) {
			ressource.settings.enabled = true;
		}

		if (ressource.settings.enabled == true) {
			// initialize the ressource
			this.ressources[i].init();
		}
	}
};

/**
 * Expose a nice name for the RessourceRegistry
 * @hide
 */
GENTICS.Aloha.RessourceRegistry.toString = function() {
	return "com.gentics.aloha.RessourceRegistry";
};

/**
 * Create the RessourceRegistry object
 * @hide
 */
GENTICS.Aloha.RessourceRegistry = new GENTICS.Aloha.RessourceRegistry();

/**
 * Create the Ressources object. Namespace for Ressources
 * @hide
 */GENTICS.Aloha.Ressources = {};