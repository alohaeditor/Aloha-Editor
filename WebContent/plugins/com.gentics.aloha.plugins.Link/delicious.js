
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Repositories object. Namespace for Repositories
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Repositories.delicious = new GENTICS.Aloha.Repository('com.gentics.aloha.repositories.delicious');

/**
 * If no username is given, the public respoitory is searched:
 * @property
 * @cfg
 */
GENTICS.Aloha.Repositories.delicious.settings.username = 'draftkraft';

/**
 * Defines the value to use for sorting the items. Allowed a values 0-0.75 
 * We choose a low default weight 0.35
 * @property
 * @default 0.35
 * @cfg
 */
GENTICS.Aloha.Repositories.delicious.settings.weight = 0.35;



/**
 * init Delicious repository
 */
GENTICS.Aloha.Repositories.delicious.init = function() {
	var that = this;
	
	// check weight 
	if ( this.settings.weight + 0.15 > 1 ) {
		this.settings.weight = 1 - 0.15;
	}
	
	// default delicious URL. Returns most popular links.
	this.deliciousURL = "http://feeds.delicious.com/v2/json/";
	
	if ( this.settings.username ) {
		
		// if a username is set use public user links
		this.deliciousURL += this.settings.username + '/';
	
		// set the repository name
		this.repositoryName = 'deliciuos/' + this.settings.username;
		
		// when a user is specified get his tags and store it local
		this.tags = [];
		
		jQuery.ajax({ type: "GET",
			dataType: "jsonp",
			url: 'http://feeds.delicious.com/v2/json/tags/'+that.settings.username,
			success: function(data) {
				// convert data
				for (var tag in data) {
					that.tags.push(tag);
				}
			}
		});
	} else {
		// set the repository name
		this.repositoryName = 'deliciuos/' + popular;

		this.deliciousURL += 'tag/';
	}
};


/**
 * Searches a repository for items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.delicious.query = function(queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var that = this;
	
	if ( objectTypeFilter && jQuery.inArray('website', objectTypeFilter) == -1) {
		
		// return if no website type is requested 
		callback.call( this, []);
		
	} else {
		
		// prepare tags
		var tags = [];
		if ( this.settings.username ) {

			// search in user tags
			var queryTags = queryString ? queryString.split(' ') : [];
		    for (var i = 0; i < queryTags.length; i++) {
				var queryTag = queryTags[i].trim();
				if ( jQuery.inArray(queryTag, that.tags) == -1 ) {
					var newtags = that.tags.filter(function(e, i, a) {
						var r = new RegExp(queryTag, 'i'); 
						return ( e.match(r) );
					});
					if ( newtags.length > 0 ) {
						tags.push(newtags[0]);
					}
				} else {
					tags.push(queryTag);
				}
			}
			
		} else {
			
			// handle each word as tag
			tags = queryString.split(' ');
			
		}

		// search in tree
		var folderTags = inFolderId ? inFolderId.split('+') : [];
		jQuery.extend(tags, folderTags);

		// if we have a query and no tag matching return 
		if ( queryString && tags.length == 0 ) {
			callback.call( that, []);
			return;
		}
		
		jQuery.ajax({ type: "GET",
			dataType: "jsonp",
			url: that.deliciousURL + tags.join('+'),
			success: function(data) {
				var items = [];
				// convert data to Aloha objects
				for (var i = 0; i < data.length; i++) {
					if (typeof data[i] != 'function' ) {
						items.push({
							id: data[i].u,
							displayName: data[i].d,
							repositoryId: that.repositoryId,
							objectType: 'website', 
							url: data[i].u,
							weight: that.settings.weight + (15-1)/100
						});
					}
			    }
				callback.call( that, items);
			}
		});
	}
};

/**
 * Returns all tags for username in a tree style way
 */
GENTICS.Aloha.Repositories.delicious.getChildren = function(objectTypeFilter, filter, inFolderId, inTreeId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var that = this;
	
	// tags are only available when a username is available
	if ( this.settings.username ) {
		
		// return all tags
		var items = [];
		if ( inFolderId == this.repositoryId ) {

			for (var i = 0; i < this.tags.length; i++) {
				if (typeof this.tags[i] != 'function' ) {
					items.push({
						id: this.tags[i],
						displayName: this.tags[i],
						repositoryId: this.repositoryId,
						objectType: 'tag', 
						url: 'http://feeds.delicious.com/v2/rss/tags/'+that.settings.username+'/'+this.tags[i]
					});
				}
		    }
			callback.call( this, items);
		
		} else {
			jQuery.ajax({ type: "GET",
				dataType: "jsonp",
				url: 'http://feeds.delicious.com/v2/json/tags/'+that.settings.username+'/'+inFolderId,
				success: function(data) {
					var items = [];
					// convert data
					for (var tag in data) {
						// the id is tag[+tag+...+tag]
						var id = (inFolderId)?inFolderId + '+' + tag:tag;
						if (typeof data[tag] != 'function' ) {
							items.push({
								id: id,
								displayName: tag,
								repositoryId: that.repositoryId,
								objectType: 'tag', 
								url: 'http://feeds.delicious.com/v2/rss/tags/'+that.settings.username+'/'+id,
								hasMoreItems: true
							});
						}
					}
					callback.call( that, items);
				}
			});
			
		}
	} else {
		callback.call( this, []);;
	}
};
