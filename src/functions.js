/* functions.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function () {
	'use strict';

	/**
	 * The identity function returns its single argument.
	 * Useful for composition when some default behaviour is needed.
	 */
	function identity(arg) {
		return arg;
	}

	function noop() {
	}

	function returnTrue() {
		return true;
	}

	function returnFalse() {
		return false;
	}

	function complement(fn) {
		return function () {
			return !fn.apply(this, arguments);
		};
	}

	function bind(fn, thisArg) {
		var args = Array.prototype.slice.call(arguments, 2);
		return function () {
			return fn.apply(thisArg, args.concat(Array.prototype.slice.call(arguments, 0)));
		};
	}

	return {
		identity: identity,
		noop: noop,
		returnTrue: returnTrue,
		returnFalse: returnFalse,
		complement: complement,
		bind: bind
	};
});
