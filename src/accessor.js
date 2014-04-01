define(['functions', 'assert'], function (Fn, Assert) {
	'use strict';

	function ensureAccessorLength(get, set) {
		var getLen = get.length;
		var setLen = set.length;
		Assert.assert(getLen >= 1, Assert.GETTER_AT_LEAST_1_ARG);
		Assert.assert(setLen >= 2, Assert.SETTER_1_MORE_THAN_GETTER);
		Assert.assert(getLen === setLen - 1, Assert.SETTER_1_MORE_THAN_GETTER);
		return getLen;
	}

	function accessorFn(get, set, getLen) {
		return function () {
			return (arguments.length - getLen > 0
			        ? set.apply(null, arguments)
			        : get.apply(null, arguments));
		};
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
	 * being gotten from. The setter must have at least one more
	 * argument than the getter, which is presumably the value that is
	 * to be set.
	 *
	 * The getter and setter the accessor is composed of are available
	 * as the accessor.get and accessor.set properties on the accessor
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
		// Optimize the common case of getLen <= 2
		var accessor = (1 === getLen) ? function (obj, value) {
			return (arguments.length > 1
			        ? set(obj, value)
			        : get(obj));
		} : (2 === getLen) ? function (obj, arg, value) {
			return (arguments.length > 2
			        ? set(obj, arg, value)
			        : get(obj, arg));
		} : accessorFn(get, set, getLen);
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
		// Optimize the common case of getLen <= 2
		var method = (1 === getLen) ? function (value) {
			return (arguments.length
			        ? set(this, value)
			        : get(this));
		} : (2 === getLen) ? function (arg, value) {
			return (arguments.length > 1
			        ? set(this, arg, value)
			        : get(this, arg));
		} : Fn.asMethod(accessorFn(get, set, getLen));
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
		Assert.error(Assert.MISSING_SYMBOL);
	}

	Accessor.fromString = fromString;
	Accessor.fromSymbol = fromSymbol;
	Accessor.asMethod = asMethod;
	return Accessor;
});
