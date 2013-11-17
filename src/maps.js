/* maps.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['arrays'], function Maps(Arrays) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('maps');
	}

	/**
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
	 * Fills the given map with entries from the given tuples.
	 *
	 * @param {Object} map
	 *        The given map will have one entry added for each item in the given
	 *        array.
	 * @param {Array[Array[String, *]]}tuples
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
	 * For each mapping, calls `cb(value, key, m)`.
	 *
	 * Emulates ECMAScript edition 5 Array.forEach.
	 *
	 * Contrary to "for (key in m)" iterates only over the "hasOwnProperty"
	 * properties of the m, which is usually what you want.
	 */
	function forEach(m, cb) {
		var key;
		for (key in m) {
			if (m.hasOwnProperty(key)) {
				cb(m[key], key, m);
			}
		}
	}

	/**
	 * Selects the values for the given keys in the given map.
	 *
	 * @param {!Object} m
	 * @param {!Array} ks
	 * @return {!Array}
	 */
	function selectVals(m, ks) {
		return ks.map(function (k) {
			return m[k];
		});
	}

	/**
	 * Returns an array of the map's keys.
	 *
	 * @param {!Object} m
	 * @return {!Array} The set of keys in `m`.
	 */
	function keys(m) {
		var ks = [];
		forEach(m, function (value, key) {
			ks.push(key);
		});
		return ks;
	}

	/**
	 * Returns an array of the map's values.
	 *
	 * @param {!Object} m
	 * @return {!Array} The values in `m`.
	 */
	function vals(m) {
		return selectVals(m, keys(m));
	}

	function extend(dest) {
		var i;
		for (i = 0; i < arguments.length; i++) {
			var src = arguments[i];
			if (src) {
				forEach(src, function (value, key) {
					dest[key] = value;
				});
			}
		}
		return dest;
	}

	/**
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
		return extend.apply(null, [{}].concat(Arrays.coerce(arguments)));
	}

	/**
	 * Whether the given object is a map that can be operated on by
	 * other functions in this module.
	 *
	 * We exclude things like new String("..."), new Number(...),
	 * document.createElement(...), but include new MyType("...").
	 */
	function isMap(obj) {
		return !!(obj
		          // On IE7 DOM Nodes are [object Object] but don't have a constructor
		          && obj.constructor
		          && Object.prototype.toString.call(obj) === '[object Object]');
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
		vals: vals,
		selectVals: selectVals,
		forEach: forEach,
		extend: extend,
		merge: merge,
		isMap: isMap
	};

	exports['isEmpty'] = exports.isEmpty;
	exports['fillTuples'] = exports.fillTuples;
	exports['fillKeys'] = exports.fillKeys;
	exports['keys'] = exports.keys;
	exports['vals'] = exports.vals;
	exports['forEach'] = exports.forEach;
	exports['extend'] = exports.extend;
	exports['merge'] = exports.merge;
	exports['isMap'] = exports.isMap;

	return exports;
});
