/**
 * assert.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function Assert() {
	'use strict';

	// @deprecated
	function assertEqual(a, b, msg) {
		if (a !== b) {
			throw Error(msg || 'assertion error ' + a + ' !== ' + b);
		}
	}

	// @deprecated
	function assertNotEqual(a, b) {
		if (a === b) {
			throw Error(msg || 'assertion error ' + a + ' === ' + b);
		}
	}

	// @deprecated
	function assertFalse(value, msg) {
		assertEqual(value, false, msg);
	}

	// @deprecated
	function assertTrue(value, msg) {
		assertEqual(value, true, msg);
	}

	// @deprecated
	function assertError(msg) {
		throw Error(msg);
	}

	/**
	 * Generates an error message with a link to corresponding helpful resource
	 * on the Aloha Editor website.
	 *
	 * @param  {String} type
	 * @return {String}
	 */
	function errorLink(type) {
		return 'Error (' + type + '). See http://www.aloha-editor.org/docs/errors/' + type;
	}

	function error(type) {
		throw Error(type ? errorLink(type) : 'assertion failed');
	}

	function assert(cond, type) {
		if (!cond) {
			error(type);
		}
	}

	function assertNotNou(obj) {
		assert(null != obj, 'null-or-undefined');
	}

	function assertNou(obj) {
		assert(null == obj, 'not-null-or-undefined');
	}

	return {
		assertEqual    : assertEqual,
		assertNotEqual : assertNotEqual,
		assertFalse    : assertFalse,
		assertTrue     : assertTrue,
		assertError    : assertError,
		errorLink      : errorLink,
		assert         : assert,
		assertNou      : assertNou,
		assertNotNou   : assertNotNou,
		error          : error
	};
});
