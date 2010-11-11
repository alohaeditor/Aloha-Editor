/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
GENTICS.Aloha.RepositoryManager.prototype.query = function( params, callback ) {
	
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

	// only query the repositoryId for Children Elements
	if ( params.repositoryId ) {
		repositories.push(this.getRepository(params.repositoryId));
	} else {
		repositories = this.repositories;
	}

	// iterate through all registered repositories
	for ( var i = 0; i < repositories.length; i++) {
		
		this.openCallbacks.push(repositories[i].repositoryId);
		
        try {
        	
			var notImplemented = repositories[i].query( params, function (items) {
			    
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
 * Returns children items.
 */
GENTICS.Aloha.RepositoryManager.prototype.getChildren = function ( params, callback ) {

	var that = this;
	var allitems = [];
	var repositories = [];

	// reset callback queue
	this.openChildrenCallbacks = [];

	// return repositories
	if ( params.inFolderId == 'aloha' && this.repositories.length > 0 ) {
		var repos = [];
		for ( var i = 0; i < this.repositories.length; i++) {
			repos.push( new GENTICS.Aloha.Repository.Folder ({
				id: this.repositories[i].repositoryId,
				name: this.repositories[i].repositoryName,
				repositoryId: this.repositories[i].repositoryId,
				type: 'repository',
				hasMoreItems: true
			}));
		}
		that.getChildrenCallback(callback, repos, null);
		return;
	}
	
	// start timer in case a repository does not deliver in time
	var timer = setTimeout( function() {
		// reset callback stack
		that.openChildrenCallbacks = [];
		that.getChildrenCallback(callback, allitems, timer);
	}, 5000);

	// only query the repositoryId for Children Elements
	if ( params.repositoryId ) {
		repositories.push(this.getRepository(params.repositoryId));
	} else {
		repositories = this.repositories;
	}

	// iterate through all registered repositories
	for ( var i = 0; i < repositories.length; i++) {
		
		this.openChildrenCallbacks.push(repositories[i].repositoryId);
		
        try {
		
			var notImplemented = repositories[i].getChildren( params, function (items) {
			    
				// remove the repository from the callback stack
				var id = that.openChildrenCallbacks.indexOf( this.repositoryId );
				if (id != -1) {
					that.openChildrenCallbacks.splice(id, 1); 
				}
		
				// merge new items with the rest
				jQuery.merge( allitems, items ); 
	
				that.getChildrenCallback(callback, allitems, timer);
			});

        } catch (e) {
//          this.fireEvent('exception', this, 'response', action, arg, null, e);
//          return false;
        	notImplemented = true;
        }
		
		// remove this repository from the callback stack
		if ( notImplemented ) {
			var id = that.openChildrenCallbacks.indexOf( repositories[i].repositoryId );
			if (id != -1) {
				this.openChildrenCallbacks.splice(id, 1);
				if ( i == repositories.length - 1 ) {
					this.getChildrenCallback(callback, allitems, timer);
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
GENTICS.Aloha.RepositoryManager.prototype.getChildrenCallback = function (cb, items, timer) {

	// if we all callbacks came back we are done!
	if (this.openChildrenCallbacks.length == 0) {
		
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
	var repository = this.getRepository(item.repositoryId);
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
