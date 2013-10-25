/* functions.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function Functions() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('functions');
	}

	/**
	 * Returns its single argument.
	 * Useful for composition when some default behaviour is needed.
	 *
	 * @param {*} arg
	 * @return {*}
	 *         The given argument `arg`.
	 */
	function identity(arg) {
		return arg;
	}

	/**
	 * Does nothing.
	 * A noop function.
	 */
	function noop() {
	}

	/**
	 * Always returns `true`.
	 *
	 * @return {Boolean}
	 *         `true`
	 */
	function returnTrue() {
		return true;
	}

	/**
	 * Always returns `false`.
	 *
	 * @return {Boolean}
	 *         `false`
	 */
	function returnFalse() {
		return false;
	}

	/**
	 * Generates the complete function for `fn`.
	 * The complement function will return the opposite boolean result when
	 * called with the same arguments as the given `fn` function.
	 *
	 * @param {Function:Boolean} fn
	 * @return {Function:Boolean}
	 */
	function complement(fn) {
		return function () {
			return !fn.apply(this, arguments);
		};
	}

	/**
	 * Returns a function which will compute the value of calling `fn` with
	 * `thisArg` bound to the the `this` variable.
	 *
	 * @param {Function} fn
	 * @param {Object} thisArg
	 * @return {Function}
	 *         A function that, when invoked, will call `fn` with `thisArg` as
	 *         this, and return the return value.
	 */
	function bind(fn, thisArg) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function () {
			return fn.apply(thisArg, args.concat(
				Array.prototype.slice.call(arguments, 0)
			));
		};
	}

	/**
	 * Creates a bound variable and returns the closure which can be use to get
	 * and set the value of it as a free variable.
	 *
	 * This construct can be used to as a convenient way to simulate generic out
	 * parameters in JavaScript.
	 *
	 * Calling the closure with an argument changes the value of the enclosed
	 * variable.  Calling the closure without any arguments will return the
	 * value of the enclosed variable.
	 *
	 * @param {*} value
	 *        The initial value that the enclosed variable should hold.
	 * @return {Function(*):*}
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
	 * @return {boolean}
	 */
	function strictEquals(a, b) {
		return a === b;
	}

	/**
	 * Functions for working with functions.
	 *
	 * functions.identity()
	 * functions.noop()
	 * functions.returnTrue()
	 * functions.returnFalse()
	 * functions.complement()
	 * functions.bind()
	 * functions.outparameter()
	 */
	var exports =  {
		identity: identity,
		noop: noop,
		returnTrue: returnTrue,
		returnFalse: returnFalse,
		complement: complement,
		bind: bind,
		outparameter: outparameter,
		strictEquals: strictEquals
	};

	exports['identity'] = exports.identity;
	exports['noop'] = exports.noop;
	exports['returnTrue'] = exports.returnTrue;
	exports['returnFalse'] = exports.returnFalse;
	exports['complement'] = exports.complement;
	exports['bind'] = exports.bind;
	exports['outparameter'] = exports.outparameter;

	return exports;
});
