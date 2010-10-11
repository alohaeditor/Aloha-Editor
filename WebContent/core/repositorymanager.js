/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Repository Manager
 * @namespace GENTICS.Aloha
 * @class RepositoryManager
 * @singleton
 */
GENTICS.Aloha.RepositoryManager = function() {
	this.repositories = new Array();
};


GENTICS.Aloha.RepositoryManager.prototype.openCallbacks = [];

/**
 * Initialize all registered repositories
 * @return void
 * @hide
 */
GENTICS.Aloha.RepositoryManager.prototype.init = function() {
	
	// get the repository settings
	if (GENTICS.Aloha.settings.repositories == undefined) {
		GENTICS.Aloha.settings.repositories = {};
	}

	// iterate through all registered repositories
	for ( var i = 0; i < this.repositories.length; i++) {
		var repository = this.repositories[i];
		
		if (repository.settings == undefined) {
			repository.settings = {};
		}
		
		// merge the specific settings with the repository default settings
		if ( GENTICS.Aloha.settings.repositories[repository.repositoryId] ) {
			jQuery.extend(repository.settings, GENTICS.Aloha.settings.repositories[repository.repositoryId]);
		}
		
		repository.init();
	}
};

/**
 * Register a Repository
 * @param {GENTICS.Aloha.Repository} repository Repository to register
 */

GENTICS.Aloha.RepositoryManager.prototype.register = function(repository) {
	
	if (repository instanceof GENTICS.Aloha.Repository) {
		if ( !this.getRepository(repository.repositoryId) ) {
			this.repositories.push(repository); 
		} else {
			GENTICS.Aloha.Log.warn(this, "A repository with name { " + repository.repositoryId+ " } already registerd. Ignoring this.");
		}
	} else {
		GENTICS.Aloha.Log.error(this, "Trying to register a repository which is not an instance of GENTICS.Aloha.Repository.");
	}
	
};

/**
 * Returns a repository object identified by repositoryId.
 * @param {String} repositoryId the name of the repository
 * @return {GENTICS.Aloha.Repository} a repository or null if name not found
 */
GENTICS.Aloha.RepositoryManager.prototype.getRepository = function(repositoryId) {
	
	for ( var i = 0; i < this.repositories.length; i++) {
		if ( this.repositories[i].repositoryId == repositoryId ) {
			return this.repositories[i];
		}
	}
	return null;
};

/** 
 * Searches a all repositories for repositoryObjects matching query and repositoryObjectType
 * @param {String} query the query string passed to the repository
 * @param {Array} objectTypeFilter an array of strings with searched objectTypeFilter
 * @param {function} callback defines an callback function( repositoryResult ) which will be called after a time out of 5sec or when all repositories returned their result
 * @return {Array} Array of Items
 */
GENTICS.Aloha.RepositoryManager.prototype.query = function(queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, repositoryId, callback) {
	
	var that = this;
	var allitems = [];
	var repositories = [];

	// reset callback queue
	this.openCallbacks = [];
	
	// start timer in case a repository does not deliver in time
	var timer = setTimeout( function() {
		// reset callback stack
		that.openCallbacks = [];
		that.queryCallback(callback, allitems, timer);
	}, 5000);

	// only query the repositoryId for Navigation Elements
	if ( repositoryId ) {
		repositories.push(this.getRepository(repositoryId));
	} else {
		repositories = this.repositories;
	}

	// iterate through all registered repositories
	for ( var i = 0; i < repositories.length; i++) {
		
		this.openCallbacks.push(repositories[i].repositoryId);
		
        try {
        	
			var notImplemented = repositories[i].query( queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, function (items) {
			    
				// remove the repository from the callback stack
				var id = that.openCallbacks.indexOf( this.repositoryId );
				if (id != -1) {
					that.openCallbacks.splice(id, 1); 
				}
				
				// mark with repositoryId if not done by repository plugin
				if ( !items.length == 0 && !items[0].repositoryId ) {
					for ( var j = 0; j < items.length; j++) {
						items[j].repositoryId = this.repositoryId;
					}
				}
				
				// merge new items with the rest
				jQuery.merge( allitems, items ); 
	
				that.queryCallback(callback, allitems, timer);
			});
			
        } catch (e) {
//          this.fireEvent('exception', this, 'response', action, arg, null, e);
//          return false;
        	notImplemented = true;
        }
		
		// remove this repository from the callback stack
		if ( notImplemented ) {
			var id = that.openCallbacks.indexOf( repositories[i].repositoryId );
			if (id != -1) {
				this.openCallbacks.splice(id, 1);
				if ( i == repositories.length - 1 ) {
					this.queryCallback(callback, allitems, timer);
				}
			}
		}
	}
};

/**
 * checks if all repositories returned  and calls the callback
 * @return void
 * @hide
 */
GENTICS.Aloha.RepositoryManager.prototype.queryCallback = function (cb, items, timer) {

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
 * Returns  navigation items.
 * @param {Item} mother the resouceItem  in from which the naviagtion should be returned.
 * @param {Array} objectTypeFilter an array of strings with desired objectTypeFilter. 
 * @param {function} callback needs to be called callback.call( this, Items ) with the result items
 * @return {Array} Items the found objects.
 */
GENTICS.Aloha.RepositoryManager.prototype.getChildren = function ( objectTypeFilter, filter, inFolderId, inTreeId, orderBy, maxItems, skipCount, renditionFilter, repositoryId, callback ) {

	var that = this;
	var allitems = [];
	var repositories = [];

	// reset callback queue
	this.openNavigationCallbacks = [];

	// return repositories
	if ( inFolderId == 'aloha' && this.repositories.length > 0 ) {
		var repos = [];
		for ( var i = 0; i < this.repositories.length; i++) {
			repos.push({
				id: this.repositories[i].repositoryId,
				displayName: this.repositories[i].repositoryName,
				repositoryId: this.repositories[i].repositoryId,
				objectType: 'repository',
				hasMoreItems: true
			})
		}
		that.getNavigationCallback(callback, repos, null);
		return;
	}
	
	// start timer in case a repository does not deliver in time
	var timer = setTimeout( function() {
		// reset callback stack
		that.openNavigationCallbacks = [];
		that.getNavigationCallback(callback, allitems, timer);
	}, 5000);

	// only query the repositoryId for Navigation Elements
	if ( repositoryId ) {
		repositories.push(this.getRepository(repositoryId));
	} else {
		repositories = this.repositories;
	}

	// iterate through all registered repositories
	for ( var i = 0; i < repositories.length; i++) {
		
		this.openNavigationCallbacks.push(repositories[i].repositoryId);
		
        try {
		
			var notImplemented = repositories[i].getChildren( objectTypeFilter, filter, inFolderId, inTreeId, orderBy, maxItems, skipCount, renditionFilter, function (items) {
			    
				// remove the repository from the callback stack
				var id = that.openNavigationCallbacks.indexOf( this.repositoryId );
				if (id != -1) {
					that.openNavigationCallbacks.splice(id, 1); 
				}
		
				// merge new items with the rest
				jQuery.merge( allitems, items ); 
	
				that.getNavigationCallback(callback, allitems, timer);
			});

        } catch (e) {
//          this.fireEvent('exception', this, 'response', action, arg, null, e);
//          return false;
        	notImplemented = true;
        }
		
		// remove this repository from the callback stack
		if ( notImplemented ) {
			var id = that.openNavigationCallbacks.indexOf( repositories[i].repositoryId );
			if (id != -1) {
				this.openNavigationCallbacks.splice(id, 1);
				if ( i == repositories.length - 1 ) {
					this.getNavigationCallback(callback, allitems, timer);
				}
			}
		}

	}
};

/**
* checks if all repositories returned  and calls the callback
* @return void
* @hide
*/
GENTICS.Aloha.RepositoryManager.prototype.getNavigationCallback = function (cb, items, timer) {

	// if we all callbacks came back we are done!
	if (this.openNavigationCallbacks.length == 0) {
		
		// unset the timer...
		if (timer) clearTimeout(timer);
    
		// Give data back.
		cb.call( this, items);
	}
};

/**
 * Pass an object, which represents an marked repository to corresponding repository, 
 * so that it can make the content clean (prepare for saving)
 * @param obj jQuery object representing an editable
 * @return void
 */
GENTICS.Aloha.RepositoryManager.prototype.makeClean = function(obj) {
	// iterate through all registered repositories
	var that = this;
	var repository = {};
	
	// find all repository tags
	obj.find('[data-GENTICS-aloha-repository=' + this.prefix + ']').each(function() {
		for ( var i = 0; i < that.repositories.length; i++) {
			repository.makeClean(obj);
		}	
		GENTICS.Aloha.Log.debug(that, "Passing contents of HTML Element with id { " + this.attr("id") + " } for cleaning to repository { " + repository.repositoryId + " }");
		repository.makeClean(this);
	});	
};

/**
 * Markes an object as repository of this type and with this item.id.
 * Objects can be any DOM objects as A, SPAN, ABBR, etc. or
 * special objects such as GENTICS_aloha_block elements.
 * This method marks the target obj with two private attributes:
 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
 * * data-GENTICS-aloha-repository: stores the repositoryId
 * * data-GENTICS-aloha-object-id: stores the object.id
 * @param obj jQuery object to make clean
 * @param object Aloha.Repository.Object the item which is aplied to obj
 * @return void
 */
GENTICS.Aloha.RepositoryManager.prototype.markObject = function (obj, item) {
	var repository = this.getRepository(item.repositoryId)
	if ( repository ) {
		jQuery(obj).attr('data-GENTICS-aloha-repository', item.repositoryId);
		jQuery(obj).attr('data-GENTICS-aloha-object-id', item.id);
		repository.markObject(obj, item);
	} else {
		GENTICS.Aloha.Log.error(this, "Trying to apply a repository { " + item.name + " } to an object, but item has no repositoryId.");
	}
};

/**
 * Create the RepositoryManager object
 * @hide
 */
GENTICS.Aloha.RepositoryManager = new GENTICS.Aloha.RepositoryManager();

/**
 * Expose a nice name for the RepositoryManager
 * @hide
 */
GENTICS.Aloha.RepositoryManager.toString = function() {
	return "com.gentics.aloha.RepositoryManager";
};
