/* maps.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */

/**
 * @doc module
 * @name maps
 * @description
 *
 * ## Maps Utilities
 *
 * This module houses utilities that are
 * used to work with maps (plain old objects).
 *
 */

define([], function Maps() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('maps');
	}

	/**
	 * @doc function
	 * @name aloha.maps:isEmpty
	 * @description
	 *
	 * Checks whether the given object has no own or inherited properties.
	 *
	 * @param {!Object} obj
	 *        Object to check.
	 * @return {boolean}
	 *         True if the object is empty. eg: isEmpty({}) == true
	 */
	function isEmpty(obj) {
		var name;
		for (name in obj) {
			if (obj.hasOwnProperty(name)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * @doc function
	 * @name aloha.maps:fillKeys
	 * @description
	 *
	 * Fills the given map with the given keys mapped to the given value.
	 *
	 * @param {Object} map
	 *        The given map will have one entry added for each given key.
	 * @param {Array[String]} keys
	 *        An array of string keys. JavaScript maps can only contain string
	 *        keys, so these must be strings or they will be cast to string.
	 * @param {String} value
	 *        A single value that each given key will map to.
	 * @return {Object}
	 *         The given map.
	 */
	function fillKeys(map, keys, value) {
		var i = keys.length;
		while (i--) {
			map[keys[i]] = value;
		}
		return map;
	}

	/**
	 * @doc function
	 * @name aloha.maps:fillTuples
	 * @description
	 *
	 * Fills the given map with entries from the given tuples.
	 *
	 * @param {Object} map
	 *        The given map will have one entry added for each item in the given
	 *        array.
	 * @param {Array[Array[String, *]]} tuples
	 *        An array of [key, value] tuples. Javascript maps can only contain
	 *        string keys, so the keys must be strings or or they will be cast
	 *        to string.
	 * @return {Object}
	 *         The given map.
	 */
	function fillTuples(map, tuples) {
		var i = tuples.length,
			tuple;
		while (i--) {
			tuple = tuples[i];
			map[tuple[0]] = tuple[1];
		}
		return map;
	}

	/**
	 * @doc function
	 * @name aloha.maps:keys
	 * @description
	 *
	 * Returns an array of the map's keys.
	 *
	 * @param {Object} map given map
	 * @return {Array}
	 *         The set of keys in `map`.
	 */
	function keys(map) {
		var ks = [],
			k;
		for (k in map) {
			if (map.hasOwnProperty(k)) {
				ks.push(k);
			}
		}
		return ks;
	}

	/**
	 * @doc function
	 * @name aloha.maps:forEach
	 * @description
	 *
	 * For each mapping, calls `cb(value, key, map)`.
	 *
	 * Emulates ECMAScript edition 5 Array.forEach.
	 *
	 * Contrary to "for (key in map)" iterates only over the "hasOwnProperty"
	 * properties of the map, which is usually what you want.
	 */
	function forEach(map, cb) {
		var key;
		for (key in map) {
			if (map.hasOwnProperty(key)) {
				cb(map[key], key, map);
			}
		}
	}

	/**
	 * @doc function
	 * @name aloha.maps:merge
	 * @description
	 *
	 * Merges one or more maps.
	 * Merging happens from left to right, which is useful for example
	 * when merging a number of given options with default options:
	 * var effectiveOptions = Maps.merge(defaults, options);
	 *
	 * @param {...Object}
	 *        A variable number of map objects.
	 * @return {Object}
	 *         A merge of all given maps in a single object.
	 */
	function merge() {
		var dest = {};
		var i;
		for (i = 0; i < arguments.length; i++) {
			var src = arguments[i];
			var key;
			for (key in src) {
				if (src.hasOwnProperty(key)) {
					dest[key] = src[key];
				}
			}
		}
		return dest;
	}

	/**
	 * Functions to work with maps (plain old objects).
	 *
	 * maps.isEmpty()
	 * maps.fillTuples()
	 * maps.fillKeys()
	 * maps.keys()
	 * maps.forEach()
	 * maps.merge()
	 */
	var exports = {
		isEmpty: isEmpty,
		fillTuples: fillTuples,
		fillKeys: fillKeys,
		keys: keys,
		forEach: forEach,
		merge: merge
	};

	exports['isEmpty'] = exports.isEmpty;
	exports['fillTuples'] = exports.fillTuples;
	exports['fillKeys'] = exports.fillKeys;
	exports['keys'] = exports.keys;
	exports['forEach'] = exports.forEach;
	exports['merge'] = exports.merge;

	return exports;
});
