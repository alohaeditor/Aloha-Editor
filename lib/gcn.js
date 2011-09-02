/*!
 * Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

(function GCNRepositoryClosure (window, undefined) {
	
	'use strict'
	
	var DEBUG = false;
	
	var
		GENTICS = window.GENTICS || (window.GENTICS = {}),
		 jQuery = window.alohaQuery || window.jQuery,
			  $ = jQuery, 
		  Aloha = window.Aloha;
	
	// FIXME:
	// Delegate session handling to GCN Plugin
	var sid = '';
	
	function getSid (callback) {
		$.ajax({
			url: '/Aloha-Editor/Aloha-Editor-Browser/src/demo/browser/gcn_proxy.php?url='
				 + encodeURIComponent('http://soc-aacc-cms.gentics.com/.Node/?do=31&login=node&password=node'),
			error: function (data) {},
			success: function (data) {
				var json = JSON.parse(data);
				
				sid = json.sessionToken;
				
				if (sid && sid != '' && typeof callback === 'function') {
					callback();
				}
			}
		});
	};
	
	/**
	 * Create the Repositories object. Namespace for Repositories
	 * @hide
	 */
	function createRepositories () {
		if (!Aloha.Repositories) {
			Aloha.Repositories = {};
		}
	};
	
	function initializeRepository () {
		
		var isDebugging = (DEBUG === true);
		
		// FIXME:
		// Delegate rest calls to GCN Plugin
		var host = 'http://soc-aacc-cms.gentics.com';
		
		function restURL (method) {
			var delim = method.match(/\?[^\=]+\=/) ? '&' : '?';
			var url = host + '/CNPortletapp/rest/' + method + delim + 'sid=' + sid;
			
			return '/Aloha-Editor/Aloha-Editor-Browser/src/demo/browser/gcn_proxy.php?url='
				+ encodeURIComponent(url);
		};
		
		function debug () {
			if (isDebugging) {
				console.log.apply(
					{},
					['-- debug ------------------------------------------------\n'].concat(
					Array.prototype.slice.call(arguments),
					'\n-- /debug -----------------------------------------------')
				);
			}
		};
		
		/**
		 * register the plugin with unique name
		 */
		// FIXME:
		// Aloha.Respository is now Aloha.AbstractRepository
		var Repo = Aloha.Repositories.GCNRepo = new Aloha.Repository('com.gentics.aloha.GCN.Page');
		
		Repo.init = function () {
			this.repositoryName = 'com.gentics.aloha.GCN.Page';
		};
		
		/**
		 * Convert orderBy from [{field: order} ...], which is easier for the
		 * user to write into [{by:field, order:order} ...] which is easier for
		 * the sort comparison function to use
		 */
		Repo.buildSortPairs = function (orderBy) {
			if (!orderBy) {
				return [];
			}
			
			var i = orderBy.length,
				sort,
				field,
				order,
				newOrder = [];
			
			while (--i >= 0) {
				sort = orderBy[i];
				for (field in sort) {
					order = sort[field];
					if (typeof order === 'string') {
						order = order.toLowerCase();
						if (order == 'asc' || order == 'desc') {
							newOrder[i] = {by: field, order: order};
							break;
						}
					}
				}
			}
			
			return newOrder;
		};
		
		/**
		 * Prepares filters patterns according to:
		 *		http://docs.oasis-open.org/cmis/CMIS/v1.0/cd04/cmis-spec-v1.0.html#_Ref237323310
		 * Examples:
		 *		*				(include all Renditions)
		 *		cmis:thumbnail	(include only Thumbnails)
		 *		Image/*			(include all image Renditions)
		 *		application/pdf, application/x-shockwave-flash
		 *						(include web ready Renditions)
		 *		cmis:none		(exclude all Renditions)
		 */
		Repo.buildRenditionFilterChecks = function (filters) {
			var f,
			    pattern,
				type,
				subtype,
			    checks = [],
				i = filters.length,
				// We can cache this rgxp so that we do not have recreate it on
				// each iteration
				rgxpKind = /([a-z0-9]+)\/([a-z0-9\*]+)/i;
			
			while (--i >= 0) {
				f = filters[i];
				
				if (f == '*') {
					// all renditions
					return ['*'];
				} else if (f.substring(0, 5) == 'cmis:') {
					pattern = f.substring(5, f.length);	
					
					// no renditions
					if (pattern == 'none') {
						return [];
					}
					
					// check against kind
					checks.push(['kind', pattern]);
				} else if (f.match(rgxpKind)) {
					type = RegExp. $1;
					subtype = RegExp.$2;
					
					// check against mimeType
					checks.push([
						'mimeType',
						subtype == '*'
							? new RegExp(type + '\/.*', 'i')
							: f.toLowerCase()
					]);
				}
			}
			
			return checks;
		};
		
		/**
		 * Transforms the given data, that was fetched from the backend, into a
		 * repository folder
		 * @param {object} data data of a folder fetched from the backend
		 * @return {GENTICS.Aloha.Repository.Object} repository item
		 */
		Repo.getFolder = function(data) {
			if (!data) {
				return null;
			}
			
			return new Aloha.Repository.Folder({
				repositoryId
					 : this.repositoryId,
				type : 'folder',
				id	 : data.id,
				name : data.name
			});
		};
		
		/**
		 * Transforms the given data, that was fetched from the backend, into a
		 * repository item
		 * @param {object} data data of a page fetched from the backend
		 * @return {GENTICS.Aloha.Repository.Object} repository item
		 */
		Repo.getDocument = function(data, objecttype) {
			if (!data) {
				return null;
			}
			
			objecttype = objecttype || '10007';
			// set the id
			data.id = objecttype + '.' + data.id;
			
			// make the path information shorter by replacing path parts in the middle with ...
			var path = data.path;
			var pathLimit = 55;
			
			if (path && (path.length > pathLimit)) {
				path = path.substr(0, pathLimit/2) + '...' + path.substr(path.length - pathLimit/2);
			}
			
			data.path = path;
			
			// FIXME
			//if (data.url && GENTICS.Aloha.GCN.settings.renderBlockContentURL) {
			//	data.url = GENTICS.Aloha.GCN.renderBlockContent(data.url);
			//}
			
			data.repositoryId = this.repositoryId;
			
			return new Aloha.Repository.Document(data);
		};
		
		/**
		 * Queries for a resource of a given type against specified parameters.
		 * If we don't have a method to handle the type of resource requested,
		 * we invoke the callback, passing an empty array, and log a warning.
		 *
		 * @param {string}	 type - of resource to query for (page, file, image)
		 * @param {string}	 id
		 * @param {object}	 params - xhr query parameters
		 * @param {array}	 collection - the array to which we add found documents
		 * @param {function} callback
		 * @return {undefined}
		 */
		Repo.getResources = function (type, folderId, params, collection, callback) {
			var that = this,
				restMethod,
				objName,
				docTypeNum;
			
			switch (type) {
			case 'page':
				restMethod = 'getPages';
				objName = 'pages';
				docTypeNum = '10007';
				break;
			case 'file':
				restMethod = 'getFiles';
				objName = 'files';
				docTypeNum = '10008';
				break;
			case 'image':
				restMethod = 'getImages';
				// objName = 'images';
				//
				// This is a temporary fix to accomodate the fact that the
				// REST-API returns a response for getImages with results in a
				// "files" object, rather than "images" which is what we would
				// expect
				objName = 'files';
				docTypeNum = '10009'; // FIXME: Confirm that this is the correct number for files
				break;
			default:
				console.warn(
					'This repository has not method to query for resource type "' + type + '"\n\
					available resources are "page", "image", and "file"'
				);
				callback(collection);
				return;
			};
			
			debug(
				'Will query REST-API with method:', restMethod,
				'\nWill look for results in object: ', objName,
				'\nWill create repo doc with docTypeNum: ', docTypeNum
			);
			
			$.ajax({
				url		 : restURL('folder/' + restMethod + '/' + folderId),
				data	 : params,
				dataType : 'json',
				type	 : 'GET',
				
				error : function (data) {
					that.handleRestResponse(data);
					callback(collection);
				},
				
				success	: function (data) {
					if (that.handleRestResponse(data)) {
						if (typeof collection !== 'object') {
							collection = [];
						}
						
						var objs = data[objName];
						
						for (var i = 0, j = objs.length; i < j; ++i) {
							objs[i] = that.getDocument(objs[i], docTypeNum);
							collection.push(objs[i]);
						}
					}
					
					callback(collection);
				}
			});
		};
		
		/**
		 * Searches a repository for items matching the given query.
		 * The results are passed as an array to the callback.
		 * If no objects are found the callback receives null.
		 *
		 * TODO: implement caching
		 *
		 * @param {object}	 query - query parameters.
		 *					 An example query parameters object could look something like this:
		 *						{
		 * 							filter		: ["language"],
		 * 							inFolderId	: 4,
		 * 							maxItems	: 10,
		 * 							objectTypeFilter
		 *										: ["website", "files"],
		 * 							orderBy		: null,
		 * 							queryString	: null,
		 * 							renditionFilter
		 *										: ["*"],
		 * 							skipCount	: 0
		 *						}
		 * @param {function} callback
		 * @return {undefined}
		 */
		Repo.query = function (query, callback) {
			var that = this,
				p = query;
			
			// FIXME: The GCN plugins will handle our REST-API session data
			// If we don't have a session id, get it, and then retry to invoke
			// this method
			if (!sid || sid == '') {
				var args = arguments;
				getSid(function () {
					that.query.apply(that, args);
				});
			} else {
				// FIXME:
				// check whether a magiclinkconstruct exists. If not, just do nothing, since setting GCN links is not supported
				//if (!GENTICS.Aloha.GCN.settings.magiclinkconstruct) {
				//	callback.call(that);
				//}
				
				var params = {
				// FIXME:
				//	links: GENTICS.Aloha.GCN.settings.links
				};
				
				params.search	 = p.queryString || undefined;
				params.maxItems	 = p.maxItems	 || undefined;
				params.skipCount = p.skipCount	 || undefined;
				
				if (p.inFolderId) {
					params.folderId = p.inFolderId;
					params.recursive = false;
				}
				
				// If objectTypeFilter has been specified, then only check for
				// resources of types found in objectTypeFilter array.
				// Otherwise try check all types of objects, and collect
				// everthing we can.
				var documentTypesToCollect;
				
				if (p.objectTypeFilter && p.objectTypeFilter.length) {
					documentTypesToCollect = [];
					
					if($.inArray('website', p.objectTypeFilter) > -1) {
						documentTypesToCollect.push('page');
					}
					
					if($.inArray('files', p.objectTypeFilter) > -1) {
						documentTypesToCollect.push('file');
					}
					
					if($.inArray('images', p.objectTypeFilter) > -1) {
						documentTypesToCollect.push('image');
					}
				} else {
					documentTypesToCollect = ['page', 'file', 'image'];
				}
				
				// Once all resources have been collected, we then call
				// processQueryResults, and pass to it the array of all repo
				// documents that we found, the original params object, and the
				// original callback expecting to receive the final processed
				// results
				var processResults = function (collection) {
					//debug('Collection to process: ', collection);
					that.processQueryResults(collection, query, callback);
				};
				
				var collection = [];
				
				// Recursively query for object types specified in
				// documentTypesToCollect. We pop documentTypesToCollect on
				// each iteration until documentTypesToCollect is empty
				var collectResults = function (collection) {
					var type = documentTypesToCollect.pop();
					
					that.getResources(
						type,
						p.inFolderId,
						params,
						collection,
						documentTypesToCollect.length ? collectResults : processResults
					);
				};
				
				collectResults(collection);
			}
		};
		
		/**
		 * Handles queryString, filter, and renditionFilter which the REST-API
		 * doesn't at the moment
		 */
		Repo.processQueryResults = function (documents, params, callback) {
			var skipCount = params.skipCount,
				l = documents.length,
				i = 0,
				num = 0,
				results = [],
				rgxp = new RegExp(params.queryString || '', 'i'),
				elem,
				obj;
			
			var hasQueryString = !!params.queryString,
			    hasFilter = !!params.filter,
			    hasRenditionFilter = false;
			
			if (params.renditionFilter && typeof params.renditionFilter === 'object') {
				hasRenditionFilter = params.renditionFilter.length > 0;
			}
			
			var contentSets = {};
			var contentsetDocs = {};
			
			for (; i < l; ++i) {
				elem = documents[i];
				
				// If there is a contentSet that matches the contentSetId of
				// the incoming document, then we will treat it like a
				// rendition and not like a seperate page of it's own
				if (!contentSets[elem.contentSetId] && (
						!hasQueryString ||
						(elem.name && elem.name.match(rgxp)) ||
						(elem.path && elem.path.match(rgxp))
					)) {
					if (skipCount) {
						--skipCount;
					} else {
						// If a filter is specified, then filter out all
						// unrequired properties from each object, and leave
						// only those specified in the filter array. If no
						// filter is specified, then we take all properties of
						// each document
						if (hasFilter) {
							// Copy all fields that returned objects must
							// contain, according to Repository specification
							obj = {
								id		 : elem.id,
								name	 : elem.name,
								baseType : 'document',
								// FIXME: elem.type seems to only return "document".
								// Could it be more specific?
								type	 : elem.type
							};
							
							// Copy all requested fields specified as items in
							// the filter array from the document into the
							// object to be returned
							for (var f = 0; f < params.filter.length; ++f) {
								obj[params.filter[f]] = elem[params.filter[f]];
							}
						} else {
							obj = elem;
						}
						
						if (elem.contentSetId) {
							if (!contentSets[elem.contentSetId]) {
								contentSets[elem.contentSetId] = [];
							}
							contentSets[elem.contentSetId].push(elem);
						}
						
						results[num++] = obj;
					}
				} else {
					// This document does not match the queryString, we may
					// nevertheless want to have it as a rendition of another
					// object, so keep a reference to it for later
					if (!contentsetDocs[elem.contentSetId]) {
						contentsetDocs[elem.contentSetId] = [];
					}
					contentsetDocs[elem.contentSetId].push(elem);
				}
			};
			
			// Build renditions from contentSet hash
			var renditions = {};
			$.each(contentSets, function (key, contentSet) {
				var setOfUnreturnedDocs = contentsetDocs[key];
				var set = setOfUnreturnedDocs
							? Array.prototype.concat(contentSet, setOfUnreturnedDocs)
							: contentSet;
				
				// We skip the first document because it will be the returned
				// result of which the other documents in the contentSet are
				// renditions of it
				for (var i = 1,
						 j = set.length,
						 members = [],
						 r;
						 
						 i < j;
						 
						 ++i) {
					r = set[i];
					
					members.push({
						id		 : r.id,	
						url		 : r.path + r.fileName,
						filename : r.fileName,
						kind	 : 'translation',
						language : r.language,
						mimeType : 'text/html',
						height	 : null,
						width	 : null
					});
				}
				
				// The key for this set of renditions is the id of the first
				// document in the contentSet to which these renditions belong
				renditions[this[0].id] = members;
			});
			
			var orderBy = this.buildSortPairs(params.orderBy);
			
			if (orderBy.length > 0) {
				// Sorts entries based on order of each column's importance as
				// defined by order of sortorder-sortby pairs.
				// This is according to the Repository specification.
				results.sort(function (a, b) {
					var i = 0,
						j = orderBy.length - 1,
						sort;
					
					for (; i <= j; ++i) {
						sort = orderBy[i];
						
						if (a[sort.by] == b[sort.by]) {
							if (i == j) {
								return 0;
							}
						} else {
							return (
								((sort.order == 'asc') ? 1 : -1)
									*
								((a[sort.by] < b[sort.by]) ? -1 : 1)
							);
						}
					}
				});
			}
			
			// Truncate results at maxItems
			if (typeof params.maxItems === 'number') {
				results = results.slice(0, params.maxItems);
			}
			
			if (hasRenditionFilter && (i = results.length) && renditions) {
				var renditionChecks = this.buildRenditionFilterChecks(params.renditionFilter),
					r;
				
				while (--i >= 0) {
					if (r = renditions[results[i].id]) {
						results[i].renditions =
							this.getRenditions(r, renditionChecks);
					} else {
						results[i].renditions = [];
					}
				}
			}
			
			debug('RESULTS: ', results);
			
			callback.call(this, results);
		};
		
		Repo.getRenditions = function (renditions, renditionChecks) {
			var matches = [],
			    alreadyMatched = [],
			    check,
				matched = false;
			
			for (var j = renditions.length - 1; j >= 0; --j) {
				for (var k = renditionChecks.length - 1; k >= 0; --k) {
					check = renditionChecks[k];
					
					if (check == '*') {
						matched = true;
					} else if (typeof check[1] === 'string') {
						matched = renditions[j][check[0]].toLowerCase() == check[1];
					} else {
						matched = renditions[j][check[0]].match(check[1]);
					}
					
					if (matched && $.inArray(j, alreadyMatched) == -1) {
						matches.push(renditions[j]);
						alreadyMatched.push(j);
					}
				}
			}
			
			return matches;
		};
		
		Repo.getChildren = function(params, callback) {
			var that = this;
			
			if (!sid || sid == '') {
				var args = arguments;
				
				getSid(function () {
					that.getChildren.apply(that, args);
				});
			} else {
				if (params.inFolderId == this.repositoryId) {
					params.inFolderId = 0;
				}
				
				$.ajax({
					url		 : restURL('folder/getFolders/' + params.inFolderId + '?recursive=true'),
					dataType : 'json',
					type	 : 'GET',
					error	 : function () {
						callback.call(that, []);
					},
					success	: function(data) {
						if (that.handleRestResponse(data)) {
							var folders = data.folders;
							for (var i = 0, j = folders.length; i < j; ++i) {
								folders[i] = that.getFolder(data.folders[i]);
							}
						}
						
						callback.call(that, folders);
					}
				});
			}
		};
		
		/**
		 * Get the repositoryItem with given id
		 * @param itemId {String} id of the repository item to fetch
		 * @param callback {function} callback function
		 * @return {GENTICS.Aloha.Repository.Object} item with given id
		 */
		Repo.getObjectById = function (itemId, callback) {
			var that = this;

			//if (itemId.match(/^10007./)) {
			if (itemId.match(/^10007\./)) {
				itemId = itemId.substr(6);
			}
			$.ajax ({
				url: restURL('page/load/' + itemId),
				type: 'GET',
				success: function(data) {
					if (data.page) {
						callback.call(that, [that.getDocument(data.page)]);
					}
				}
			});
		};
		
		Repo.handleRestResponse = function (response) {
			if (!response) {
				this.triggerError('No response data received');
				return false;
			}
			
			if (response.responseInfo && response.responseInfo.responseCode != 'OK') {
				var l,
					msg = [],
					msgs = response.messages;
				
				if (msgs && (l = msgs.length)) {
					while (--l >= 0) {
						msgs[l].message && msg.push(msgs[l].message);
					}
					
					msg = msg.join('\n');
				} else {
					msg = 'REST-API Error';
				}
				
				this.triggerError(msg);
				
				return false;
			}
			
			return true;
		};
		
		// FIXME:
		// Mini Browser not catching this trigger for some reason.
		Repo.triggerError = function (message) {
			var error = {
				repository : this,
				message	   : message
			};
			$('body').trigger('aloha-repository-error', error);
			console.warn(error);
		};
		
	};
	
	// FIXME:
	// This is obsolete with RequireJS.
	// Use require function instead.
	$(function () {
		$('body')
			.bind('aloha', initializeRepository)
			.bind('alohacoreloaded', createRepositories);
	});
	
})(window);
