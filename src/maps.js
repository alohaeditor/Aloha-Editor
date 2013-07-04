/* maps.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function MapsUtilities() {
	'use strict';

	/**
	 * Checks whether the given object has no own or inherited properties.
	 *
	 * @param {!Object} obj The object to check.
	 * @return {boolean} True if the object is empty. eg: isEmpty({}) == true
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
	 * Fill the given map with the given keys mapped to the given value.
	 *
	 * @param map
	 *        The given map will have one entry added for each given key.
	 * @param keys
	 *        An array of string keys. Javascript maps can only
	 *        contain string keys, so these must be strings or
	 *        or they will be cast to string.
	 * @param value
	 *        A single value that each given key will map to.
	 * @return
	 *        The given map.
	 */
	function fillKeys(map, keys, value) {
		var i = keys.length;
		while (i--) {
			map[keys[i]] = value;
		}
		return map;
	}

	/**
	 * Fill the given map with entries from the given tuples.
	 *
	 * @param map
	 *        The given map will have one entry added for each item in
	 *        the given array.
	 * @param tuples
	 *        An array of [key, value] tuples. Javascript maps can only
	 *        contain string keys, so the keys must be strings or
	 *        or they will be cast to string.
	 * @return
	 *        The given map.
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
	 * Returns an array of the map's keys.
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
	 * For each mapping, call cb(value, key, map).
	 *
	 * Emulates ECMAScript edition 5 Array.forEach.
	 *
	 * Contrary to "for (key in map)" iterates only over the
	 * "hasOwnProperty" properties of the map, which is usually what you
	 * want.
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
	 * Merges one or more maps.
	 * Merging happens from left to right, which is useful for example
	 * when merging a number of given options with default options:
	 * var effectiveOptions = Maps.merge(defaults, options);
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

	return {
		isEmpty: isEmpty,
		fillTuples: fillTuples,
		fillKeys: fillKeys,
		keys: keys,
		forEach: forEach,
		merge: merge
	};
});
