/**
 * assert.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function Assert() {
	'use strict';

	function assertEqual(a, b, msg) {
		if (a !== b) {
			throw Error(msg || 'assertion error ' + a + ' !== ' + b);
		}
	}

	function assertNotEqual(a, b) {
		if (a === b) {
			throw Error(msg || 'assertion error ' + a + ' === ' + b);
		}
	}

	function assertFalse(value, msg) {
		assertEqual(value, false, msg);
	}

	function assertTrue(value, msg) {
		assertEqual(value, true, msg);
	}

	function assertError(msg) {
		throw Error(msg);
	}

	/**
	 * Generates an error message with a link to corresponding helpful resource
	 * on the Aloha Editor website.
	 *
	 * @param  {String} msg
	 * @return {String}
	 */
	function errorLink(msg) {
		return 'Error (' + msg + '). See http://www.aloha-editor.org/docs/errors/' + msg;
	}

	return {
		assertEqual    : assertEqual,
		assertNotEqual : assertNotEqual,
		assertFalse    : assertFalse,
		assertTrue     : assertTrue,
		assertError    : assertError,
		errorLink      : errorLink
	};
});
