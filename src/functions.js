/**
 * functions.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * @namespace fn
 */
define([], function () {
	'use strict';

	/**
	 * Returns its single argument.
	 * Useful for composition when some default behaviour is needed.
	 *
	 * @param  {*} arg
	 * @return {*} The given argument `arg`.
	 * @memberOf fn
	 */
	function identity(arg) {
		return arg;
	}

	/**
	 * Does nothing.
	 * @memberOf fn
	 */
	function noop() {
	}

	/**
	 * Always returns `true`.
	 *
	 * @return {boolean}
	 * @memberOf fn
	 */
	function returnTrue() {
		return true;
	}

	/**
	 * Always returns `false`.
	 *
	 * @return {boolean}
	 * @memberOf fn
	 */
	function returnFalse() {
		return false;
	}

	/**
	 * Is null or undefined.
	 * @memberOf fn
	 */
	function isNou(obj) {
		return null == obj;
	}

	/**
	 * Generates the complement function for `fn`.
	 * The complement function will return the opposite boolean result when
	 * called with the same arguments as the given `fn` function.
	 *
	 * @param  {function():boolean} fn
	 * @return {function():boolean}
	 * @memberOf fn
	 */
	function complement(fn) {
		return function () {
			return !fn.apply(this, arguments);
		};
	}

	/**
	 * Like function.prototype.bind except without the `this` argument.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/function/bind
	 *
	 * Returns a function that concatenates the given arguments, and the
	 * arguments given to the returned function and calls the given
	 * function with it.
	 *
	 * The returned function will have a length of 0, not a length of
	 * fn.length - number of partially applied arguments. This is
	 * important consideration for any code that introspects the arity
	 * of the returned function. Function.prototype.bind() returns a
	 * function with the correct number of arguments but is not
	 * available across all browsers.
	 *
	 * @param  {function} fn
	 * @param  {Object} thisArg
	 * @return {function}
	 * @memberOf fn
	 */
	function partial(fn) {
		var args = Array.prototype.slice.call(arguments, 1);
		return function () {
			return fn.apply(null, args.concat(
				Array.prototype.slice.call(arguments, 0)
			));
		};
	}

	/**
	 * Compare the given arguments using the strict equals operator.
	 *
	 * Useful to pass as an arguments to other functions.
	 *
	 * @param a {*}
	 * @param b {*}
	 * @return  {boolean}
	 * @memberOf fn
	 */
	function strictEquals(a, b) {
		return a === b;
	}

	/**
	 * Composes the functions given as arguments.
	 *
	 * comp(a, b, c)(value) === a(b(c(value)))
	 *
	 * @param  {function(...number):...number}
	 * @return {*}
	 * @memberOf fn
	 */
	function comp() {
		var fns = arguments;
		var len = fns.length;
		return function () {
			var result;
			var i = len;
			if (i-- > 0) {
				result = fns[i].apply(this, arguments);
			}
			while (i-- > 0) {
				result = fns[i].call(this, result);
			}
			return result;
		};
	}

	/**
	 * Composes a predicate function made up of a chain of the given predicate
	 * arguments.
	 *
	 * @param  {function():...boolean}
	 * @return {function():boolean}
	 * @memberOf fn
	 */
	function and() {
		var predicates = arguments;
		var len = predicates.length;
		return function () {
			for (var i = 0; i < len; i++) {
				if (!predicates[i].apply(this, arguments)) {
					return false;
				}
			}
			return true;
		};
	}

	/**
	 * Like and() but for boolean OR.
	 *
	 * @param  {function(): ...boolean}
	 * @return {function(): boolean}
	 * @memberOf fn
	 */
	function or() {
		var predicates = arguments;
		var len = predicates.length;
		return function () {
			for (var i = 0; i < len; i++) {
				if (predicates[i].apply(this, arguments)) {
					return true;
				}
			}
			return false;
		};
	}

	/**
	 * Returns a function that constantly returns the given value.
	 * @memberOf fn
	 */
	function constantly(value) {
		return function () {
			return value;
		};
	}

	/**
	 * Returns true if the given value is a function.
	 * @memberOf fn
	 */
	function is(obj) {
		return 'function' === typeof obj;
	}

	/**
	 * Wraps a function and passes `this` as the first argument.
	 *
	 * The function that is wrapped is available on the returned method
	 * as the fn property, which allows one to easily switch between
	 * method and function invokation form.
	 *
	 * The Function.length property of the given function is examined
	 * and may be either 0, no matter how many arguments the function
	 * expects, or if not 0, must be the actual number of arguments the
	 * function expects.
	 * @memberOf fn
	 */
	function asMethod(fn) {
		var len = fn.length;
		// Optimize the common case of len <= 4
		var method = (1 === len) ? function () {
			return fn(this);
		} : (2 === len) ? function (arg1) {
			return fn(this, arg1);
		} : (3 === len) ? function (arg1, arg2) {
			return fn(this, arg1, arg2);
		} : (4 === len) ? function (arg1, arg2, arg3) {
			return fn(this, arg1, arg2, arg3);
		} : function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift(this);
			return fn.apply(null, args);
		};
		return method;
	}

	/**
	 * Adds functions to the given type's prototype.
	 *
	 * The functions will be converted to methods using Fn.asMethod().
	 *
	 * @param Type {!*}
	 * @param fnByName {Object.<string,function>}
	 * @memberOf fn
	 */
	function extendType(Type, fnByName) {
		for (var name in fnByName) {
			if (fnByName.hasOwnProperty(name)) {
				Type.prototype[name] = asMethod(fnByName[name]);
			}
		}
	}

	return {
		identity     : identity,
		noop         : noop,
		returnTrue   : returnTrue,
		returnFalse  : returnFalse,
		complement   : complement,
		partial      : partial,
		strictEquals : strictEquals,
		comp         : comp,
		and          : and,
		or           : or,
		constantly   : constantly,
		is           : is,
		isNou        : isNou,
		asMethod     : asMethod,
		extendType   : extendType
	};
});
