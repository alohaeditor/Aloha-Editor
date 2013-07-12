/* functions.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function FunctionUtilities() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Ranges');
	}

	/**
	 * Returns its single argument.
	 * Useful for composition when some default behaviour is needed.
	 *
	 * @param {*} arg
	 * @return {*}
	 *         The single given argument `arg`.
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
	 * Functions for working with functions.
	 *
	 * API:
	 *
	 * identity()
	 * noop()
	 * returnTrue()
	 * returnFalse()
	 * complement()
	 * bind()
	 */
	var exports =  {
		identity: identity,
		noop: noop,
		returnTrue: returnTrue,
		returnFalse: returnFalse,
		complement: complement,
		bind: bind
	};

	return exports;
});
