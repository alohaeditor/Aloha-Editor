/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Abstract Document suitable for most Objects
 * @namespace GENTICS.Aloha.Repository
 * @class Document
 * @property {String} id unique identifier
 * @property {String} repositoryId unique repository identifier
 */

GENTICS.Aloha.Repository.Document = function(properties) {

	var p = properties;
	
	this.type = 'document';
	
	// Basic error checking for MUST attributes
	if (!p.id || 
		!p.name ||
		!p.repositoryId
	) {
//		GENTICS.Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
		return;
	}
	
	GENTICS.Utils.applyProperties(this, properties);
	
	this.baseType = 'document';
};

GENTICS.Aloha.Repository.Folder = function(properties) {

	var p = properties;
	
	this.type = 'folder';
	
	// Basic error checking for MUST attributes
	if (!p.id || 
		!p.name ||
		!p.repositoryId
	) {
//		GENTICS.Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
		return;
	}
	
	GENTICS.Utils.applyProperties(this, properties);
	
	this.baseType = 'folder';
};
