/* repositorymanager.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'jquery',
	'util/class',
	'aloha/core',
	'aloha/console',
	'aloha/repositoryobjects' // Provides Aloha.RepositoryFolder
], function (
	$,
	Class,
	Aloha,
	Console,
	__unused__
) {
	'use strict';

	/**
	 * Given an input set, returns a new set which is a range of the input set
	 * that maps to the given predicate.
	 *
	 * Prefers native Array.prototype.filter() where available (after JavaScript
	 * 1.6).
	 *
	 * @param {Array} domain
	 * @param {function:boolean} predicate
	 * @return {Array} Sub set of domain
	 */
	var filter = (function (native) {
		return (native
			? function (domain, predicate) {
				return domain.filter(predicate);
			}
			: function (domain, predicate) {
				var codomain = [];
				var i;
				for (i = 0; i < domain.length; i++) {
					if (predicate(domain[i])) {
						codomain.push(domain[i]);
					}
				}
				return codomain;
			}
		);
	}(Array.prototype.hasOwnProperty('filter')));

	/**
	 * Bundles results, and meta information in preparation for the JSON Reader.
	 *
	 * Used with query().
	 *
	 * @param {Array.<Document|Folder>} items Results, collected from all
	 *                                        repositories.
	 * @param {object<string, number>} meta Optional object containing metainfo.
	 * @return {object} Result object.
	 */
	function bundle(items, meta) {
		var result = {
			items: items,
			results: items.length
		};
		if (meta) {
			result.numItems = meta.numItems;
			result.hasMoreItems = meta.hasMoreItems;
			result.timeout = meta.timeout;
		}
		return result;
	}

	/**
	 * Passes all the results we have collected to the client through the
	 * callback it specified.
	 *
	 * TODO: Implement sorting based on repository specification sort
	 *       items by weight.
	 * items.sort(function (a, b) {
	 *	return (b.weight || 0) - (a.weight || 0);
	 * });
	 *
	 * @param {function} callback Callback specified by client when invoking
	 *                            the query method.
	 * @param {Array.<Document|Folder>|object<string, number>} results
	 */
	function report(callback, results) {
		callback(results);
	}

	/**
	 * Predicates; used to filter lists of repositories based on whether they
	 * implement a method or not.
	 *
	 * @type {object<string, function(Repository):boolean}
	 */
	var repositoryFilters = {
		query: function (repository) {
			return typeof repository.query === 'function';
		},
		getChildren: function (repository) {
			return typeof repository.getChildren === 'function';
		},
		getSelectedFolder: function (repository) {
			return typeof repository.getSelectedFolder === 'function';
		}
	};

	/**
	 * Repository Manager.
	 *
	 * @namespace Aloha
	 * @class RepositoryManager
	 * @singleton
	 */
	var RepositoryManager = Class.extend({

		repositories: [],

		settings: (Aloha.settings && Aloha.settings.repositories) || {},

		initialized: false,

		/**
		 * Initializes all registered repositories.
		 *
		 *                            ???
		 *                             |
		 *                             v
		 *
		 * Warning: testing has shown that repositories are maybe not loaded yet
		 * (found that case in IE7), so don't rely on that in this init
		 * function.
		 *
		 *                             ^
		 *                             |
		 *                            !!!
		 */
		init: function () {
			var manager = this;
			if (typeof manager.settings.timeout === 'undefined') {
				manager.settings.timeout = 5000;
			}
			var i;
			for (i = 0; i < manager.repositories.length; i++) {
				manager.initRepository(manager.repositories[i]);
			}
			manager.initialized = true;
		},

		/**
		 * Registers a Repository.
		 *
		 * If the repositorie is registered after the Repository Manager is
		 * initialized it will be automatically initialized.
		 *
		 * @param {Repository} repository Repository to register.
		 */
		register: function (repository) {
			var manager = this;
			if (!manager.getRepository(repository.repositoryId)) {
				manager.repositories.push(repository);
				if (manager.initialized) {
					manager.initRepository(repository);
				}
			} else {
				Console.warn(manager, 'A repository with name "'
						+ repository.repositoryId
						+ '" already registerd. Ignoring this.');
			}
		},

		/**
		 * Initializes a repository.
		 *
		 * @param {Repository} repository Repository to initialize.
		 */
		initRepository: function (repository) {
			var manager = this;
			if (!repository.settings) {
				repository.settings = {};
			}
			if (manager.settings[repository.repositoryId]) {
				$.extend(repository.settings,
				         manager.settings[repository.repositoryId]);
			}
			repository.init();
		},

		/**
		 * Returns the repository identified by repositoryId.
		 *
		 * @param {String} id Id of repository to retrieve.
		 * @return {Repository|null} Repository or null if none with the given
		 *                           id is found.
		 */
		getRepository: function (id) {
			var manager = this;
			var i;
			for (i = 0; i < manager.repositories.length; i++) {
				if (manager.repositories[i].repositoryId === id) {
					return manager.repositories[i];
				}
			}
			return null;
		},

		/**
		 * Searches all repositories for repositoryObjects matching query and
		 * repositoryObjectType.
		 *
		 * <pre><code>
		 *  // Example:
		 *  var params = {
		 *      queryString: 'hello',
		 *      objectTypeFilter: ['website'],
		 *      filter: null,
		 *      inFolderId: null,
		 *      orderBy: null,
		 *      maxItems: null,
		 *      skipCount: null,
		 *      renditionFilter: null,
		 *      repositoryId: null
		 *  };
		 *  Aloha.RepositoryManager.query(params, function (items) {
		 *      Console.log(items);
		 *  });
		 * </code></pre>
		 *
		 * @param {object<string, mixed>} params
		 *
		 *       queryString: String             The query string for full text
		 *                                       search.
		 *  objectTypeFilter: Array   (optional) Object types to be retrieved.
		 *            filter: Array   (optional) Attributes that will be
		 *                                       included.
		 *        inFolderId: boolean (optional) Whether or not a candidate
		 *                                       object is a child-object of the
		 *                                       folder object identified by the
		 *                                       given inFolderId (objectId).
		 *          inTreeId: boolean (optional) This indicates whether or
		 *                                       not a candidate object is a
		 *                                       descendant-object of the folder
		 *                                       object identified by the given
		 *                                       inTreeId (objectId).
		 *           orderBy: Array   (optional) example: [{
		 *                                           lastModificationDate: 'DESC',
		 *                                           name: 'ASC'
		 *                                       }]
		 *          maxItems: number  (optional) Number of items to include in
		 *                                       result set.
		 *         skipCount: number  (optional) This is tricky in a merged
		 *                                       multi repository scenario.
		 *   renditionFilter: Array   (optional) Instead of termlist, an
		 *                                       array of kind or mimetype is
		 *                                       expected.  If null or an empty
		 *                                       set, then all renditions are
		 *                                       returned. See
		 *                                       http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310
		 *                                       for renditionFilter.
		 *
		 * @param {function(Document|Folder)} callback Function to be invoked
		 *                                             after the repository
		 *                                             manager has finished
		 *                                             querying all
		 *                                             repositories.
		 */
		query: function (params, callback) {
			var manager = this;

			var i;

			// The merged results, collected from repository responses.
			var results = [];

			// The merged metainfo, collected from repository responses.
			var allmetainfo = {
				numItems: 0,
				hasMoreItems: false
			};

			// A counting semaphore (working in reverse, ie: 0 means free).
			var numOpenQueries;

			// Unless the calling client specifies otherwise, the manager will
			// wait a maximum of 5 seconds for all repositories to be queried
			// and respond. 5 seconds is deemed to be the reasonable time to
			// wait when querying the repository manager in the context of
			// something like autocomplete.
			var timeout = (params.timeout && parseInt(params.timeout, 10))
			           || manager.settings.timeout;

			// When this timer times-out, whatever has been collected in
			// `results' will be returned to the calling client and all further
			// processing aborted.
			var timer = window.setTimeout(function () {
				// Store in metainfo that a timeout occurred.
				allmetainfo = allmetainfo || {};
				allmetainfo.timeout = true;

				if (numOpenQueries > 0) {
					Console.warn(manager, numOpenQueries
							+ ' repositories did not return before the '
							+ 'configured timeout of ' + timeout + 'ms.');
					numOpenQueries = 0;
				}
				clearTimeout(timer);
				report(callback, bundle(results, allmetainfo));
			}, timeout);

			/**
			 * Invoked by each repository when it wants to present its results
			 * to the manager.
			 *
			 * Collects the results from each repository, and decrements the
			 * numOpenQueries semaphore to indicate that there is one less
			 * repository for which the manager is waiting for a reponse.
			 *
			 * If a repository invokes this callback after all openCallbacks
			 * have been closed (ie: numOpenQueries == 0), then the repository
			 * was too late ("missed the ship"), and will be ignored.
			 *
			 * If numOpenQueries decrements to 0 during this call, it means that
			 * the the manager is ready to report the results back to the client
			 * through the report() method.
			 *
			 * @param {Array.<Document|Folder>} items Results returned by the
			 *                                        repository.
			 * @param {object<string, number>} metainfo Optional Metainfo
			 *                                          returned by some
			 *                                          repositories.
			 */
			var process = function (items, metainfo) {
				var repository = this;

				if (0 === numOpenQueries) {
					return;
				}

				if (items && items.length) {

					// Because some negligent repository implementations do not
					// set repositoryId properly.
					if (!items[0].repositoryId) {
						var id = repository.repositoryId;
						var i;
						for (i = 0; i < items.length; i++) {
							items[i].repositoryId = id;
						}
					}

					$.merge(results, items);
				}

				if (metainfo && allmetainfo) {
					allmetainfo.numItems =
						($.isNumeric(metainfo.numItems) &&
						 $.isNumeric(allmetainfo.numItems))
							? allmetainfo.numItems + metainfo.numItems
							: undefined;

					allmetainfo.hasMoreItems =
						(typeof metainfo.hasMoreItems === 'boolean' &&
						 typeof allmetainfo.hasMoreItems === 'boolean')
							? allmetainfo.hasMoreItems || metainfo.hasMoreItems
							: undefined;

					if (metainfo.timeout) {
						allmetainfo.timeout = true;
					}
				} else {

					// Because if even one repository does not return metainfo,
					// so we have no aggregated metainfo at all.
					allmetainfo = undefined;
				}

				Console.debug(manager, 'The repository '
						+ repository.repositoryId + 'returned with '
						+ items.length + ' results.');

				// TODO: how to return the metainfo here?
				if (0 === --numOpenQueries) {
					clearTimeout(timer);
					report(callback, bundle(results, allmetainfo));
				}
			};

			var repositories = params.repositoryId
			                 ? [manager.getRepository(params.repositoryId)]
			                 : manager.repositories;

			var queue = filter(repositories, repositoryFilters.query);

			// If none of the repositories implemented the query method, then
			// don't wait for the timeout, simply report to the client.
			if (0 === queue.length) {
				clearTimeout(timer);
				report(callback, bundle(results, allmetainfo));
				return;
			}

			var makeProcess = function (repository) {
				return function () {
					process.apply(repository, arguments);
				};
			};

			numOpenQueries = queue.length;

			for (i = 0; i < queue.length; i++) {
				queue[i].query(params, makeProcess(queue[i]));
			}
		},

		/**
		 * Retrieves children items.
		 *
		 * @param {object<string,mixed>} params Object with properties.
		 *
		 *  objectTypeFilter: Array   (optional) Object types to be retrieved.
		 *            filter: Array   (optional) Attributes to be retrieved.
		 *        inFolderId: boolean (optional) This indicates whether or not
		 *                                       a candidate object is a
		 *                                       child-object of the folder
		 *                                       object identified by the given
		 *                                       inFolderId (objectId).
		 *           orderBy: Array   (optional) example: [{
		 *                                           lastModificationDate: 'DESC',
		 *                                           name: 'ASC'
		 *                                       }]
		 *          maxItems: number  (optional) number Items to return as a result.
		 *         skipCount: number  (optional) This is tricky in a merged
		 *                                       multi repository scenario.
		 *   renditionFilter: Array   (optional) Instead of termlist an Array
		 *                                       of kind or mimetype is
		 *                                       expected. If null or
		 *                                       Array.length == 0 all
		 *                                       renditions are returned. See
		 *                                       http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310
		 *                                       for renditionFilter.
		 *
		 * @param {function(Document|Folder)} callback Function to be invoked
		 *                                             after the repository
		 *                                             manager has finished
		 *                                             querying all
		 *                                             repositories.
		 */
		getChildren: function (params, callback) {
			var manager = this;

			var i;

			// The marged results, collected from repository responses.
			var results = [];

			// A counting semaphore (working in reverse, ie: 0 means free).
			var numOpenQueries = 0;

			var timeout = (params.timeout && parseInt(params.timeout, 10))
			           || manager.settings.timeout;

			var timer = window.setTimeout(function () {
				if (numOpenQueries > 0) {
					Console.warn(manager, numOpenQueries
							+ ' repositories did not respond before the '
							+ 'configured timeout of ' + timeout + 'ms.');
					numOpenQueries = 0;
				}
				clearTimeout(timer);
				report(callback, results);
			}, timeout);

			var process = function (items) {
				if (0 === numOpenQueries) {
					return;
				}
				if (items) {
					$.merge(results, items);
				}
				if (0 === --numOpenQueries) {
					clearTimeout(timer);
					report(callback, results);
				}
			};

			var repositories = params.repositoryId
			                 ? [manager.getRepository(params.repositoryId)]
			                 : manager.repositories;

			if (params.repositoryFilter && params.repositoryFilter.length) {
				repositories = filter(repositories, function (repository) {
					return -1 < $.inArray(repository.repositoryId,
						params.repositoryFilter);
				});
			}

			// If the inFolderId is the default id of 'aloha', then return all
			// registered repositories as the result set.
			if ('aloha' === params.inFolderId) {
				var hasRepoFilter = params.repositoryFilter
				                 && 0 < params.repositoryFilter.length;

				for (i = 0; i < repositories.length; i++) {
					results.push(new Aloha.RepositoryFolder({
						id: repositories[i].repositoryId,
						name: repositories[i].repositoryName,
						repositoryId: repositories[i].repositoryId,
						type: 'repository',
						hasMoreItems: true
					}));
				}

				clearTimeout(timer);
				report(callback, results);
				return;
			}

			var queue = filter(repositories, repositoryFilters.getChildren);

			if (0 === queue.length) {
				clearTimeout(timer);
				report(callback, results);
				return;
			}

			numOpenQueries = queue.length;

			for (i = 0; i < queue.length; i++) {
				queue[i].getChildren(params, process);
			}
		},

		/**
		 * @fixme: Not tested, but the code for this function does not seem to
		 *        compute repository.makeClean will be undefined
		 *
		 * @todo: Rewrite this function header comment so that is clearer
		 *
		 * Pass an object, which represents an marked repository to corresponding
		 * repository, so that it can make the content clean (prepare for saving)
		 *
		 * @param {jQuery} obj - representing an editable
		 * @return void
		 */
		makeClean: function (obj) {
			// iterate through all registered repositories
			var that = this,
				repository = {},
				i = 0,
				j = that.repositories.length;

			// find all repository tags
			obj.find('[data-gentics-aloha-repository=' + this.prefix + ']').each(function () {
				while (i < j) {
					repository.makeClean(obj);
					i += 1;
				}
				Console.debug(that, 'Passing contents of HTML Element with id { ' + this.attr('id') + ' } for cleaning to repository { ' + repository.repositoryId + ' }');
				repository.makeClean(this);
			});
		},

		/**
		 * Marks an object as repository of this type and with this item.id.
		 * Objects can be any DOM objects as A, SPAN, ABBR, etc. or
		 * special objects such as aloha-aloha_block elements.
		 *
		 * Marks the target obj with two private attributes:
		 * (see http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data)
		 *	- data-gentics-aloha-repository: stores the repositoryId
		 *	- data-gentics-aloha-object-id: stores the object.id
		 *
		 * @param {HTMLElement} obj DOM object to mark.
		 * @param {Aloha.Repository.Object} item Item which is applied to obj,
		 *                                       if set to null, the
		 *                                       "data-GENTICS-..." attributes
		 *                                       are removed.
		 */
		markObject: function (obj, item) {
			if (!obj) {
				return;
			}

			var manager = this;

			if (item) {
				var repository = manager.getRepository(item.repositoryId);
				if (repository) {
					$(obj).attr({
						'data-gentics-aloha-repository': item.repositoryId,
						'data-gentics-aloha-object-id': item.id
					});
					repository.markObject(obj, item);
				} else {
					Console.error(manager, 'Trying to apply a repository "'
							+ item.name
							+ '" to an object, but item has no repositoryId.');
				}
			} else {
				$(obj).removeAttr('data-gentics-aloha-repository')
				      .removeAttr('data-gentics-aloha-object-id');
			}
		},

		/**
		 * Get the object for which the given DOM object is marked from the
		 * repository.
		 *
		 * Will initialize the item cache (per repository) if not already done.
		 *
		 * @param {HTMLElement} element DOM object which probably is marked.
		 * @param {function} callback
		 */
		getObject: function (element, callback) {
			var manager = this;
			var $element = $(element);
			var itemId = $element.attr('data-gentics-aloha-object-id');
			var repositoryId = $element.attr('data-gentics-aloha-repository');
			var repository = manager.getRepository(repositoryId);

			if (repository && itemId) {
				if (!manager.itemCache) {
					manager.itemCache = [];
				}

				var cache = manager.itemCache[repositoryId];
				if (!cache) {
					cache = manager.itemCache[repositoryId] = [];
				}

				if (cache[itemId]) {
					callback([cache[itemId]]);
				} else {
					repository.getObjectById(itemId, function (items) {
						cache[itemId] = items[0];
						callback(items);
					});
				}
			}
		},

		/**
		 * Mark a folder as opened.
		 *
		 * Called by a repository client (eg: repository browser) when a folder
		 * is opened.
		 *
		 * @param {object|Folder} folder Object with property repositoryId.
		 */
		folderOpened: function (folder) {
			var repository = this.getRepository(folder.repositoryId);
			if (typeof repository.folderOpened === 'function') {
				repository.folderOpened(folder);
			}
		},

		/**
		 * Mark a folder as closed.
		 *
		 * Called by a repository client (eg: repository browser) when a folder
		 * is closed.
		 *
		 * @param {object|Folder} folder Object with property repositoryId.
		 */
		folderClosed: function (folder) {
			var repository = this.getRepository(folder.repositoryId);
			if (typeof repository.folderClosed === 'function') {
				repository.folderClosed(folder);
			}
		},

		/**
		 * Mark a folder as selected.
		 *
		 * Called by a repository client (eg: repository browser) when a folder
		 * is selected.
		 *
		 * @param {object|Folder} folder Object with property repositoryId.
		 */
		folderSelected: function (folder) {
			var repository = this.getRepository(folder.repositoryId);
			if (typeof repository.folderSelected === 'function') {
				repository.folderSelected(folder);
			}
		},

		/**
		 * Retrieve the selected folder.
		 *
		 * @return {Folder} Selected folder or null if it cannot be found.
		 */
		getSelectedFolder: function () {
			var repositories = filter(this.repositories,
					repositoryFilters.getSelectedFolder);
			var i;
			var selected;
			for (i = 0; i < repositories.length; i++) {
				selected = repositories[i].getSelectedFolder();
				if (selected) {
					return selected;
				}
			}
			return null;
		},

		/**
		 * Human readable representation of repository manager.
		 *
		 * @return {string}
		 */
		toString: function () {
			return 'repositorymanager';
		}

	});

	Aloha.RepositoryManager = new RepositoryManager();

	return Aloha.RepositoryManager;
});
