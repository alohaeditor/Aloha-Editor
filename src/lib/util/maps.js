/* maps.js is part of Aloha Editor project http://aloha-editor.org
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
define([], function () {
	'use strict';

	/**
	 * Checks whether the given object has no own or inherited properties.
	 *
	 * @param {!Object} obj The object to check.
	 * @return {boolean} True if the object is empty. eg: isEmpty({}) == true
	 */
	function isEmpty(obj) {
		var name;
		for (name in obj) {
			if (obj.hasOwnProperty(name)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Fill the given map with the given keys mapped to the given value.
	 *
	 * @param map
	 *        The given map will have one entry added for each given key.
	 * @param keys
	 *        An array of string keys. Javascript maps can only
	 *        contain string keys, so these must be strings or
	 *        or they will be cast to string.
	 * @param value
	 *        A single value that each given key will map to.
	 * @return
	 *        The given map.
	 */
	function fillKeys(map, keys, value) {
		var i = keys.length;
		while (i--) {
			map[keys[i]] = value;
		}
		return map;
	}

	/**
	 * Fill the given map with entries from the given tuples.
	 *
	 * @param map
	 *        The given map will have one entry added for each item in
	 *        the given array.
	 * @param tuples
	 *        An array of [key, value] tuples. Javascript maps can only
	 *        contain string keys, so the keys must be strings or
	 *        or they will be cast to string.
	 * @return
	 *        The given map.
	 */
	function fillTuples(map, tuples) {
		var i = tuples.length,
			tuple;
		while (i--) {
			tuple = tuples[i];
			map[tuple[0]] = tuple[1];
		}
		return map;
	}

	function keys(map) {
		var ks = [],
			k;
		for (k in map) {
			if (map.hasOwnProperty(k)) {
				ks.push(k);
			}
		}
		return ks;
	}

	return {
		isEmpty: isEmpty,
		fillTuples: fillTuples,
		fillKeys: fillKeys,
		keys: keys
	};
});
