define(['assert'], function (Assert) {
	'use strict';

	function ensureAccessorLength(get, set) {
		var getLen = get.length;
		var setLen = set.length;
		Assert.assert(getLen >= 1);
		Assert.assert(setLen >= 2);
		Assert.assert(getLen === setLen - 1);
		return getLen;
	}

	/**
	 * Creates an accessor from a getter and a setter.
	 *
	 * An accessor is a function that is composed of the getter and the
	 * setter, and which, if called with one more argument than the
	 * number of arguments acceptable by the getter function, calls the
	 * setter function, or otherwise calls the getter function.
	 *
	 * A getter must have at least one argument, the object something is
	 * being got from. The setter must have at least one more than the
	 * getter, which is presumably the value that is to be set.
	 *
	 * The getter and setter the accessor is composed of are available
	 * as the accessor.get and accessor.set properties of the accessor
	 * function. Using the getter and setter directly should only be
	 * done for optimizing accesses when it is really needed.
	 *
	 * The getter and setter function must not be wrapped by a function
	 * that doesn't have the proper number of arguments. Fn.partial()
	 * for example returns functions that have a length of 0, and we
	 * conciously reject such functions which reduces the potential of
	 * difficult to find errors.
	 *
	 * @param get {function}
	 * @param set {function}
	 * @return {!Accessor}
	 */
	function Accessor(get, set) {
		var getLen = ensureAccessorLength(get, set);
		// Optimize the common case of 1 === getLen
		var accessor = (1 === getLen) ? function (obj, value) {
			return (arguments.length > 1
			        ? set(obj, value)
			        : get(obj));
		} : function () {
			return (arguments.length - getLen > 0
			        ? set.apply(null, arguments)
			        : get.apply(null, arguments));
		};
		accessor.get = get;
		accessor.set = set;
		return accessor;
	}

	/**
	 * Creates a method accessor from an existing accessor.
	 *
	 * A method accessor is an acccessor where the accessor function
	 * takes one less argument than the acesssor function of a normal
	 * accessor, and which uses the `this` special variable in place of
	 * the missing argument to pass to the getter and setter.
	 */
	function asMethod(accessor) {
		var get = accessor.get;
		var set = accessor.set;
		var getLen = ensureAccessorLength(get, set);
		// Optimize the common case of 1 === getLen
		var method = (1 === getLen) ? function (value) {
			return (arguments.length
			        ? set(this, value)
			        : get(this));
		} : function (value) {
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift(this);
			return (arguments.length + 1 - getLen > 0
			        ? set.apply(null, args)
			        : get.apply(null, args));
		};
		method.get = get;
		method.set = set;
		return method;
	}

	/**
	 * Creates an accessor from a string.
	 */
	function fromString(key) {
		return Accessor(function (m) {
			return m[key];
		}, function (m, value) {
			m[key] = value;
			return m;
		});
	}

	/**
	 * Creates an accessor from a symbol.
	 */
	function fromSymbol(obj) {
		for (var symbol in obj) {
			if (obj.hasOwnProperty(symbol)) {
				return fromString(symbol);
			}
		}
		Assert.error();
	}

	Accessor.fromString = fromString;
	Accessor.fromSymbol = fromSymbol;
	Accessor.asMethod = asMethod;
	return Accessor;
});
