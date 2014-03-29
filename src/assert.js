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

	function notImplemented() {
		error(0);
	}

	function assertNotNou(obj) {
		assert(null != obj, 1);
	}

	function assertNou(obj) {
		assert(null == obj, 2);
	}

	return {
		assertEqual    : assertEqual,
		assertNotEqual : assertNotEqual,
		assertFalse    : assertFalse,
		assertTrue     : assertTrue,
		assertError    : assertError,
		errorLink      : errorLink,
		assert         : assert,
		error          : error,
		assertNou      : assertNou,
		assertNotNou   : assertNotNou,
		// Don't renumber to maintain well-known values for error
		// conditions.
		READ_FROM_DISCARDED_TRANSIENT: 3,
		PERSISTENT_WRITE_TO_TRANSIENT: 4,
		TRANSIENT_WRITE_TO_PERSISTENT: 5,
		ONLY_ONE_OF_SET_OR_SETT      : 6,
		STYLE_NOT_AS_ATTR            : 8,
		EXPECT_ELEMENT               : 9,
		EXPECT_TEXT_NODE             : 10,
		ELEMENT_NOT_ATTACHED         : 11
	};
});
