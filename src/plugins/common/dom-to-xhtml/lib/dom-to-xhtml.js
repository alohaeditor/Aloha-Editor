/* dom-to-xhtml.js is part of Aloha Editor project http://aloha-editor.org
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
/**
 * Provides public utility methods to convert DOM nodes to XHTML.
 */
define([
	'jquery',
	'util/dom2',
	'util/misc',
	'util/browser',
	'aloha/ephemera',
	'aloha/console'
],
function(
	$,
	Dom,
	Misc,
	Browser,
	Ephemera,
	console
) {
	"use strict";

	/**
	 * Elements that are to be serialized like <img /> and not like <img></img>
	 */
	var emptyElements = {
		"area": true,
		"base": true,
		"basefont": true,
		"br": true,
		"col": true,
		"frame": true,
		"hr": true,
		"img": true,
		"input": true,
		"isindex": true,
		"link": true,
		"meta": true,
		"param": true,
		"embed": true
	};

	/**
	 * Attributes that are to be serialized like checked="checked" for any attribute value.
	 */
	var booleanAttrs = {
		"checked": true,
		"compact": true,
		"declare": true,
		"defer": true,
		"disabled": true,
		"ismap": true,
		"multiple": true,
		"nohref": true,
		"noresize": true,
		"noshade": true,
		"nowrap": true,
		"readonly": true,
		"selected": true
	};

	/**
	 * Maps element names to a boolean that indicates whether IE7/IE8 doesn't recognize the element.
	 * This is necessary to repair the broken DOM structure caused by unrecognized elements.
	 * Contains some intial values to cover most common cases. If an
	 * element is serialized that is not present here, it will be
	 * examined (which may be costly) and added dynamically.
	 * See isUnrecognized().
	 */
	var isUnrecognizedMap = {
		"DIV": false,
		"SPAN": false,
		"UL": false,
		"OL": false,
		"LI": false,
		"TABLE": false,
		"TR": false,
		"TD": false,
		"TH": false,
		"I": false,
		"B": false,
		"EM": false,
		"STRONG": false,
		"A": false,
		"P": false
	};

	/**
	 * Encodes a string meant to be used wherever parsable character data occurs in XML.
	 * @param str
	 *        An unencoded piece of character data
	 * @return
	 *        The given string with & and < characters replaced with the corresponding HTML entity references.
	 */
	function encodePcdata(str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
	}

	/**
	 * Encodes a string meant to be used between double-quoted attribute values.
	 *
	 * @param str
	 *        An unencoded attribute value
	 * @return
	 *        The given string with & < and " characters replaced with the corresponding HTML entity references.
	 */
	function encodeDqAttrValue(str) {
		return encodePcdata(str).replace(/"/g, '&quot;');
	}

	/**
	 * Serializes the attributes of the given element.
	 *
	 * Attributes that have the empty string as value will not appear in the string at all.
	 *
	 * @param element
	 *        An element to serialize the attributes of
	 * @param ephemera
	 *        Describes attributes that should be skipped.
	 *        See Ehpemera.ephemera().
	 * @return
	 *        A string made up of name="value" for each attribute of the
	 *        given element, separated by space. The string will have a leading space.
	 */
	function makeAttrString(element, ephemera) {
		var attrs = Dom.attrs(element);
		var str = "";
		var i, len;
		// Dom.attrs() doesn't support some boolean attributes on IE7
		// which we have to compensate for.
		if (Browser.ie7) {
			for (var bool in booleanAttrs) {
				if (booleanAttrs.hasOwnProperty(bool) && element[bool]) {
					// We don't want to add duplicate attributes
					for (i = 0, len = attrs.length; i < len; i++) {
						if (bool === attrs[i][0].toLowerCase()) {
							attrs.splice(i, 1);
							break;
						}
					}
					attrs.push([bool, bool]);
				}
			}
		}
		for (i = 0, len = attrs.length; i < len; i++) {
			// The XHTML spec says attributes are lowercase
			var attr  = attrs[i];
			var name  = attr[0].toLowerCase();
			var value = attr[1];

			if (ephemera && Ephemera.isAttrEphemeral(element, name, ephemera.attrMap || {}, ephemera.attrRxs || {})) {
				continue;
			}

			//TODO it's only a boolean attribute if the element is in an HTML namespace
			var isBool = booleanAttrs[name];

			if (!isBool && "" === value) {
				// I don't think it is ever an error to make an
				// attribute not appear if its string value is empty.
				continue;
			}

			// For boolean attributes, the mere existence of the attribute means it is true.
			str += " " + name + '="' + encodeDqAttrValue((isBool ? name : value)) + '"';
		}
		return str;
	}

	/**
	 * IE8 turns the following
	 * <book id="x">{content}</book>
	 * into
	 * <book id="x"></book>{content}</book><//book>
	 * This seems to occur with any element IE doesn't recognize.
	 *
	 * @param element
	 *        An element node.
	 * @return
	 *        true if the given element isn't recognized by IE and
	 *        causes a broken DOM structure as outlined above.
	 */
	function isUnrecognized(element) {
		var name = element.nodeName;
		var unrecognized = isUnrecognizedMap[name];
		if (null != unrecognized) {
			return unrecognized;
		}
		var closingName = "/" + element.nodeName;
		var sibling = element.nextSibling;
		unrecognized = false;
		while (null != sibling) {
			if (closingName == sibling.nodeName) {
				unrecognized = true;
				break;
			}
			sibling = sibling.nextSibling;
		}
		isUnrecognizedMap[name] = unrecognized;
		return unrecognized;
	}

	/**
	 * Serializes the children of the given element into an XHTML string.
	 *
	 * The same as serializeElement() except it only serializes the children.
	 * The start and end tag of the given element will not appear in the resulting XHTML.
	 *
	 * @see serializeElement()
	 */
	function serializeChildren(element, child, unrecognized, ephemera, xhtml) {
		while (null != child) {
			if (1 === child.nodeType && unrecognized && "/" + element.nodeName == child.nodeName) {
				child = child.nextSibling;
				break;
			} else if (1 === child.nodeType && isUnrecognized(child)) {
				child = serializeElement(child, child.nextSibling, true, ephemera, xhtml);
			} else {
				serialize(child, ephemera, xhtml);
				child = child.nextSibling;
			}
		}
		return child;
	}

	/**
	 * Serializes an element into an XHTML string.
	 *
	 * @param element
	 *        An element to serialize.
	 * @param child
	 *        The first child of the given element. This will usually be
	 *        element.firstChild. On IE this may be element.nextSibling because
	 *        of the broken DOM structure IE sometimes generates.
	 * @param unrecognized
	 *        Whether the given element is unrecognized on IE. If IE doesn't
	 *        recognize the element, it will create a broken DOM structure
	 *        which has to be compensated for. See isUnrecognized() for more.
	 * @param ephemera
	 *        Describes content that should not be serialized.
	 *        Only attrMap and attrRxs are supported at the moment.
	 *        See Ephemera.ephemera().
	 * @param xhtml
	 *        An array which receives the serialized element and whic, if joined,
	 *        will yield the XHTML string.
	 * @return
	 *        null if all siblings of the given child have been processed as children
	 *        of the given element, or otherwise the first sibling of child that is not considered
	 *        a child of the given element.
	 */
	function serializeElement(element, child, unrecognized, ephemera, xhtml) {
		// TODO: we should only lowercase element names if they are in an HTML namespace
		var elementName = element.nodeName.toLowerCase();
		// This is a hack around an IE bug which strips the namespace prefix
		// of element.nodeName if it occurs inside an contentEditable=true.
		if (element.scopeName && 'HTML' != element.scopeName && -1 === elementName.indexOf(':')) {
			elementName = element.scopeName.toLowerCase() + ':' + elementName;
		}
		if (!unrecognized && null == child && emptyElements[elementName]) {
			xhtml.push('<' + elementName + makeAttrString(element, ephemera) + '/>');
		} else {
			xhtml.push('<' + elementName + makeAttrString(element, ephemera) + '>');
			child = serializeChildren(element, child, unrecognized,  ephemera, xhtml);
			xhtml.push('</' + elementName + '>');
		}
		return child;
	}

	/**
	 * Serializes a DOM node into a XHTML string.
	 *
	 * @param node
	 *        A DOM node to serialize.
	 * @param ephemera
	 *        Describes content that should not be serialized.
	 *        Only attrMap and attrRxs are supported at the moment.
	 *        See Ephemera.ephemera().
	 * @param xhtml
	 *        An array that will receive snippets of XHTML,
	 *        which if joined will yield the XHTML string.
	 */
	function serialize(node, ephemera, xhtml) {
		var nodeType = node.nodeType;
		if (1 === nodeType) {
			serializeElement(node, node.firstChild, isUnrecognized(node), ephemera, xhtml);
		} else if (3 === node.nodeType) {
			xhtml.push(encodePcdata(node.nodeValue));
		} else if (8 === node.nodeType) {
			xhtml.push('<' + '!--' + node.nodeValue + '-->');
		} else {
			console.warn('Unknown node type encountered during serialization, ignoring it:'
						 + ' type=' + node.nodeType
						 + ' name=' + node.nodeName
						 + ' value=' + node.nodeValue);
		}
	}
	
	return {
		/**
		 * Serializes a number of DOM nodes in an array-like object to an XHTML string.
		 *
		 * The XHTML of the nodes in the given array-like object will be concatenated.
		 *
		 * @param nodes
		 *        An array or jQuery object or another array-like object to serialize.
		 * @param ephemera
		 *        Describes content that should not be serialized.
		 *        Only attrMap and attrRxs are supported at the moment.
		 *        See Ephemera.ephemera().
		 * @return
		 *        The serialized XHTML String representing the given DOM nodes in the given array-like object.
		 *        The result may look like an XML fragment with multiple top-level elements and text nodes.
		 * @see nodeToXhtml()
		 */
		contentsToXhtml: function(element, ephemera) {
			var xhtml = [];
			serializeChildren(element, element.firstChild, false, ephemera, xhtml);
			return xhtml.join("");
		},

		/**
		 * Serializes a DOM node to an XHTML string.
		 *
		 * Beware that the serialization method will generate XHTML as
		 * close as possible to the DOM tree represented by the given
		 * node. The result will only be valid XHTML if the DOM tree
		 * doesn't violate any contained-in rules.
		 *
		 * Element attributes with an empty string as value will not
		 * appear in the serialized output.
		 *
		 * Element attribute names are case-insensitive in HTML5, so
		 * they may come out in mixed-case depending on what the browser
		 * provides.
		 *
		 * When iterating over the DOM, CDATA sections are comment nodes
		 * on some browsers (Chrome) and not there at all on others (IE).
		 * This is the same as what comes out from element.innerHTML.
		 *
		 * IE8 bug: comments will sometimes be silently stripped inside
		 * contentEditable=true. Conditional includes don't work inside
		 * contentEditable=true. See the tests for more information.
		 *
		 * IE8 bug: a title element will not be serialized correctly
		 * unless it occurs in the head of a HTML document, even if it occurs
		 * in a non-HTML namespace (maybe it works with a prefix).
		 * This will probably also apply for other HTML elements that
		 * occur in the header.
		 *
		 * IE8 bug: unrecognized elements in the HTML scope will cause
		 * broken DOM structure (some HTML5 elements that are not yet
		 * implemented in IE for example). Some effort was made to fix a
		 * broken DOM structure, if it is encountered. There is one case
		 * which results in an unrecoverably broken DOM structure, which
		 * is an unrecognized element not preceded by some text. See the
		 * tests for further information.
		 *
		 * IE8 bug: whitespace is not reliably preserved when the style
		 * white-space:pre (or similar) is used. See the tests for
		 * further information. Whitespace inside <pre> elements will
		 * be preserved, but \n characters will become \r characters.
		 *
		 * IE7 bug: URLs in href and src attributes of a and img
		 * elements will be absolutized (including hostname and
		 * protocol) if they are given as a relative path.
		 *
		 * IE bug: Namespace support inside contentEditable=true is a
		 * bit shaky on IE. Don't use it if possible. See the tests to
		 * get an idea of what seems to work. Make namespace prefixes
		 * and element names all lower-case, as they are always
		 * lower-cased, even if the element doesn't occur in an HTML
		 * namespace. Don't use default namespaces, use prefixes (except
		 * for an HTML namespace).
		 *
		 * @param node
		 *        A DOM node to serialize
		 * @param ephemera
		 *        Describes content that should not be serialized.
		 *        Only attrMap and attrRxs are supported at the moment.
		 *        See Ephemera.ephemera().
		 * @return
		 *        The serialized XHTML string represnting the given DOM node.
		 */
		nodeToXhtml: function(node, ephemera) {
			var xhtml = [];
			serialize(node, ephemera, xhtml);
			return xhtml.join("");
		}
	};
});
