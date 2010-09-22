
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Resources object. Namespace for Resources
 * @hide
 */
if ( !GENTICS.Aloha.Resources ) GENTICS.Aloha.Resources = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Resources.delicious = new GENTICS.Aloha.Resource('com.gentics.aloha.resources.delicious');

/**
 * If no username if give, the public respoitory is searched:
 * @property
 * @cfg
 */
GENTICS.Aloha.Resources.delicious.settings.username = 'draftkraft';

/**
 * Defines the value to use for sorting the items. Allowed a values 0-0.75 
 * We choose a low default weight 0.35
 * @property
 * @default 0.35
 * @cfg
 */
GENTICS.Aloha.Resources.delicious.settings.weight = 0.35;



/**
 * init Delicious resource
 */
GENTICS.Aloha.Resources.delicious.init = function() {
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
		this.deliciousURL += 'tag/';
	}
};


/**
 * Searches a resource for resource items matching query if resourceObjectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Resources.delicious.query = function(searchText, resourceObjectTypes, callback) {
	var that = this;
	
	if ( jQuery.inArray('website', resourceObjectTypes) == -1) {
		
		// return if no website type is requested 
		callback.call( this, []);
		
	} else {
		
		// prepare tags
		var tags = [];
		if ( this.settings.username ) {

			// search in user tags
			var queryTags = searchText.split(' ');
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
			tags = searchText.split(' ');
			
		}

		jQuery.ajax({ type: "GET",
			dataType: "jsonp",
			url: that.deliciousURL + tags.join('+'),
			success: function(data) {
				var items = [];
				// convert data to resourceItems
				for (var i = 0; i < data.length; i++) {
					items.push({
						id: data[i].u,
						name: data[i].d,
						url: data[i].u,
						weight: that.settings.weight + (15-1)/100,
						resourceName: that.resourceName,
						resourceObjectType: 'website' 
					});
			    }
				callback.call( that, items);
			}
		});
	}
};

/**
 * Returns all tags for username in a tree style way
 */
GENTICS.Aloha.Resources.delicious.getNavigation = function(mother, resourceObjectTypes, filter, callback) {
	var that = this;
	
	// tags are only available when a username is available
	if ( this.settings.username ) {
		
		// return all tags
		var items = [];
		if ( !mother || mother.id == this.resourceName ) {

			for (var i = 0; i < this.tags.length; i++) {
				items.push({
					id: this.tags[i],
					name: this.tags[i],
					url: 'http://feeds.delicious.com/v2/rss/tags/'+that.settings.username+'/'+this.tags[i],
					resourceName: this.resourceName,
					resourceObjectType: 'tag' 
				});
		    }
			callback.call( this, items);
		
		} else {
			jQuery.ajax({ type: "GET",
				dataType: "jsonp",
				url: 'http://feeds.delicious.com/v2/json/tags/'+that.settings.username+'/'+mother.id,
				success: function(data) {
					var items = [];
					// convert data
					for (var tag in data) {
						// the id is tag[+tag+...+tag]
						var id = (mother)?mother.id + '+' + tag:tag;
						items.push({
							id: id,
							name: tag,
							hasMoreItems: true,
							url: 'http://feeds.delicious.com/v2/rss/tags/'+that.settings.username+'/'+id,
							resourceName: that.resourceName,
							resourceObjectType: 'tag' 
						});
				    }
					callback.call( that, items);
				}
			});
			
		}
	} else {
		callback.call( this, []);;
	}
};
