/* ephemera.js is part of Aloha Editor project http://aloha-editor.org
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
	
	/**
	 * Like insertBefore, except also inserts 
	 */
	function moveNextAll(parent, firstChild, refChild) {
		while (firstChild) {
			var nextChild = firstChild.nextSibling;
			parent.insertBefore(firstChild, refChild);
			firstChild = nextChild;
		}
	}

	var attrRegex = /\s([^<\s=]+)(?:=(?:"[^"]*"|'[^']*'|[^\s]+))?/g;

	/**
	 * Retrieves the names of all attributes from the given elmenet.
	 *
	 * Correctly handles the case that IE7 and IE8 have approx 70-90
	 * default attributes on each and every element.
	 *
	 * The implementation does not iterate over the elem.attributes
	 * NamedNodeList since it is much slower on IE7 (even when checking
	 * the attrNode.specified property). Instead it parses the HTML of
	 * the element. For elements with very few attributes the
	 * performance on IE7 is improved by an order of magnitued.
	 */
	function attrNames(elem) {
		var names = [];
		var html = elem.cloneNode(false).outerHTML;
		var match;
		while (null != (match = attrRegex.exec(html))) {
			names.push(match[1]);
		}
		return names;
	}

	/**
	 * Gets the attributes of the given element.
	 *
	 * @param elem
	 *        An element to get the attributes for.
	 * @return
	 *        An array of consisting of [name, value] tuples for each attribute.
	 *        Attribute values will always be strings, but possibly empty strings.
	 */
	function attrs(elem) {
		var attrs = [];
		var attrNames = attributeNames(elem);
		for (var i = 0, len = attrNames.length; i < len; i++) {
			var value = $.attr(elem, name);
			attrs.push([name, (null == value ? "" : "" + value)]);
		}
		return attrs;
	}

	return {
		moveNextAll: moveNextAll,
		attrNames: attrNames,
		attrs: attrs
	};
});