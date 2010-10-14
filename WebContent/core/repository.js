/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Abstract Repository
 * @namespace GENTICS.Aloha
 * @class Repository
 * @constructor
 * @param {String} repositoryId unique repository identifier
 * @param {String} basePath (optional) basepath of the repository (relative to 'repositories' folder). If not given, the basePath is taken
 */
GENTICS.Aloha.Repository = function(repositoryId, repositoryName) {
	/**
	 * @cfg {String} repositoryId is the unique Id for this Repository instance 
	 */
	this.repositoryId = repositoryId;
	
	/**
	 * contains the repository's settings object
	 * @cfg {Object} settings the repository's settings stored in an object
	 */
	this.settings = {};

	/**
	 * @cfg {String} repositoryName is the name for this Repository instance 
	 */
	this.repositoryName = (repositoryName) ? repositoryName : repositoryId;
	
	GENTICS.Aloha.RepositoryManager.register(this);

};

/**
 * Init method of the repository. Called from Aloha Core to initialize this repository
 * @return void
 * @hide
 */
GENTICS.Aloha.Repository.prototype.init = function() {};

/** 
 * Searches a repository for object items matching queryString if none found returns null.
 * The returned object items must be an array of Aloha.Repository.Object
 * 
 * @property {String} queryString 
 * @property {array} objectTypeFilter OPTIONAL Object types that will be returned.
 * @property {array} filter OPTIONAL Attributes that will be returned.
 * @property {string} inFolderId OPTIONAL his is a predicate function that tests whether or not a candidate object is a child-object of the folder object identified by the given inFolderId (objectId).
 * @property {string} inTreeId OPTIONAL This is a predicate function that tests whether or not a candidate object is a descendant-object of the folder object identified by the given inTreeId (objectId).
 * @property {array} orderBy OPTIONAL ex. [{lastModificationDate:’DESC’, name:’ASC’}]
 * @property {Integer} maxItems OPTIONAL number items to return as result
 * @property {Integer} skipCount OPTIONAL This is tricky in a merged multi repository scenario
 * @property {array} renditionFilter OPTIONAL Instead of termlist an array of kind or mimetype is expected. If null or array.length == 0 all renditions are returned. See http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310 for renditionFilter
 * @param {object} params object with properties
 * @param {function} callback this method must be called with all result items
 */
GENTICS.Aloha.Repository.prototype.query = function( params, callback ) { return true; };

/**
 * Returns all children of a given motherId.
 * @property {array} objectTypeFilter OPTIONAL Object types that will be returned.
 * @property {array} filter OPTIONAL Attributes that will be returned.
 * @property {string} inFolderId OPTIONAL his is a predicate function that tests whether or not a candidate object is a child-object of the folder object identified by the given inFolderId (objectId).
 * @property {array} orderBy OPTIONAL ex. [{lastModificationDate:’DESC’, name:’ASC’}]
 * @property {Integer} maxItems OPTIONAL number items to return as result
 * @property {Integer} skipCount OPTIONAL This is tricky in a merged multi repository scenario
 * @property {array} renditionFilter OPTIONAL Instead of termlist an array of kind or mimetype is expected. If null or array.length == 0 all renditions are returned. See http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310 for renditionFilter
 * @param {object} params object with properties
 * @param {function} callback this method must be called with all result items
 */
GENTICS.Aloha.Repository.prototype.getChildren = function( params, callback ) { return true; };


/**
 * Make the given jQuery object (representing an object marked as object of this type)
 * clean. All attributes needed for handling should be removed. 
 * @param {jQuery} obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Repository.prototype.makeClean = function (obj) {};

/**
 * Mark or modify an object as needed by that repository for handling, processing or identification.
 * Objects can be any DOM object as A, SPAN, ABBR, etc. or
 * special objects such as GENTICS_aloha_block elements.
 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Repository.prototype.markObject = function (obj, repositoryItem) {};
