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
define([
	'aloha',
	'jquery',
	'./iso639-1-de',
	'./iso639-2-de',
	'./iso639-1-en',
	'./iso639-2-en'
], function(
	Aloha,
	jQuery,
	iso1de,
	iso2de,
	iso1en,
	iso2en
) {
	'use strict';
	
	/**
	 * Keeps reference to the language codes and names.
	 */
	var ISO_MAP = {
		'iso639-1-de': iso1de,
		'iso639-2-de': iso2de,
		'iso639-1-en': iso1en,
		'iso639-2-en': iso2en
	};
	
	/**
	 * Path to the languages files.
	 */
	var PATH = Aloha.getAlohaUrl() + '/../plugins/shared/languages/';

	return Aloha.AbstractRepository.extend({
		
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
		 * Object type of the values for this repository.
		 */
		objectType: 'language',

		/**
		 * Whether to show flags or not
		 */
		flags: false,

		_constructor: function (name, flags, iso, locale, objectType) {
			this._super(name);

			if (typeof flags !== 'undefined') {
				this.flags = flags;
			}

			if (typeof iso !== 'undefined') {
				this.iso = ('iso639-1' === iso) ? 'iso639-1' : 'iso639-2';
			}

			if (typeof locale !== 'undefined') {
				this.locale = locale;
			}
			
			if (typeof objectType !== 'undefined') {
				this.objectType = objectType;
			}
			
			
			var data = ISO_MAP[this.iso + '-' + this.locale];
			
			this.storeLanguageCodes(data);
			this.languageData = data;
		},

		/**
		 * Initializes the repository: loads the language files and prepares the data.
		 */
		init: function () {
			
		},

		markObject: function (obj, item) {
			// Copied from wai-lang-plugin makeVisible to avoid a circular dependency
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
			var path = PATH + 'img/';
			// Transform loaded json into a set of repository documents
			jQuery.each(data, function (key, value) {
				var el = value;
				el.id = key;
				el.repositoryId = that.repositoryId;
				el.type = that.objectType;
				if (that.flags) {
					if (el.flag) {
						el.url = path + el.flag + '.png';
					} else {
						el.url = path + 'default.png';
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
			this._searchInLanguageCodes(p, callback);
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
	});
});
