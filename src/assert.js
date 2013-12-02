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
