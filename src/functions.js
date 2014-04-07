/**
 * functions.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], /** @exports Functions */ function Functions() {
	'use strict';

	/**
	 * Returns its single argument.
	 * Useful for composition when some default behaviour is needed.
	 *
	 * @param  {*} arg
	 * @return {*} The given argument `arg`.
	 */
	function identity(arg) {
		return arg;
	}

	/**
	 * Does nothing.
	 */
	function noop() {
	}

	/**
	 * Always returns `true`.
	 *
	 * @return {boolean}
	 */
	function returnTrue() {
		return true;
	}

	/**
	 * Always returns `false`.
	 *
	 * @return {boolean}
	 */
	function returnFalse() {
		return false;
	}

	/**
	 * Is null or undefined.
	 */
	function isNou(obj) {
		return null == obj;
	}

	/**
	 * Generates the complement function for `fn`.
	 * The complement function will return the opposite boolean result when
	 * called with the same arguments as the given `fn` function.
	 *
	 * @param  {function:boolean} fn
	 * @return {function:boolean}
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
	 * Creates a bound variable and returns the closure which can be use to get
	 * and set the value of it as a free variable.
	 *
	 * This construct can be used as a convenient way to simulate
	 * generic out parameters in JavaScript.
	 *
	 * Calling the closure with an argument changes the value of the enclosed
	 * variable.  Calling the closure without any arguments will return the
	 * value of the enclosed variable.
	 *
	 * @param {*} value The initial value that the enclosed variable should hold.
	 * @return {function(*):*}
	 */
	function outparameter(value) {
		var variable = value;
		return function OutParameter() {
			if (arguments.length) {
				variable = arguments[0];
			}
			return variable;
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
	 */
	function strictEquals(a, b) {
		return a === b;
	}

	/**
	 * Composes the functions given as arguments.
	 *
	 * comp(a, b, c)(value) === a(b(c(value)))
	 *
	 * @param  {function(*):*...}
	 * @return {*}
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

	function and() {
		var fns = arguments;
		var len = fns.length;

		return function () {
			for (var i = 0; i < len; i++) {
				if (!(fns[i].apply(this, arguments))) {
					return false;
				}
			}
			return true;
		};
	}

	/**
	 * Returns a function that constantly returns the given value.
	 */
	function constantly(value) {
		return function () {
			return value;
		};
	}

	/**
	 * Returns true if the given value is a function.
	 */
	function is(obj) {
		return 'function' === typeof obj;
	}

	/**
	 * Wraps a function and passes `this` as the first argument.
	 */
	function asMethod(fn) {
		return function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift(this);
			return fn.apply(null, args);
		};
	}

	/**
	 * Like Fn.asMethod(), but for a function of only a single argument.
	 *
	 * Useful as an optimization because the presence of the special
	 * `arguments` variable makes an approximately 30x difference in IE10.
	 */
	function asMethod1(fn) {
		return function (arg) {
			return fn(this, arg);
		};
	}

	return {
		identity     : identity,
		noop         : noop,
		returnTrue   : returnTrue,
		returnFalse  : returnFalse,
		complement   : complement,
		partial      : partial,
		outparameter : outparameter,
		strictEquals : strictEquals,
		comp         : comp,
		and          : and,
		constantly   : constantly,
		is: is,
		isNou: isNou,
		asMethod: asMethod,
		asMethod1: asMethod1
	};
});
