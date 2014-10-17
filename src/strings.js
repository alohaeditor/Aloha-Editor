/**
 * strings.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Reference:
 * http://www.w3.org/TR/html401/struct/text.html
 * @namespace strings
 */
define(['arrays'], function (Arrays) {
	'use strict';

	/**
	 * Unicode zero width space characters:
	 * http://www.unicode.org/Public/UNIDATA/Scripts.txt
	 *
	 * @type {Array.<string>}
	 * @memberOf strings
	 */
	var ZERO_WIDTH_CHARACTERS = [
		'\\u200B', // ZWSP
		'\\u200C',
		'\\u200D',
		'\\uFEFF'  // ZERO WIDTH NO-BREAK SPACE
	];

	/**
	 * Unicode non-breaking space characters as defined in the W3 HTML5
	 * specification:
	 * http://www.w3.org/TR/html5/infrastructure.html#common-parser-idioms
	 *
	 * @type {Array.<string>}
	 * @memberOf strings
	 */
	var NON_BREAKING_SPACE_CHARACTERS = [
		'\\u00A0', // NON BREAKING SPACE ("&nbsp;")
		'\\u202F'  // NARROW NON BREAKING SPACE
	];

	/**
	 * Unicode White_Space characters are those that have the Unicode property
	 * "White_Space" in the Unicode PropList.txt data file.
	 *
	 * http://www.unicode.org/Public/UNIDATA/PropList.txt
	 *
	 * @type {Array.<string>}
	 * @memberOf strings
	 */
	var WHITE_SPACE_CHARACTERS = [
		'\\u0009',
		'\\u000A',
		'\\u000B',
		'\\u000C',
		'\\u000D',
		'\\u0020',
		'\\u0085',
		'\\u00A0',
		'\\u1680',
		'\\u180E',
		'\\u2000',
		'\\u2001',
		'\\u2002',
		'\\u2003',
		'\\u2004',
		'\\u2005',
		'\\u2006',
		'\\u2007',
		'\\u2008',
		'\\u2009',
		'\\u200A',
		'\\u2028',
		'\\u2029',
		'\\u202F',
		'\\u205F',
		'\\u3000'
	];

	/**
	 * Characters that delimit boundaries of words.
	 *
	 * These include whitespaces, hyphens, and punctuation.
	 *
	 * @type {Array.<string>}
	 * @memberOf strings
	 */
	var WORD_BREAKING_CHARACTERS = [
		'\u0041-', '\u005A', '\u0061-', '\u007A', '\u00AA', '\u00B5', '\u00BA',
		'\u00C0-', '\u00D6', '\u00D8-', '\u00F6', '\u00F8-',

		'\u02C1',  '\u02C6-', '\u02D1', '\u02E0-', '\u02E4', '\u02EC', '\u02EE',
		'\u0370-', '\u0374',  '\u0376', '\u0377',  '\u037A-', '\u037D',
		'\u0386',  '\u0388-', '\u038A', '\u038C',  '\u038E-', '\u03A1',
		'\u03A3-', '\u03F5', '\u03F7-', '\u0481', '\u048A-', '\u0525',
		'\u0531-', '\u0556', '\u0559', '\u0561-', '\u0587', '\u05D0-', '\u05EA',
		'\u05F0-', '\u05F2', '\u0621-', '\u064A', '\u066E', '\u066F', '\u0671-',
		'\u06D3', '\u06D5', '\u06E5', '\u06E6', '\u06EE', '\u06EF', '\u06FA-',
		'\u06FC', '\u06FF', '\u0710', '\u0712-', '\u072F', '\u074D-', '\u07A5',
		'\u07B1', '\u07CA-', '\u07EA', '\u07F4', '\u07F5', '\u07FA', '\u0800-',
		'\u0815', '\u081A', '\u0824', '\u0828', '\u0904-', '\u0939', '\u093D',
		'\u0950', '\u0958-', '\u0961', '\u0971', '\u0972', '\u0979-', '\u097F',
		'\u0985-', '\u098C', '\u098F', '\u0990', '\u0993-', '\u09A8', '\u09AA-',
		'\u09B0', '\u09B2', '\u09B6-', '\u09B9', '\u09BD', '\u09CE', '\u09DC',
		'\u09DD', '\u09DF-', '\u09E1', '\u09F0', '\u09F1',

		'\u0A05-', '\u0A0A', '\u0A0F', '\u0A10', '\u0A13-', '\u0A28', '\u0A2A-',
		'\u0A30', '\u0A32', '\u0A33', '\u0A35', '\u0A36', '\u0A38', '\u0A39',
		'\u0A59-', '\u0A5C', '\u0A5E', '\u0A72-', '\u0A74', '\u0A85-', '\u0A8D',
		'\u0A8F-', '\u0A91', '\u0A93-', '\u0AA8', '\u0AAA-', '\u0AB0', '\u0AB2',
		'\u0AB3', '\u0AB5-', '\u0AB9', '\u0ABD', '\u0AD0', '\u0AE0', '\u0AE1',

		'\u0B05-', '\u0B0C', '\u0B0F', '\u0B10', '\u0B13-', '\u0B28', '\u0B2A-',
		'\u0B30', '\u0B32', '\u0B33', '\u0B35-', '\u0B39', '\u0B3D', '\u0B5C',
		'\u0B5D', '\u0B5F-', '\u0B61', '\u0B71', '\u0B83', '\u0B85-', '\u0B8A',
		'\u0B8E-', '\u0B90', '\u0B92-', '\u0B95', '\u0B99', '\u0B9A', '\u0B9C',
		'\u0B9E', '\u0B9F', '\u0BA3', '\u0BA4', '\u0BA8-', '\u0BAA', '\u0BAE-',
		'\u0BB9', '\u0BD0',

		'\u0C05-', '\u0C0C', '\u0C0E-', '\u0C10', '\u0C12-', '\u0C28',
		'\u0C2A-', '\u0C33', '\u0C35-', '\u0C39', '\u0C3D', '\u0C58', '\u0C59',
		'\u0C60', '\u0C61', '\u0C85-', '\u0C8C', '\u0C8E-', '\u0C90', '\u0C92-',
		'\u0CA8', '\u0CAA-', '\u0CB3', '\u0CB5-', '\u0CB9', '\u0CBD', '\u0CDE',
		'\u0CE0', '\u0CE1',

		'\u0D05-', '\u0D0C', '\u0D0E-', '\u0D10', '\u0D12-', '\u0D28',
		'\u0D2A-', '\u0D39', '\u0D3D', '\u0D60', '\u0D61', '\u0D7A-', '\u0D7F',
		'\u0D85-', '\u0D96', '\u0D9A-', '\u0DB1', '\u0DB3-', '\u0DBB', '\u0DBD',
		'\u0DC0-', '\u0DC6',

		'\u0E01-', '\u0E30', '\u0E32', '\u0E33', '\u0E40-', '\u0E46', '\u0E81',
		'\u0E82', '\u0E84', '\u0E87', '\u0E88', '\u0E8A', '\u0E8D', '\u0E94-',
		'\u0E97', '\u0E99-', '\u0E9F', '\u0EA1-', '\u0EA3', '\u0EA5', '\u0EA7',
		'\u0EAA', '\u0EAB', '\u0EAD-', '\u0EB0', '\u0EB2', '\u0EB3', '\u0EBD',
		'\u0EC0-', '\u0EC4', '\u0EC6', '\u0EDC', '\u0EDD',

		'\u0F00', '\u0F40-', '\u0F47', '\u0F49-', '\u0F6C', '\u0F88-', '\u0F8B',

		'\u1000-', '\u102A', '\u103F', '\u1050-', '\u1055', '\u105A-', '\u105D',
		'\u1061', '\u1065', '\u1066', '\u106E-', '\u1070', '\u1075-', '\u1081',
		'\u108E', '\u10A0-', '\u10C5', '\u10D0-', '\u10FA', '\u10FC',

		'\u1100-', '\u1248', '\u124A-', '\u124D', '\u1250-', '\u1256', '\u1258',
		'\u125A-', '\u125D', '\u1260-', '\u1288', '\u128A-', '\u128D',
		'\u1290-', '\u12B0', '\u12B2-', '\u12B5', '\u12B8-', '\u12BE', '\u12C0',
		'\u12C2-', '\u12C5', '\u12C8-', '\u12D6', '\u12D8-', '\u1310',
		'\u1312-', '\u1315', '\u1318-', '\u135A', '\u1380-', '\u138F',
		'\u13A0-', '\u13F4', '\u1401-', '\u166C', '\u166F-', '\u167F',
		'\u1681-', '\u169A', '\u16A0-', '\u16EA', '\u1700-', '\u170C',
		'\u170E-', '\u1711', '\u1720-', '\u1731', '\u1740-', '\u1751',
		'\u1760-', '\u176C', '\u176E-', '\u1770', '\u1780-', '\u17B3', '\u17D7',
		'\u17DC', '\u1820-', '\u1877', '\u1880-', '\u18A8', '\u18AA', '\u18B0-',
		'\u18F5', '\u1900-', '\u191C', '\u1950-', '\u196D', '\u1970-', '\u1974',
		'\u1980-', '\u19AB', '\u19C1-', '\u19C7',

		'\u1A00-', '\u1A16', '\u1A20-', '\u1A54', '\u1AA7', '\u1B05-', '\u1B33',
		'\u1B45-', '\u1B4B', '\u1B83-', '\u1BA0', '\u1BAE', '\u1BAF', '\u1C00-',
		'\u1C23', '\u1C4D-', '\u1C4F', '\u1C5A-', '\u1C7D', '\u1CE9-', '\u1CEC',
		'\u1CEE-', '\u1CF1', '\u1D00-', '\u1DBF', '\u1E00-', '\u1F15',
		'\u1F18-', '\u1F1D', '\u1F20-', '\u1F45', '\u1F48-', '\u1F4D',
		'\u1F50-', '\u1F57', '\u1F59', '\u1F5B', '\u1F5D', '\u1F5F-', '\u1F7D',
		'\u1F80-', '\u1FB4', '\u1FB6-', '\u1FBC', '\u1FBE', '\u1FC2-', '\u1FC4',
		'\u1FC6-', '\u1FCC', '\u1FD0-', '\u1FD3', '\u1FD6-', '\u1FDB',
		'\u1FE0-', '\u1FEC', '\u1FF2-', '\u1FF4', '\u1FF6-', '\u1FFC',

		'\u2071', '\u207F', '\u2090-', '\u2094', '\u2102', '\u2107', '\u210A-',
		'\u2113', '\u2115', '\u2119-', '\u211D', '\u2124', '\u2126', '\u2128',
		'\u212A-', '\u212D', '\u212F-', '\u2139', '\u213C-', '\u213F',
		'\u2145-', '\u2149', '\u214E', '\u2183', '\u2184', '\u2C00-', '\u2C2E',
		'\u2C30-', '\u2C5E', '\u2C60-', '\u2CE4', '\u2CEB-', '\u2CEE',
		'\u2D00-', '\u2D25', '\u2D30-', '\u2D65', '\u2D6F', '\u2D80-', '\u2D96',
		'\u2DA0-', '\u2DA6', '\u2DA8-', '\u2DAE', '\u2DB0-', '\u2DB6',
		'\u2DB8-', '\u2DBE', '\u2DC0-', '\u2DC6', '\u2DC8-', '\u2DCE',
		'\u2DD0-', '\u2DD6', '\u2DD8-', '\u2DDE', '\u2E2F',

		'\u3005', '\u3006', '\u3031-', '\u3035', '\u303B', '\u303C', '\u3041-',
		'\u3096', '\u309D-', '\u309F', '\u30A1-', '\u30FA', '\u30FC-', '\u30FF',
		'\u3105-', '\u312D', '\u3131-', '\u318E', '\u31A0-', '\u31B7',
		'\u31F0-', '\u31FF', '\u3400-',

		'\u4DB5', '\u4E00-',

		'\u9FCB',

		'\uA000-', '\uA48C', '\uA4D0-', '\uA4FD', '\uA500-', '\uA60C',
		'\uA610-', '\uA61F', '\uA62A', '\uA62B', '\uA640-', '\uA65F', '\uA662-',
		'\uA66E', '\uA67F-', '\uA697', '\uA6A0-', '\uA6E5', '\uA717-', '\uA71F',
		'\uA722-', '\uA788', '\uA78B', '\uA78C', '\uA7FB-', '\uA801', '\uA803-',
		'\uA805', '\uA807-', '\uA80A', '\uA80C-', '\uA822', '\uA840-', '\uA873',
		'\uA882-', '\uA8B3', '\uA8F2-', '\uA8F7', '\uA8FB', '\uA90A-', '\uA925',
		'\uA930-', '\uA946', '\uA960-', '\uA97C', '\uA984-', '\uA9B2', '\uA9CF',
		'\uAA00-', '\uAA28', '\uAA40-', '\uAA42', '\uAA44-', '\uAA4B',
		'\uAA60-', '\uAA76', '\uAA7A', '\uAA80-', '\uAAAF', '\uAAB1', '\uAAB5',
		'\uAAB6', '\uAAB9-', '\uAABD', '\uAAC0', '\uAAC2', '\uAADB-', '\uAADD',
		'\uABC0-', '\uABE2', '\uAC00-',

		'\uD7A3', '\uD7B0-', '\uD7C6', '\uD7CB-', '\uD7FB',

		'\uF900-', '\uFA2D', '\uFA30-', '\uFA6D', '\uFA70-', '\uFAD9',
		'\uFB00-', '\uFB06', '\uFB13-', '\uFB17', '\uFB1D', '\uFB1F-', '\uFB28',
		'\uFB2A-', '\uFB36', '\uFB38-', '\uFB3C', '\uFB3E', '\uFB40', '\uFB41',
		'\uFB43', '\uFB44', '\uFB46-', '\uFBB1', '\uFBD3-', '\uFD3D', '\uFD50-',
		'\uFD8F', '\uFD92-', '\uFDC7', '\uFDF0-', '\uFDFB', '\uFE70-', '\uFE74',
		'\uFE76-', '\uFEFC', '\uFF21-', '\uFF3A', '\uFF41-', '\uFF5A',
		'\uFF66-', '\uFFBE', '\uFFC2-', '\uFFC7', '\uFFCA-', '\uFFCF',
		'\uFFD2-', '\uFFD7', '\uFFDA-', '\uFFDC'
	];

	/**
	 * Regular expression that matches a white space character.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var WHITE_SPACE = new RegExp('[' + WHITE_SPACE_CHARACTERS.join('') + ']');

	/**
	 * Regular expression that matches one or more white space characters.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var WHITE_SPACES = new RegExp('[' + WHITE_SPACE_CHARACTERS.join('') + ']+');

	/**
	 * Regular expression that matches a zero width character.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var ZERO_WIDTH_SPACE = new RegExp('[' + ZERO_WIDTH_CHARACTERS.join('') + ']');

	/**
	 * Regular expression that matches a non breaking space character.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var NON_BREAKING_SPACE = new RegExp('[' + NON_BREAKING_SPACE_CHARACTERS.join('') + ']');

	var joinedWhiteSpaces = WHITE_SPACE_CHARACTERS.join('');

	/**
	 * Matches space characters.
	 *
	 * This includes all white space characters (matched with "\s"), and
	 * the zero-width character ("\u200B").
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var SPACE = new RegExp('['
	          + joinedWhiteSpaces
	          + ZERO_WIDTH_CHARACTERS.join('')
	          + NON_BREAKING_SPACE_CHARACTERS.join('')
	          + ']');

	/**
	 * Matches non-space characters.  Complement to Strings.SPACE.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var NOT_SPACE = new RegExp('[^'
	              + joinedWhiteSpaces
	              + ZERO_WIDTH_CHARACTERS.join('')
	              + NON_BREAKING_SPACE_CHARACTERS.join('')
	              + ']');

	var wbc = WORD_BREAKING_CHARACTERS.join('');

	/**
	 * This RegExp is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf strings
	 */
	var WORD_BREAKING_CHARACTER = new RegExp('[' + wbc + ']');

	/**
	 * Matches a word boundary.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var WORD_BOUNDARY = new RegExp('[^' + wbc + ']');

	/**
	 * Matches one or more sequence of characters denoting a word boundary from
	 * the end of a string.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var WORD_BOUNDARY_FROM_END = new RegExp('[^' + wbc + '][' + wbc + ']*$');

	/**
	 * Regex matches C0 and C1 control codes, which seems to be good enough.
	 * "The C0 set defines codes in the range 00HEX–1FHEX and the C1
	 * set defines codes in the range 80HEX–9FHEX."
	 * In addition, we include \x007f which is "delete", which just
	 * seems like a good idea.
	 * http://en.wikipedia.org/wiki/List_of_Unicode_characters
	 * http://en.wikipedia.org/wiki/C0_and_C1_control_codes
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var CONTROL_CHARACTER = /[\x00-\x1f\x7f-\x9f]/;

	/**
	 * Matches white spaces at the beginning or ending of a string.
	 *
	 * @type {RegExp}
	 * @memberOf strings
	 */
	var TERMINAL_WHITE_SPACES = new RegExp(
		'^[' + joinedWhiteSpaces + ']+|[' + joinedWhiteSpaces + ']+$'
	);

	/**
	 * Splits a string into a list of individual words.
	 *
	 * Words are non-empty sequences of non-space characaters.
	 *
	 * @param  {string} str
	 * @return {Array.<string>}
	 * @memberOf strings
	 */
	function words(str) {
		str = str.trim().replace(TERMINAL_WHITE_SPACES, '');
		if (isEmpty(str)) {
			return [];
		}
		return str.split(/\s+/g);
	}

	/**
	 * Converts a dashes form into camel cased form.
	 *
	 * The given string should be all lowercase and should not begin with a
	 * dash.
	 *
	 * For example 'data-my-attr' becomes 'dataMyAttr'.
	 *
	 * @param {string} str
	 * @memberOf strings
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
	 * The given string should begin with a lowercase letter and should not
	 * contain dashes.
	 *
	 * For example
	 * 'dataMyAttr' becomes 'data-my-attr',
	 * 'dataAB'     becomes 'data-a-b'.
	 *
	 * @param  {string} str
	 * @return {string}
	 * @memberOf strings
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
	 * The given regular expression must include the g flag, otherwise will
	 * result in an endless loop.
	 *
	 * The resulting list of substrings will be in the order they appeared in
	 * `str`.
	 *
	 * @param  {RegExp} pattern
	 * @return {Array.<string>}
	 * @memberOf strings
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
	 * @param  {string=} str
	 * @return {boolean}
	 * @memberOf strings
	 */
	function isEmpty(str) {
		return '' === str || null == str;
	}

	/**
	 * Returns true if the given character is a control character.  Control
	 * characters are usually not rendered if they are inserted into the DOM.
	 *
	 * Returns false for whitespace 0x20 (which may or may not be rendered see
	 * Html.isUnrenderedWhitespace()) and non-breaking whitespace 0xa0 but
	 * returns true for tab 0x09 and linebreak 0x0a and 0x0d.
	 *
	 * @param  {string} chr
	 * @return {boolean}
	 * @memberOf strings
	 */
	function isControlCharacter(chr) {
		return CONTROL_CHARACTER.test(chr);
	}

	/**
	 * Adds one or more entries to a space-delimited list.
	 * Will return a new space delimited list with the new
	 * entries added to the end.
	 *
	 * The function is designed to deal with shoddy
	 * whitespace separations such as multiple spaces or
	 * even newlines, that may be used on a DOM Element's
	 * class attribute.
	 *
	 * @param  {!string}    list
	 * @param  {...!string} entry
	 * @return {string}
	 * @memberOf strings
	 */
	function addToList(list) {
		var listEntries = list.split(WHITE_SPACES);
		var newEntries = Arrays.coerce(arguments).slice(1);
		var newList = [];

		for (var i=0; i<listEntries.length; i++) {
			if (listEntries[i]) {
				newList.push(listEntries[i]);
			}
		}
		for (i=0; i<newEntries.length; i++) {
			if (newEntries[i]) {
				newList.push(newEntries[i]);
			}
		}
		return newList.join(' ');
	}

	/**
	 * Removes one or more entries from a space-delimited list.
	 * Will return a new space delimited list with the specified
	 * entries removed.
	 *
	 * The function is designed to deal with shoddy
	 * whitespace separations such as multiple spaces or
	 * even newlines, that may be used on a DOM Element's
	 * class attribute.
	 *
	 * @param  {!string}    list
	 * @param  {...!string} entry
	 * @return {string}
	 * @memberOf strings
	 */
	function removeFromList(list) {
		var listArray = list.split(WHITE_SPACES);
		var removeEntries = Arrays.coerce(arguments).slice(1);
		return Arrays.difference(listArray, removeEntries).join(' ');
	}

	/**
	 * Produces a space-delimited list with unique entries from
	 * the provided list. Example:
	 * 'one two three two four two four five' => 'one two three four five'
	 *
	 * @param  {!string} list
	 * @return {string}
	 * @memberOf strings
	 */
	function uniqueList(list) {
		return Arrays.unique(list.split(WHITE_SPACES)).join(' ');
	}

	return {
		addToList                     : addToList,
		removeFromList                : removeFromList,
		uniqueList                    : uniqueList,

		words                         : words,
		splitIncl                     : splitIncl,

		dashesToCamelCase             : dashesToCamelCase,
		camelCaseToDashes             : camelCaseToDashes,

		isEmpty                       : isEmpty,
		isControlCharacter            : isControlCharacter,

		CONTROL_CHARACTER             : CONTROL_CHARACTER,
		SPACE                         : SPACE,
		NOT_SPACE                     : NOT_SPACE,
		WHITE_SPACE                   : WHITE_SPACE,
		WHITE_SPACES                  : WHITE_SPACES,
		ZERO_WIDTH_SPACE              : ZERO_WIDTH_SPACE,
		NON_BREAKING_SPACE            : NON_BREAKING_SPACE,
		WORD_BOUNDARY                 : WORD_BOUNDARY,
		WORD_BOUNDARY_FROM_END        : WORD_BOUNDARY_FROM_END,
		WORD_BREAKING_CHARACTER       : WORD_BREAKING_CHARACTER,
		TERMINAL_WHITE_SPACES         : TERMINAL_WHITE_SPACES,

		ZERO_WIDTH_CHARACTERS         : ZERO_WIDTH_CHARACTERS,
		WHITE_SPACE_CHARACTERS        : WHITE_SPACE_CHARACTERS,
		WORD_BREAKING_CHARACTERS      : WORD_BREAKING_CHARACTERS,
		NON_BREAKING_SPACE_CHARACTERS : NON_BREAKING_SPACE_CHARACTERS
	};
});
