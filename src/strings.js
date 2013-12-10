/**
 * strings.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function Strings() {
	'use strict';

	/**
	 * Splits a string into individual words.
	 *
	 * Words are non-empty sequences of non-space characaters.
	 *
	 * @param {String} str
	 * @return {Array[String]}
	 *         List of words found in the given string.
	 */
	var words = (function () {
		var spaces = /\s+/;
		return function words(str) {
			var list = str.split(spaces);
			// "  x  ".split(/\s+/) => ["", "x", ""] (Chrome)
			// "".split(/\s+/) => [""] (Chrome)
			if (list.length && list[0] === '') {
				list.shift();
			}
			if (list.length && list[list.length - 1] === '') {
				list.pop();
			}
			return list;
		};
	}());

	/**
	 * Converts a dashes form into camel cased form.
	 *
	 * For example 'data-my-attr' becomes 'dataMyAttr'.
	 *
	 * @param {string} str
	 *        Should be all lowercase and should not begin with a dash.
	 */
	var dashesToCamelCase = (function () {
		var dashPrefixedCharacter = /[\-]([a-z])/gi;
		var raiseCase = function (all, upper) {
			return upper.toUpperCase();
		};
		return function dashesToCamelCase(str) {
			return str.replace(dashPrefixedCharacter, raiseCase);
		};
	}());

	/**
	 * Converts a camel cased form into dashes form.
	 *
	 * For example
	 * 'dataMyAttr' becomes 'data-my-attr',
	 * 'dataAB'     becomes 'data-a-b'.
	 *
	 * @param {string} str
	 *        Should begin with a lowercase letter and should not contain dashes.
	 */
	var camelCaseToDashes = (function () {
		var uppercaseCharacter = /[A-Z]/g;
		var addDashes = function (match) {
			return '-' + match.toLowerCase();
		};
		return function camelCaseToDashes(str) {
			return str.replace(uppercaseCharacter, addDashes);
		};
	}());

	/**
	 * Split `str` along `pattern`, including matches in the result.
	 *
	 * splitIncl("foo-bar", /\-/g) results in ["foo", "-", "bar"]
	 *
	 * whereas
	 *
	 * "foo-bar".split(/\-/g) results in ["foo", "bar"]
	 *
	 * @param {RegExp} pattern
	 *        Must include the g flag, otherwise will result in an endless loop.
	 * @return {Array[String]}
	 *         A list of substrings of `str` in the order they appeared in the
	 *         given string.
	 */
	function splitIncl(str, pattern) {
		var result = [];
		var lastIndex = 0;
		var match;
		while (null != (match = pattern.exec(str))) {
			if (lastIndex < match.index) {
				result.push(str.substring(lastIndex, match.index));
				lastIndex = match.index;
			}
			lastIndex += match[0].length;
			result.push(match[0]);
		}
		if (lastIndex < str.length) {
			result.push(str.substring(lastIndex, str.length));
		}
		return result;
	}

	/**
	 * Returns true for the empty string, null and undefined.
	 *
	 * @param {String=} str
	 * @return {Boolean}
	 */
	function empty(str) {
		return '' === str || null == str;
	}

	/**
	 * Returns true if the given character is a control character. Control
	 * characters are usually not rendered if they are inserted into the DOM.
	 * Returns false for whitespace 0x20 (which may or may not be rendered see
	 * Html.isUnrenderedWhitespace()) and non-breaking whitespace 0xa0 but returns
	 * true for tab 0x09 and linebreak 0x0a and 0x0d.
	 *
	 * @param {String} chr
	 * @return {Boolean}
	 */
	function isControlCharacter(chr) {
		// Regex matches C0 and C1 control codes, which seems to be good enough.
		// "The C0 set defines codes in the range 00HEX–1FHEX and the C1
		// set defines codes in the range 80HEX–9FHEX."
		// In addition, we include \x007f which is "delete", which just
		// seems like a good idea.
		// http://en.wikipedia.org/wiki/List_of_Unicode_characters
		// http://en.wikipedia.org/wiki/C0_and_C1_control_codes
		return (/[\x00-\x1f\x7f-\x9f]/).test(chr);
	}

	return {
		words              : words,
		dashesToCamelCase  : dashesToCamelCase,
		camelCaseToDashes  : camelCaseToDashes,
		splitIncl          : splitIncl,
		empty              : empty,
		isControlCharacter : isControlCharacter
	};
});
