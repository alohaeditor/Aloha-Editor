define(['functions', 'maps', 'assert'], function (Fn, Maps, Assert) {
	'use strict';

	var REALIZED_NONE = 0;
	var REALIZED_KEYS = 1;
	var REALIZED_KEYS_VALUES = 2;
	var NOT_REALIZED_PLACEHOLDER = {};
	var NOT_PRESENT_PLACEHOLDER = {};
	var DATA_DEFAULT = {};
	var SPECIAL_PRIVATE_VALUE = {};

	function DelayedMap(opts, source, specialPrivateValue) {
		if (specialPrivateValue !== SPECIAL_PRIVATE_VALUE) {
			return new DelayedMap(opts, source, SPECIAL_PRIVATE_VALUE);
		}
		this._map_data = {};
		this._map_source = source;
		this._map_opts = opts;
		this._map_realized = REALIZED_NONE;
	}

	function realize(map) {
		var data = map._map_data;
		var realized = map._map_realized;
		if (realized & REALIZED_KEYS_VALUES) {
			return data;
		}
		var opts = map._map_opts;
		data = opts.realize(map._map_source);
		map._map_data = data;
		map._map_realized = realized | REALIZED_KEYS | REALIZED_KEYS_VALUES;
		return data;
	}

	function isRealized(map) {
		return map._map_realized & REALIZED_KEYS_VALUES;
	}

	function keys(map) {
		var data = map._map_data;
		var realized = map._map_realized;
		if (realized & REALIZED_KEYS) {
			return Maps.keys(data).filter(function (key) {
				return data[key] !== NOT_PRESENT_PLACEHOLDER;
			});
		}
		var opts = map._map_opts;
		var keys;
		if (opts.keys) {
			keys = opts.keys(map._map_source);
			keys.forEach(function (key) {
				if (!data.hasOwnProperty(key)) {
					data[key] = NOT_REALIZED_PLACEHOLDER;
				}
			});
			map._map_realized = realized | REALIZED_KEYS;
		} else {
			keys = Maps.keys(realize(map));
		}
		return keys;
	}

	function getCached(map, name, getFn) {
		var data = map._map_data;
		if (data.hasOwnProperty(name)) {
			return data[name];
		} else if (map._map_realized & REALIZED_KEYS) {
			return NOT_PRESENT_PLACEHOLDER;
		}
		var value = data[name] = getFn(map, name);
		return value;
	}

	function getPresence(map, name) {
		var opts = map._map_opts;
		var has = false;
		if (opts.has) {
			has = opts.has(map._map_source, name);
		} else {
			has = (-1 !== keys(map).indexOf(name));
		}
		return has ? NOT_REALIZED_PLACEHOLDER : NOT_PRESENT_PLACEHOLDER;
	}

	function getValue(map, name) {
		var opts = map._map_opts;
		return opts.get(map._map_source, name, NOT_PRESENT_PLACEHOLDER);
	}

	function has(map, name) {
		return NOT_PRESENT_PLACEHOLDER !== getCached(map, name, getPresence);
	}

	function get(map, name, default_) {
		var value = getCached(map, name, getValue);
		if (NOT_PRESENT_PLACEHOLDER === value) {
			value = default_;
		} else if (NOT_REALIZED_PLACEHOLDER === value) {
			value = map._map_data[name] = getValue(map, name);
			Assert.asserT(value !== NOT_PRESENT_PLACEHOLDER);
		}
		return value;
	}

	Fn.extendType(DelayedMap, {
		keys: keys,
		realize: realize,
		isRealized: isRealized,
		get: get,
		has: has,
		set: Assert.notImplemented,
		setT: Assert.notImplemented,
		delay: Assert.notImplemented,
		delayT: Assert.notImplemented,
		remove: Assert.notImplemented
	});

	return DelayedMap;
});
