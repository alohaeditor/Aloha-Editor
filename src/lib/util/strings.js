/* strings.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define(['jquery'], function ($) {
	'use strict';

	var spacesRx = /\s+/;

	/**
	 * Splits a string into individual words.
	 *
	 * Words are non-empty sequences of non-space characaters.
	 */
	function words(str) {
		var list = str.split(spacesRx);
		// "  x  ".split(/\s+/) => ["", "x", ""] (Chrome)
		// "".split(/\s+/) => [""] (Chrome)
		if (list.length && list[0] === "") {
			list.shift();
		}
		if (list.length && list[list.length - 1] === "") {
			list.pop();
		}
		return list;
	}

	/**
	 * Converst a dashes form into camel cased form.
	 *
	 * For example 'data-my-attr' becomes 'dataMyAttr'.
	 *
	 * @param {string} s
	 *        Should be all lowercase and should not begin with a dash
	 */
	function dashesToCamelCase(s) {
		return s.replace(/[\-]([a-z])/gi, function (all, upper) {
			return upper.toUpperCase();
		});
	}

	/**
	 * Converts a camel cased form into dashes form.
	 *
	 * For example
	 * 'dataMyAttr' becomes 'data-my-attr',
	 * 'dataAB'     becomes 'data-a-b'.
	 *
	 * @param {string} s
	 *        Should begin with a lowercase letter and should not contain dashes.
	 */
	function camelCaseToDashes(s) {
		return s.replace(/[A-Z]/g, function (match) {
			return '-' + match.toLowerCase();
		});
	}

	/**
	 * Split str along pattern, including matches in the result.
	 *
	 * Necssary because, although "xzx".split(/(z)/) results in
	 * ["x", "z", "x"] on most modern browsers, it results in
	 * ["x", "x"] on IE.
	 *
	 * @param pattern must include the g flag, otherwise will result in
	 * an endless loop.
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

	return {
		words: words,
		dashesToCamelCase: dashesToCamelCase,
		camelCaseToDashes: camelCaseToDashes,
		splitIncl: splitIncl
	};
});
