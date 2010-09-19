/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Resource Manager
 * @namespace GENTICS.Aloha
 * @class ResourceManager
 * @singleton
 */
GENTICS.Aloha.ResourceManager = function() {
	this.resources = new Array();
};


GENTICS.Aloha.ResourceManager.prototype.openCallbacks = [];

/**
 * Initialize all registered resources
 * @return void
 * @hide
 */
GENTICS.Aloha.ResourceManager.prototype.init = function() {
	
	// get the resource settings
	if (GENTICS.Aloha.settings.resources == undefined) {
		GENTICS.Aloha.settings.resources = {};
	}

	// iterate through all registered resources
	for ( var i = 0; i < this.resources.length; i++) {
		var resource = this.resources[i];
		
		if (resource.settings == undefined) {
			resource.settings = {};
		}
		
		// merge the specific settings with the resource default settings
		if ( GENTICS.Aloha.settings.resources[resource.resourceName] ) {
			jQuery.extend(resource.settings, GENTICS.Aloha.settings.resources[resource.resourceName])
		}
		
//		if (resource.settings.enabled == true) {
			// initialize the resource
			resource.init();
//		}
	}
};

/**
 * Register a Resource
 * @param {GENTICS.Aloha.Resource} resource Resource to register
 */

GENTICS.Aloha.ResourceManager.prototype.register = function(resource) {
	
	if (resource instanceof GENTICS.Aloha.Resource) {
		if ( !this.getResource(resource.resourceName) ) {
			this.resources.push(resource); 
		} else {
			GENTICS.Aloha.Log.warn(this, "A resource with name { " + resource.resourceName+ " } already registerd. Ignoring this.");
		}
	} else {
		GENTICS.Aloha.Log.error(this, "Trying to register a resource which is not an instance of GENTICS.Aloha.Resource.");
	}
	
};

/**
 * Returns a resource object identified by resourceName.
 * @param {String} resourceName the name of the resource
 * @return {GENTICS.Aloha.Resource} a resource or null if name not found
 */
GENTICS.Aloha.ResourceManager.prototype.getResource = function(resourceName) {
	
	for ( var i = 0; i < this.resources.length; i++) {
		if ( this.resources[i].resourceName == resourceName ) {
			return this.resources[i];
		}
	}
	return null;
};

/** 
 * Searches a all resources for resourceObjects matching query and resourceObjectType
 * @param {String} query the query string passed to the resource
 * @param {Array} resourceObjectTypes an array of strings with searched resourceObjectTypes
 * @param {function} callback defines an callback function( resourceResult ) which will be called after a time out of 5sec or when all resources returned their result
 * @return {Array} Array of resourceItems
 */
GENTICS.Aloha.ResourceManager.prototype.query = function(searchText, resourceObjectTypes, callback) {
	
	var that = this;
	var allitems = [];
	
	// start timer in case a resource does not deliver in time
	var timer = setTimeout( function() {
		that.queryCallback(callback, allitems, timer);
	}, 5000);
	
	// reset callback queue
	this.openCallbacks = [];
	
	// iterate through all registered resources
	for ( var i = 0; i < this.resources.length; i++) {
		
		// add this resource to the callback stack
		this.openCallbacks.push(this.resources[i].resourceName);
		
		this.resources[i].query( searchText, resourceObjectTypes, function (items) {
		    
			// remove the resource from the callback stack
			var id = that.openCallbacks.indexOf( this.resourceName );
			if (id != -1) {
				that.openCallbacks.splice(id, 1); 
			} // else a strange error happened...
			
			// mark with resourceName if not done by resource plugin
			if ( !items.length == 0 && !items[0].resourceName ) {
				for ( var j = 0; j < items.length; j++) {
					items[j].resourceName = this.resourceName;
				}
			}
			
			// merge new items with the rest
			jQuery.merge( allitems, items ); 

			that.queryCallback(callback, allitems, timer);
		});
	}
};

/**
 * checks if all resources returned  and calls the callback
 * @return void
 * @hide
 */
GENTICS.Aloha.ResourceManager.prototype.queryCallback = function (cb, items, timer) {

	// if we all callbacks came back we are done!
	if (this.openCallbacks.length == 0) {
		
		// unset the timer...
		clearTimeout(timer);
		
		// sort items by weight
		items.sort(function (a,b) {return b.weight - a.weight;});
	    
		// prepare result data for the JSON Reader
		var result =  {
			    results: items.length,
			    items: items
		 	 };
		
		// Give data back.
		cb.call( this, result);
	}
};

/**
 * Pass an object, which represents an marked resource to corresponding resource, 
 * so that it can make the content clean (prepare for saving)
 * @param obj jQuery object representing an editable
 * @return void
 */
GENTICS.Aloha.ResourceManager.prototype.makeClean = function(obj) {
	// iterate through all registered resources
	var that = this;
	var resource = {};
	
	// find all resource tags
	obj.find('[data-GENTICS-aloha-resource=' + this.prefix + ']').each(function() {
		for ( var i = 0; i < that.resources.length; i++) {
			resource.makeClean(obj);
		}	
		GENTICS.Aloha.Log.debug(that, "Passing contents of HTML Element with id { " + this.attr("id") + " } for cleaning to resource { " + resource.resourceName + " }");
		resource.makeClean(this);
	});	
};

/**
 * Markes an object as resource of this type and with this item.id.
 * Objects can be any DOM objects as A, SPAN, ABBR, etc. or
 * special objects such as GENTICS_aloha_block elements.
 * This method marks the target obj with two private attributes:
 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
 * * data-GENTICS-aloha-resource: stores the resourceName
 * * data-GENTICS-aloha-resource-id: stores the resourceItem.id
 * @param obj jQuery object to make clean
 * @param resourceItem Aloha.ResourceItem the item which is aplied to obj
 * @return void
 */
GENTICS.Aloha.ResourceManager.prototype.markObject = function (obj, resourceItem) {
	var resource = this.getResource(resourceItem.resourceName)
	if ( resource ) {
		jQuery(obj).attr('data-GENTICS-aloha-resource', resourceItem.resourceName);
		jQuery(obj).attr('data-GENTICS-aloha-resource-id', resourceItem.id);
		resource.markObject(obj, resourceItem);
	} else {
		GENTICS.Aloha.Log.error(this, "Trying to apply a resource { " + resourceItem.name + " } to an object, but resourceItem has no resourceName.");
	}
};

/**
 * Create the ResourceManager object
 * @hide
 */
GENTICS.Aloha.ResourceManager = new GENTICS.Aloha.ResourceManager();

/**
 * Expose a nice name for the ResourceManager
 * @hide
 */
GENTICS.Aloha.ResourceManager.toString = function() {
	return "com.gentics.aloha.ResourceManager";
};