define([], function Assert() {
	'use strict';

	function assertEqual(a, b) {
		if (a !== b) {
			throw new Error('assertion error ' + a + ' !== ' + b);
		}
	}

	function assertNotEqual(a, b) {
		if (a === b) {
			throw new Error('assertion error ' + a + ' === ' + b);
		}
	}

	function assertFalse(value) {
		assertEqual(value, false);
	}

	function assertTrue(value) {
		assertEqual(value, true);
	}

	function assertError() {
		throw new Error();
	}

	return {
		assertEqual: assertEqual,
		assertNotEqual: assertNotEqual,
		assertFalse: assertFalse,
		assertTrue: assertTrue,
		assertError: assertError
	};
});
