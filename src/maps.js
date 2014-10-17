/**
 * maps.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace maps
 */
define(['arrays', 'assert'], function (Arrays, Assert) {
	'use strict';

	/**
	 * Checks whether the given object has no own or inherited properties.
	 *
	 * @param {!Object} obj
	 *        Object to check.
	 * @return {boolean}
	 *         True if the object is empty. eg: isEmpty({}) == true
	 * @memberOf maps
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
	 * @param {Array.<string>} keys
	 *        An array of string keys. JavaScript maps can only contain string
	 *        keys, so these must be strings or they will be cast to string.
	 * @param {string} value A single value that each given key will map to.
	 * @return {Object}
	 *         The given map.
	 * @memberOf maps
	 */
	function fillKeys(map, keys, value) {
		var i = keys.length;
		while (i--) {
			map[keys[i]] = value;
		}
		return map;
	}

	/**
	 * For each mapping, calls `cb(value, key, m)`.
	 *
	 * Like ECMAScript edition 5 Array.forEach but for Maps.
	 *
	 * Contrary to "for (key in m)" iterates only over the "hasOwnProperty"
	 * properties of the m, which is usually what you want.
	 * @memberOf maps
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
	 * @param {*} _default used in place of non-existing properties
	 * @return {!Array}
	 * @memberOf maps
	 */
	function selectVals(m, ks, _default) {
		return ks.map(function (k) {
			return m.hasOwnProperty(k) ? m[k] : _default;
		});
	}

	/**
	 * Same as Array.filter except for maps.
	 *
	 * The given predicate is applied to each entry in the given map,
	 * and only if the predicate returns true, will the entry appear in
	 * the result.
	 * @memberOf maps
	 */
	function filter(m, pred) {
		var result = {};
		forEach(m, function (val, key) {
			if (pred(val, key, m)) {
				result[key] = val;
			}
		});
		return result;
	}

	/**
	 * Returns an array of the map's keys.
	 *
	 * @param {!Object} m
	 * @return {!Array} The set of keys in `m`.
	 * @memberOf maps
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
	 * @memberOf maps
	 */
	function vals(m) {
		return selectVals(m, keys(m));
	}
	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf maps
	 */
	function extend(dest) {
		var i;
		for (i = 1; i < arguments.length; i++) {
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
	 * @memberOf maps
	 */
	function merge() {
		return extend.apply(null, [{}].concat(Arrays.coerce(arguments)));
	}

	/**
	 * Clones a map.
	 *
	 * @param map {!Object}
	 * @return {!Object}
	 * @memberOf maps
	 */
	function clone(map) {
		Assert.assertNotNou(map);
		return extend({}, map);
	}

	/**
	 * Sets a value on a clone of the given map and returns the clone.
	 *
	 * @param map {!Object}
	 * @param key {string}
	 * @param value {*}
	 * @return {!Object}
	 * @memberOf maps
	 */
	function cloneSet(map, key, value) {
		map = clone(map);
		map[key] = value;
		return map;
	}

	/**
	 * Deletes a key from a clone of the given map and returns the clone.
	 *
	 * @param map {!Object}
	 * @param key {string}
	 * @return {!Object}
	 * @memberOf maps
	 */
	function cloneDelete(map, key) {
		map = clone(map);
		delete map[key];
		return map;
	}

	/**
	 * Whether the given object is a map that can be operated on by
	 * other functions in this module.
	 *
	 * We exclude things like new String("..."), new Number(...),
	 * document.createElement(...), but include new MyType("...").
	 * @memberOf maps
	 */
	function isMap(obj) {
		return !!(obj
		          // On IE7 DOM Nodes are [object Object] but don't have a constructor
		          && obj.constructor
		          && Object.prototype.toString.call(obj) === '[object Object]');
	}

	/**
	 * Creates a map without inheriting from Object.
	 *
	 * Use this instead of an object literal to avoid having unwanted,
	 * inherited properties on the map.
	 *
	 * A map constructed like this allows for the
	 * ```for (var key in map) { }```
	 * pattern to be used without a hasOwnProperty check.
	 *
	 * @return {!Object}
	 * @memberOf maps
	 */
	function create() {
		return Object.create(null);
	}

	/**
	 * Converts a list of tuples into a hash map key-value pair.
	 *
	 * @param  {Array.<Array.<string, *>>} tuples
	 * @return {Object.<string, *>}
	 * @memberOf maps
	 */
	function mapTuples(tuples) {
		var map = {};
		tuples.forEach(function (tuple) {
			map[tuple[0]] = tuple[1];
		});
		return map;
	}

	return {
		isEmpty     : isEmpty,
		fillKeys    : fillKeys,
		keys        : keys,
		vals        : vals,
		selectVals  : selectVals,
		filter      : filter,
		forEach     : forEach,
		extend      : extend,
		merge       : merge,
		isMap       : isMap,
		clone       : clone,
		cloneSet    : cloneSet,
		cloneDelete : cloneDelete,
		create      : create,
		mapTuples   : mapTuples
	};
});
