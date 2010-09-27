
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Abstract Resource Object
 * @namespace GENTICS.Aloha
 * @class Resource
 * @constructor
 * @param {String} resourceName unique resource identifier
 * @param {String} basePath (optional) basepath of the resource (relative to 'resources' folder). If not given, the basePath resourcePrefix is taken
 */
GENTICS.Aloha.Resource = function(resourceName, basePath) {
	/**
	 * Settings of the resource
	 */
	this.resourceName = resourceName;
	this.basePath = basePath ? basePath : resourceName;
	GENTICS.Aloha.ResourceManager.register(this);
};

/**
 * contains the resource's settings object
 * @cfg {Object} settings the resources settings stored in an object
 */
GENTICS.Aloha.Resource.prototype.settings = {};

/**
 * Init method of the resource. Called from Aloha Core to initialize this resource
 * @return void
 * @hide
 */
GENTICS.Aloha.Resource.prototype.init = function() {};

/** 
 * Searches a resource for resource items matching searchText if none found returns null.
 * The resource items must be an array like
 * <pre>
 * [ 
 * 		{id: 1, name:'Link A', url:'/pageA.html', weight: 0.75, resourceObjectType: 'website'},
 * 	    {id: 2, name:'Link B', url:'/pageB.html', weight: 0.75, resourceObjectType: 'website'},
 *	    {id: 3, name:'Image 1', url:'/image1.jpg', weight: 0.50, resourceObjectType: 'image'},
 *	    {id: 4, name:'Image 2', url:'/image2.png', weight: 0.50, resourceObjectType: 'image'}
 *	];
 * </pre>
 * 
 * <pre>
 * * id: is necessary to identify a resource
 * * name: is used to list in the search result list
 * * url: is used for linking
 * * weight: is used to sort the result list. 1 is highest, 0 is lowest priority.
 * * resourceObjectType: identifies the resource with a certain type.
 * * resourceName: the name of this resource. This is needed to identify the rsource in a merged list.
 * </pre>
 * 
 * @param {string} searchText the query string to be searched for.
 * @param {Array} resourceObjectTypes an array of strings with searched resourceObjectTypes
 * @param {function} callback needs to be called callback.call( this, ResourceItems ) with the result items
 * @return {Array} resourceItems the resource object types to be looked for.
 */
GENTICS.Aloha.Resource.prototype.query = function(searchText, resourceObjectTypes, callback) { return true; };

/**
 * Returns all children of a given mother resourceItem.
 * @param {resourceItem} mother the resouceItem in from which the chidlren should be returned.
 * @param {Array} resourceObjectTypes an array of strings with desired resourceObjectTypes
 * @param {function} callback needs to be called callback.call( this, ResourceItems ) with the result items
 * @return {Array} resourceItems the resource object types to be looked for.
 */
GENTICS.Aloha.Resource.prototype.getChildren = function(mother, resourceObjectTypes, filter, callback) { return true; };

/**
 * Returns  navigation items.
 * @param {resourceItem} mother the resouceItem in from which the naviagtion should be returned.
 * @param {Array} resourceObjectTypes an array of strings with desired resourceObjectTypes. 
 * @param {function} callback needs to be called callback.call( this, ResourceItems ) with the result items
 * @return {Array} resourceItems the resource object types to be looked for.
 */
GENTICS.Aloha.Resource.prototype.getNavigation = function(mother, resourceObjectTypes, filter, callback) { return true; };

/**
 * Make the given jQuery object (representing an object marked as resource of this type)
 * clean. All attributes needed for handling should be removed. 
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Resource.prototype.makeClean = function (obj) {};

/**
 * Mark or modify an object as needed by that resource for handling, processing or identification.
 * Objects can be any DOM object as A, SPAN, ABBR, etc. or
 * special objects such as GENTICS_aloha_block elements.
 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.Resource.prototype.markObject = function (obj, resourceItem) {};
