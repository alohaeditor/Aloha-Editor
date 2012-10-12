/*global define: true, require: true */
/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 *
 * Language Repository
 * -------------------
 * Provides a set of language codes and images
 */
define(['aloha', 'jquery', 'flag-icons/flag-icons-plugin', 'aloha/console', 'wai-lang/wai-lang-plugin'],
function(Aloha, jQuery, FlagIcons, console) {
	'use strict';
	
	/**
	 * global Deferred Object
	 */
	var deferred = jQuery.Deferred();

	return new (Aloha.AbstractRepository.extend({

		/**
		 * Set of language codes
		 */
		languageCodes: [],
		
		/**
		 * Set default locale
		 */
		locale: 'de',
		
		/**
		 * Set default iso
		 */
		iso: 'iso639-1',

		/**
		 * Whether to show flags or not
		 */
		flags: false,

		_constructor: function () {
			this._super('wai-languages');
		},

		/**
		 * Initialize WAI Languages, load the language file and prepare the data.
		 */
		init: function () {
			
			var that = this;
			var waiLang = Aloha.require('wai-lang/wai-lang-plugin');
			var locale = Aloha.settings.locale;
			var iso = waiLang.iso639;

			if (locale !== 'de') {
				this.locale = 'en';
			}

			if (iso !== 'iso639-1') {
				this.iso = 'iso639-2';
			}

			this.flags = waiLang.flags;

			this.repositoryName = 'WaiLanguages';
			
			Aloha.require(['wai-lang/' + this.iso + '-' + this.locale], function (data) {
				that.storeLanguageCodes(data);
				deferred.resolve();
			});
			
		},

		markObject: function (obj, item) {
			//copied from wai-lang-plugin makeVisible to avoid a circular dependency
			// We do not need to add this class here since it already being
			// done in the wai-lang plugin
			// jQuery( obj ).addClass( 'aloha-wai-lang' );
		},

		/**
		 * This method will invoked if a error occurres while loading data via ajax
		 */
		errorHandler: function (text, error) {
			console.log("error", this, "Error while loading languages. " + text);
		},

		/**
		 * Stores the retrieved language code data in this object
		 */
		storeLanguageCodes: function (data) {
			var that = this;
			var waiLangPath = Aloha.getPluginUrl('wai-lang');

			// Transform loaded json into a set of repository documents
			jQuery.each(data, function (key, value) {
				var el = value;
				el.id = key;
				el.repositoryId = that.repositoryId;
				el.type = 'language';
				if (that.flags) {
					if (el.flag) {
						el.url =  FlagIcons.path + '/img/flags/' + el.flag + '.png';
					} else {
						el.url =  waiLangPath + '/img/button.png';
					}
				}
				// el.renditions.url = "img/flags/" + e.id + ".png";
				// el.renditions.kind.thumbnail = true;
				that.languageCodes.push(new Aloha.RepositoryDocument(el));
			});
		},
		
		/**
		 * Searches a repository for object items matching query if objectTypeFilter.
		 * If none found it returns null.
		 * Not supported: filter, orderBy, maxItems, skipcount, renditionFilter
		 */
		_searchInLanguageCodes: function (p, callback) {
			var query = new RegExp('^' + p.queryString, 'i'),
		    i,
		    d = [],
		    matchesName,
		    matchesType,
		    currentElement;

			for (i = 0; i < this.languageCodes.length; ++i) {
				currentElement = this.languageCodes[i];
				matchesName = (!p.queryString || currentElement.name.match(query));
				matchesType = (!p.objectTypeFilter || (!p.objectTypeFilter.length) || jQuery.inArray(currentElement.type, p.objectTypeFilter) > -1);
	
				if (matchesName && matchesType) {
					d.push(currentElement);
				}
			}
	
			callback.call(this, d);
		},

		/**
		 * Fetches the languageCodes if they are not already loaded and
		 * searches the collection with the given query.
		 */
		query: function (p, callback) {
			var that = this;
			
			deferred.done(function(){
				that._searchInLanguageCodes(p, callback);
			});
			
		},

		/**
		 * Get the repositoryItem with given id
		 * @param itemId {String} id of the repository item to fetch
		 * @param callback {function} callback function
		 * @return {Aloha.Repository.Object} item with given id
		 */
		getObjectById: function (itemId, callback) {
			var i, currentElement;

			for (i = 0; i < this.languageCodes.length; ++i) {
				currentElement = this.languageCodes[i];
				if (currentElement.id === itemId) {
					callback.call(this, [currentElement]);
					break;
				}
			}

		}
	}))();
});
