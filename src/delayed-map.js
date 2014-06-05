define(['functions', 'maps', 'assert'], function (Fn, Maps, Assert) {
	'use strict';

	var REALIZED_NONE = 0;
	var REALIZED_KEYS = 1;
	var REALIZED_KEYS_VALUES = 2;
	var NOT_REALIZED_PLACEHOLDER = {};
	var NOT_PRESENT_PLACEHOLDER = {};
	var SPECIAL_PRIVATE_VALUE = {};

	/**
	 * Constructs a new DelayedMap.
	 *
	 * `opts` is a map or an object implementing how the delayed map is
	 * realized. It has the following methods:
	 *
	 *     {
	 *         realize: function (source) { ... return realizedMap; },
	 *         get: function (source, name, default_) {
	 *             ...
	 *             return hasName ? valueForName : default_;
	 *         },
	 *         has: function (source, name) { ... return hasName; },
	 *         keys: function (source) { ... return keysArray; }
	 *     }
	 *
	 * Only realize and get are required.
	 *
	 * `source` is an optional argument that is passed as the first
	 * argument to the given functions. If it is not supplied, undefined
	 * is passed instead.
	 *
	 * This function must not be invoked with the new keyword, it must
	 * instead be used as a function.
	 *
	 * @param opts {!Object.<string,function>}
	 * @param source {*}
	 * @return {!DelayedMap}
	 */
	function DelayedMap(opts, source, _specialPrivateValue) {
		if (_specialPrivateValue !== SPECIAL_PRIVATE_VALUE) {
			return new DelayedMap(opts, source, SPECIAL_PRIVATE_VALUE);
		}
		this._map_data = null;
		this._map_source = source;
		this._map_opts = opts;
		this._map_realized = REALIZED_NONE;
	}

	/**
	 * Internal implementation to get cached data from the given map,
	 * allocating a new map if necessary.
	 */
	function ensureData(map) {
		var data = map._map_data = map._map_data || {};
		return data;
	}

	/**
	 * Realizes the given map.
	 *
	 * Will call the realize() implementation the given delayed map was
	 * constructed with, and cache its return value.
	 *
	 * @param map {!DelayedMap}
	 * @return {!Object.<string, *>}
	 */
	function realize(map) {
		var realized = map._map_realized;
		if (realized & REALIZED_KEYS_VALUES) {
			return map._map_data;
		}
		var opts = map._map_opts;
		var data = opts.realize(map._map_source);
		map._map_data = data;
		map._map_realized = realized | REALIZED_KEYS | REALIZED_KEYS_VALUES;
		// Allow memory reclamation
		map._map_source = null;
		return data;
	}

	/**
	 * Returns true if the given delayed map is realized.
	 *
	 * @param map {!DelayedMap}
	 * @return {boolean}
	 */
	function isRealized(map) {
		return !!(map._map_realized & REALIZED_KEYS_VALUES);
	}

	/**
	 * Gets the keys from the a delayed map.
	 *
	 * Will realize the map if it was constructed without an
	 * implementation for keys().
	 *
	 * @param map {!DelayedMap}
	 * @return {Array.<string>}
	 */
	function keys(map) {
		var data = ensureData(map);
		var realized = map._map_realized;
		if (realized & REALIZED_KEYS) {
			return Maps.keys(data).filter(function (key) {
				return data[key] !== NOT_PRESENT_PLACEHOLDER;
			});
		}
		var opts = map._map_opts;
		var optsKeys;
		if (opts.keys) {
			optsKeys = opts.keys(map._map_source);
			optsKeys.forEach(function (key) {
				if (!data.hasOwnProperty(key)) {
					data[key] = NOT_REALIZED_PLACEHOLDER;
				}
			});
			map._map_realized = realized | REALIZED_KEYS;
		} else {
			optsKeys = Maps.keys(realize(map));
		}
		return optsKeys;
	}

	/**
	 * Internal implementation that uses the given getFn to get the real
	 * value or a presence value from the given map, first checking
	 * whether the real or presence value is available without invoking
	 * getFn.
	 */
	function getCached(map, name, getFn) {
		var data = ensureData(map);
		if (data.hasOwnProperty(name)) {
			return data[name];
		} else if (map._map_realized & REALIZED_KEYS) {
			return NOT_PRESENT_PLACEHOLDER;
		}
		var value = data[name] = getFn(map, name);
		return value;
	}

	/**
	 * Internal implementation that gets the presence value
	 * (NOT_REALIZED_PLACEHOLDER or NOT_PRESENT_PLACEHOLDER) from the
	 * given map.
	 */
	function getPresence(map, name) {
		var opts = map._map_opts;
		var has = false;
		if (opts.has) {
			has = opts.has(map._map_source, name);
		} else {
			// TODO use opts.keys first and only try getCached if there
			// is no opts.keys to avoid realizing values unless
			// absolutely necessary.
			has = NOT_PRESENT_PLACEHOLDER !== getCached(map, name, getValue);
		}
		return has ? NOT_REALIZED_PLACEHOLDER : NOT_PRESENT_PLACEHOLDER;
	}

	/**
	 * Internal implementation that gets a value from the given delayed
	 * map.
	 */
	function getValue(map, name) {
		var opts = map._map_opts;
		return opts.get(map._map_source, name, NOT_PRESENT_PLACEHOLDER);
	}

	/**
	 * Returns true if the given delayed map has a key with the given
	 * name.
	 *
	 * If the key for the given name has not yet been fetched from the
	 * delayed map's source, it will be fetched, possibly realizing the
	 * value as well if the delayed map was constructed without an
	 * implementation for has(). 
	 *
	 * @param map {!DelayedMap}
	 * @param name {string}
	 * @return {boolean}
	 */
	function has(map, name) {
		return NOT_PRESENT_PLACEHOLDER !== getCached(map, name, getPresence);
	}

	/**
	 * Gets a value form a delayed map.
	 *
	 * If there is no key that matches the given name, will return
	 * the optional default_ value instead.
	 *
	 * If the value for the given name has not yet been realized from
	 * the delayed map's source, it will be realized and cached for
	 * subsequent gets.
	 *
	 * @param map {!DelayedMap}
	 * @param name {string}
	 * @param default_ {*}
	 * @return {*}
	 */
	function get(map, name, default_) {
		var value = getCached(map, name, getValue);
		if (NOT_PRESENT_PLACEHOLDER === value) {
			value = default_;
		} else if (NOT_REALIZED_PLACEHOLDER === value) {
			var data = ensureData(map);
			value = data[name] = getValue(map, name);
			Assert.asserT(value !== NOT_PRESENT_PLACEHOLDER);
		}
		return value;
	}

	/**
	 * Internal implementation of DelayedMap options for a literal map.
	 */
	var realizedFromMapOpts = {
		realize: Fn.identity,
		get: Assert.error // not called if the map is realized
	};

	/**
	 * Returns a new DelayedMap backed by a javascript object.
	 *
	 * Since the source of the map is a non-delayed javascript object,
	 * the delayed map itself will be realized from the beginning.
	 *
	 * @param literalMap {!Object} any javascript object
	 * @return {!DelayedMap}
	 */
	function realized(literalMap) {
		var map = DelayedMap(realizedFromMapOpts, literalMap);
		map.realize();
		return map;
	}

	/**
	 * The options passed to the DelayedMap constructor ask for a getter
	 * function that accepts a default value. Most of the time, a getter
	 * will simply return null to indicate there was no value, and don't
	 * accept a given default value. This function can be used to turn
	 * the given getFn into a getter function that accepts a default
	 * that will be returned instad of the given getFn's return value
	 * whenever that value tests true with the given useDefaultFn
	 * predicate.
	 *
	 * For example
	 *
	 *    DelayedMap({
	 *        get: DelayedMap.makeGetWithDefault(myGet, Fn.isNou),
	 *        realize: ...
	 *    }, ...);
	 *
	 * @param getFn {function} accepts two arguments and returns a value
	 * @param useDefaultFn {function} used to test values returned by getFn
	 * @return {function} a composition of the given functions
	 */
	function makeGetWithDefault(getFn, useDefaultFn) {
		return function (source, name, default_) {
			var value = getFn(source, name);
			return useDefaultFn(value) ? default_ : value;
		};
	}

	/**
	 * Internal implementation of DelayedMap options for merging two
	 * DelayedMaps.
	 */
	var mergeOpts = {
		realize: function (mergeSource) {
			return Maps.merge(mergeSource.map.realize(),
			                  mergeSource.obj);
		},
		get: function (mergeSource, name, default_) {
			var map = mergeSource.map;
			var obj = mergeSource.obj;
			if (obj.hasOwnProperty(name)) {
				return obj[name];
			}
			return map.get(name, default_);
		}
	};

	/**
	 * Merges an object into a delayed map.
	 *
	 * Performs the same merging logic as in Maps.merge(), but does so
	 * lazily by keeping references to the passed map and object.
	 *
	 * If longLived is true, and if map is the result of a previous
	 * merge and is not yet realized, will do a non-lazy merge of the
	 * last merge's obj and this merge's obj. This helps prevent a
	 * memory leak from occuring when merges happen a lot over time.
	 *
	 * @param map {!DelayedMap}
	 * @param obj {!Object}
	 * @param longLived {?boolean}
	 * @return {!DelayedMap}
	 */
	function mergeObject(map, obj, longLived) {
		if (longLived
		    && map._map_opts === mergeOpts
		    && !(map._map_realized & REALIZED_KEYS_VALUES)) {
			obj = Maps.merge(map._map_source.obj, obj);
			map = map._map_source.map;
		}
		return DelayedMap(mergeOpts, {map: map, obj: obj});
	}

	Fn.extendType(DelayedMap, {
		keys: keys,
		realize: realize,
		isRealized: isRealized,
		get: get,
		has: has,
		mergeObject: mergeObject
	});

	DelayedMap.realized = realized;
	DelayedMap.makeGetWithDefault = makeGetWithDefault;

	return DelayedMap;
});
