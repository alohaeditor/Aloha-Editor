define(['assert'], function (Assert) {
	'use strict';

	function Accessor(get, set) {
		function accessor(m, value) {
			return (arguments.length > 1
			        ? set(m, value)
			        : get(m));
		}
		accessor.get = get;
		accessor.set = set;
		return accessor;
	}

	function fromString(key) {
		return Accessor(function (m) {
			return m[key];
		}, function (m, value) {
			m[key] = value;
		});
	}

	function fromSymbol(obj) {
		for (var symbol in obj) {
			if (obj.hasOwnProperty(symbol)) {
				return fromString(symbol);
			}
		}
		Assert.error();
	}

	function asMethod(accessor) {
		var set = accessor.set;
		var get = accessor.get;
		var method = function (value) {
			return (arguments.length
			        ? set(this, value)
			        : get(this));
		};
		method.set = set;
		method.get = get;
		return method;
	}

	Accessor.fromString = fromString;
	Accessor.fromSymbol = fromSymbol;
	Accessor.asMethod = asMethod;
	return Accessor;
});
