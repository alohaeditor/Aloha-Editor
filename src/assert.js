/**
 * assert.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function () {
	'use strict';

	/**
	 * Generates an error message with a link to corresponding helpful resource
	 * on the Aloha Editor website.
	 *
	 * @param  {string} type
	 * @return {string}
	 */
	function errorLink(type) {
		return '✘ Error (' + type + '). See http://www.aloha-editor.org/docs/errors/' + type;
	}

	var NOT_IMPLEMENTED = 0;
	var NOU             = 1;
	var NOT_NOU         = 2;
	var ASSERT_TYPE_NOU = 15;

	function error(type) {
		throw Error(type ? errorLink(type) : 'assertion failed');
	}

	function assert(cond, type) {
		// TODO all asserts must pass a type, which must be not-null,
		// otherwise it's too easy to have a typo when referencing the
		// assert type as in "Assert.NOu [sic]".
		//if (null == type) {
		//	error(ASSERT_TYPE_NOU);
		//}
		if (!cond) {
			error(type);
		}
	}

	function notImplemented() {
		error(NOT_IMPLEMENTED);
	}

	function assertNotNou(obj) {
		assert(null != obj, NOU);
	}

	function assertNou(obj) {
		assert(null == obj, NOT_NOU);
	}

	return {
		assert         : assert,
		error          : error,
		notImplemented : notImplemented,
		assertNou      : assertNou,
		assertNotNou   : assertNotNou,

		// Don't renumber to maintain well-known values for error
		// conditions.
		NOT_IMPLEMENTED              : NOT_IMPLEMENTED,
		NOU                          : NOU,
		NOT_NOU                      : NOT_NOU,

		// assert.js
		ASSERT_TYPE_NOU              : ASSERT_TYPE_NOU,

		// record.js
		READ_FROM_DISCARDED_TRANSIENT: 3,
		PERSISTENT_WRITE_TO_TRANSIENT: 4,
		TRANSIENT_WRITE_TO_PERSISTENT: 5,
		RECORD_WRONG_TYPE            : 16,

		// boromir.js
		STYLE_NOT_AS_ATTR            : 8,
		EXPECT_ELEMENT               : 9,
		EXPECT_TEXT_NODE             : 10,
		ELEMENT_NOT_ATTACHED         : 11,
		MISSING_SYMBOL               : 12,

		// accessors.js
		GETTER_AT_LEAST_1_ARG        : 13,
		SETTER_1_MORE_THAN_GETTER    : 14
	};
});
