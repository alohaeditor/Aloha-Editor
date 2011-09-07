/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright � 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(
['aloha/jquery'],
function(jQuery, undefined) {
	"use strict";
	
	var
		$ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha,
		Class = window.Class;

/**
 * Repository Manager
 * @namespace Aloha.Repository
 * @class RepositoryManager
 * @singleton
 */
Aloha.RepositoryManager = Class.extend({
	repositories: [],

	openCallbacks: [],

	/**
	 * Initialize all registered repositories
	 * @return void
	 * @hide
	 */
	init: function() {
		var i, repository;

		// get the repository settings
		if (typeof Aloha.settings.repositories === 'undefined') {
			Aloha.settings.repositories = {};
		}

		// iterate through all registered repositories
		for ( i = 0; i < this.repositories.length; i++) {
			repository = this.repositories[i];

			if (typeof repository.settings === 'undefined') {
				repository.settings = {};
			}

			// merge the specific settings with the repository default settings
			if ( Aloha.settings.repositories[repository.repositoryId] ) {
				jQuery.extend(repository.settings, Aloha.settings.repositories[repository.repositoryId]);
			}

			repository.init();
		}
	},

	/**
	 * Register a Repository
	 * @param {Aloha.Repository} repository Repository to register
	 */
	register: function(repository) {

		if (repository instanceof Aloha.AbstractRepository) {
			if ( !this.getRepository(repository.repositoryId) ) {
				this.repositories.push(repository);
			} else {
				Aloha.Log.warn(this, 'A repository with name { ' + repository.repositoryId + ' } already registerd. Ignoring this.');
			}
		} else {
			Aloha.Log.error(this, 'Trying to register a repository which is not an instance of Aloha.Repository.');
		}

	},

	/**
	 * Returns a repository object identified by repositoryId.
	 * @param {String} repositoryId the name of the repository
	 * @return {Aloha.Repository} a repository or null if name not found
	 */
	getRepository: function(repositoryId) {

		for ( var i = 0; i < this.repositories.length; i++) {
			if ( this.repositories[i].repositoryId == repositoryId ) {
				return this.repositories[i];
			}
		}
		return null;
	},

	/**
	 * Searches a all repositories for repositoryObjects matching query and repositoryObjectType
	 *
	<pre><code>
		var params = {
				queryString: 'hello',
				objectTypeFilter: ['website'],
				filter: null,
				inFolderId: null,
				orderBy: null,
				maxItems: null,
				skipCount: null,
				renditionFilter: null,
				repositoryId: null
		};
		Aloha.RepositoryManager.query( params, function( items ) {
			// do something with the result items
			console.log(items);
		});
	</code></pre>
	 *
	 * @param {object} params object with properties
	 * <div class="mdetail-params"><ul>
	 * <li><code> queryString</code> :  String <div class="sub-desc">The query string for full text search</div></li>
	 * <li><code> objectTypeFilter</code> : array  (optional) <div class="sub-desc">Object types that will be returned.</div></li>
	 * <li><code> filter</code> : array (optional) <div class="sub-desc">Attributes that will be returned.</div></li>
	 * <li><code> inFolderId</code> : boolean  (optional) <div class="sub-desc">This is indicates whether or not a candidate object is a child-object of the folder object identified by the given inFolderId (objectId).</div></li>
	 * <li><code> inTreeId</code> : boolean  (optional) <div class="sub-desc">This indicates whether or not a candidate object is a descendant-object of the folder object identified by the given inTreeId (objectId).</div></li>
	 * <li><code> orderBy</code> : array  (optional) <div class="sub-desc">ex. [{lastModificationDate:’DESC’, name:’ASC’}]</div></li>
	 * <li><code> maxItems</code> : Integer  (optional) <div class="sub-desc">number items to return as result</div></li>
	 * <li><code> skipCount</code> : Integer  (optional) <div class="sub-desc">This is tricky in a merged multi repository scenario</div></li>
	 * <li><code> renditionFilter</code> : array  (optional) <div class="sub-desc">Instead of termlist an array of kind or mimetype is expected. If null or array.length == 0 all renditions are returned. See http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310 for renditionFilter</div></li>
	 * </ul></div>
	 * @param {function} callback defines a callback function( items ) which will be called when all repositories returned their results or after a time out of 5sec.
	 * "items" is an Array of objects construced with Document/Folder.
	 * @void
	 */
	query: function(params, callback) {
		var that = this,
			repo,
			// The marged results collected from repository responses
			allitems = [],
			// The set of repositories which we want to delegate work to
			repositories = [],
			// When this timer times-out, whatever has been collected in
			// allitems will be returned, and numOpenCallbacks is reset to 0
			timer,
			// A counting semaphore (working in reverse, ie: 0 means free)
			numOpenCallbacks = 0,
			/**
			 * Collects the results from each repository, and decrements the
			 * numOpenCallbacks semaphore.
			 *
			 * Invoked by each repository when it wants to present its results
			 * to the manager.
			 *
			 * nb: "this" is reference to the calling repository
			 *
			 * If a repository invokes this callback after all openCallbacks
			 * have been closed (ie: numOpenCallbacks == 0) this repository is
			 * too late--has "missed the ship," and we will ignore it.
			 *
			 * If numOpenCallbacks decrements to 0 during this call, it means
			 * that the the manager is ready to report to the client which is
			 * done through queryCallback.
			 *
			 * @param {Array} items - Query results returned by the repository 
			 */
			processResults = function (items) {
				if (numOpenCallbacks == 0) {
					return;
				}
				
				// Add the repositoryId for each item if it has not already
				// been done by a negligent repositories
				var repoId = this.repositoryId;
				if (items && items.length && !items[0].repositoryId ) {
					for (var i = 0; i < items.length; ++i) {
						items[i].repositoryId = repoId;
					}
					$.merge(allitems, items);
				}
				
				if (--numOpenCallbacks == 0) {
					that.queryCallback(callback, allitems, timer);
				}
			};
		
		// Unless the calling client specifies otherwise, we will wait a
		// maximum of 5 seconds for all repositories to be queried and respond.
		// 5 seconds is deemed to be the reasonable time to wait when querying
		// the repository manager in the context of something like autocomplete
		var timeout = parseInt(params.timeout, 10) || 5000;
		timer = setTimeout(function() {
			numOpenCallbacks = 0;
			that.queryCallback(callback, allitems, timer);
		}, timeout);
		
		// If no repositryId is specified in the params argument, then we will
		// query all registered repositories
		if (params.repositoryId) {
			repositories.push(this.getRepository(params.repositoryId));
		} else {
			repositories = this.repositories;
		}
		
		if (repositories.length) {
			for (var i = 0; i < repositories.length; ++i) {
				repo = repositories[i];
				
				if (typeof repo.query === 'function') {
					++numOpenCallbacks;
					
					repo.query(
						params,
						function () { processResults.apply(repo, arguments); }
					);
				};
			}
		} else {
			this.queryCallback(callback, allitems, timer);
		}
	},

	/**
	 * Passes all the results we have collected to the client through the
	 * callback it specified
	 *
	 * @param {Function} callback - Callback specified by client when invoking
	 *								the query method
	 * @param {Array} items - Results, collected from all repositories
	 * @param {Timer} timer - We need to clear this timer
	 * @return void
	 * @hide
	 */
	queryCallback: function (callback, items, timer) {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
		}
		
		// TODO: Implement sorting based on repository specification
		// sort items by weight
		//items.sort(function (a,b) {
		//	return (b.weight || 0) - (a.weight || 0);
		//});
		
		// prepare result data for the JSON Reader
		var result = {
			items   : items,
			results : items.length
		};
		
		callback.call(this, result);
	},
	
	/**
	 * Returns children items. (see query for an example)
	 * @param {object} params object with properties
	 * <div class="mdetail-params"><ul>
	 * <li><code> objectTypeFilter</code> : array  (optional) <div class="sub-desc">Object types that will be returned.</div></li>
	 * <li><code> filter</code> : array  (optional) <div class="sub-desc">Attributes that will be returned.</div></li>
	 * <li><code> inFolderId</code> : boolean  (optional) <div class="sub-desc">This indicates whether or not a candidate object is a child-object of the folder object identified by the given inFolderId (objectId).</div></li>
	 * <li><code> orderBy</code> : array  (optional) <div class="sub-desc">ex. [{lastModificationDate:’DESC’, name:’ASC’}]</div></li>
	 * <li><code> maxItems</code> : Integer  (optional) <div class="sub-desc">number items to return as result</div></li>
	 * <li><code> skipCount</code> : Integer  (optional) <div class="sub-desc">This is tricky in a merged multi repository scenario</div></li>
	 * <li><code> renditionFilter</code> : array  (optional) <div class="sub-desc">Instead of termlist an array of kind or mimetype is expected. If null or array.length == 0 all renditions are returned. See http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310 for renditionFilter</div></li>
	 * </ul></div>
	 * @param {function} callback defines a callback function( items ) which will be called when all repositories returned their results or after a time out of 5sec.
	 * "items" is an Array of objects construced with Document/Folder.
	 * @void
	 */
	getChildren: function ( params, callback ) {

		var that = this,
			allitems = [],
			repositories = [],
			i,
			timer,
			repos = [],
			id,
			notImplFunc = function (items) {
				// remove the repository from the callback stack
				var id = that.openChildrenCallbacks.indexOf( this.repositoryId );
				if (id != -1) {
					that.openChildrenCallbacks.splice(id, 1);
				}

				// merge new items with the rest
				jQuery.merge( allitems, items );

				that.getChildrenCallback(callback, allitems, timer);
			},
			notImplemented;

		// reset callback queue
		this.openChildrenCallbacks = [];

		// return repositories
		if ( params.inFolderId == 'aloha' && this.repositories.length > 0 ) {
			repos = [];
			for ( i = 0; i < this.repositories.length; i++) {
				repos.push( new Aloha.RepositoryFolder ({
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
		timer = setTimeout( function() {
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
		for ( i = 0; i < repositories.length; i++) {

			this.openChildrenCallbacks.push(repositories[i].repositoryId);

		    try {
					notImplemented = repositories[i].getChildren( params, notImplFunc);
		    } catch (e) {
					// this.fireEvent('exception', this, 'response', action, arg, null, e);
					// return false;
					notImplemented = true;
		    }

			// remove this repository from the callback stack
			if ( notImplemented ) {
				id = that.openChildrenCallbacks.indexOf( repositories[i].repositoryId );
				if (id != -1) {
					this.openChildrenCallbacks.splice(id, 1);
					if ( i == repositories.length - 1 ) {
						this.getChildrenCallback(callback, allitems, timer);
					}
				}
			}

		}
	},

	/**
	* checks if all repositories returned  and calls the callback
	* @return void
	* @hide
	*/
	getChildrenCallback: function (cb, items, timer) {

		// if we all callbacks came back we are done!
		if (this.openChildrenCallbacks.length === 0) {

			// unset the timer...
			if (timer) clearTimeout(timer);

			// Give data back.
			cb.call( this, items);
		}
	},

	/**
	 * Pass an object, which represents an marked repository to corresponding repository,
	 * so that it can make the content clean (prepare for saving)
	 * @param obj jQuery object representing an editable
	 * @return void
	 */
	makeClean: function(obj) {
		// iterate through all registered repositories
		var that = this,
			repository = {};

		// find all repository tags
		obj.find('[data-gentics-aloha-repository=' + this.prefix + ']').each(function() {
			for ( var i = 0; i < that.repositories.length; i++) {
				repository.makeClean(obj);
			}
			Aloha.Log.debug(that, 'Passing contents of HTML Element with id { ' + this.attr('id') + ' } for cleaning to repository { ' + repository.repositoryId + ' }');
			repository.makeClean(this);
		});
	},

	/**
	 * Markes an object as repository of this type and with this item.id.
	 * Objects can be any DOM objects as A, SPAN, ABBR, etc. or
	 * special objects such as aloha-aloha_block elements.
	 * This method marks the target obj with two private attributes:
	 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
	 * * data-gentics-aloha-repository: stores the repositoryId
	 * * data-gentics-aloha-object-id: stores the object.id
	 * @param obj {DOMObject} DOM object to mark
	 * @param object {Aloha.Repository.Object} the item which is applied to obj,
	 *  	if set to null, the data-GENTICS-... attributes are removed
	 * @return void
	 */
	markObject: function (obj, item) {
		var repository = undefined;

		// nothing to do, if no object given
		if (!obj) {
			return;
		}
		if (item) {
			repository = this.getRepository(item.repositoryId);
			if ( repository ) {
				jQuery(obj).attr({
					'data-gentics-aloha-repository': item.repositoryId,
					'data-gentics-aloha-object-id': item.id
				});
				repository.markObject(obj, item);
			} else {
				Aloha.Log.error(this, 'Trying to apply a repository { ' + item.name + ' } to an object, but item has no repositoryId.');
			}
		} else {
			// remove the data attributes
			jQuery(obj).removeAttr('data-gentics-aloha-repository');
			jQuery(obj).removeAttr('data-gentics-aloha-object-id');
		}
	},

	/**
	 * Get the object for which the given DOM object is marked from the repository.
	 * @param obj {DOMObject} DOM object which probably is marked
	 * @param callback {function} callback function
	 */
	getObject: function (obj, callback) {
		var that = this,
			jqObj = jQuery(obj),
			repository = this.getRepository(jqObj.attr('data-gentics-aloha-repository')),
			itemId = jqObj.attr('data-gentics-aloha-object-id');
		if (repository && itemId) {
			// initialize the item cache (per repository) if not already done
			this.itemCache = this.itemCache || [];
			this.itemCache[repository.repositoryId] = this.itemCache[repository.repositoryId] || [];

			// when the item is cached, we just call the callback method
			if (this.itemCache[repository.repositoryId][itemId]) {
				callback.call(this, [this.itemCache[repository.repositoryId][itemId]]);
			} else {
				// otherwise we get the object from the repository
				repository.getObjectById(itemId, function (items) {
					// make sure the item is in the cache (for subsequent calls)
					that.itemCache[repository.repositoryId][itemId] = items[0];
					callback.call(this, items);
				});
			}
		}
	}
});

/**
 * Create the RepositoryManager object
 * @hide
 */
Aloha.RepositoryManager = new Aloha.RepositoryManager();

/**
 * Expose a nice name for the RepositoryManager
 * @hide
 */
Aloha.RepositoryManager.toString = function() {
	return 'repositorymanager';
};

	return Aloha.RepositoryManager;
});
