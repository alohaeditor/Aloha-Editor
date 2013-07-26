/* textcolor.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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

define([
	'util/dom',
	'util/dom2',
	'util/range-context',
	'util/functions'
], function TextColorUtilities(
	DomUtils,
	Dom,
	RangeContext,
	Fn
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('TextColor');
	}

	var COLOR_PREFIX = /^(#|rgba?|hsl)\(?([^\(\)]+)/i;
	var COMMA = /\s*,\s*/;

	function normalizeHex(color) {
		if (7 === color.length) {
			return color;
		}
		var r = color.substr(1, 1);
		var g = color.substr(2, 1);
		var b = color.substr(3, 1);
		return '#' + r + r + g + g + b + b;
	}

	function rgb2hex(rgb) {
		var r = parseInt(rgb[0], 10).toString(16);
		var g = parseInt(rgb[1], 10).toString(16);
		var b = parseInt(rgb[2], 10).toString(16);
		if (1 === r.length) {
			r += r;
		}
		if (1 === g.length) {
			g += g;
		}
		if (1 === b.length) {
			b += b;
		}
		return '#' + r + g + b;
	}

	function hex(value) {
		var color = value.match(COLOR_PREFIX);
		switch (color && color[1]) {
		case '#':
			return normalizeHex(color[0]);
		case 'rgb':
		case 'rgba':
			return rgb2hex(color[2].split(COMMA));
		default:
			return null;
		}
	}

	function getColor(range) {
		var node = Dom.nodeAtOffset(range.startContainer, range.startOffset);
		return Dom.getComputedStyle(
			3 === node.nodeType ? node.parentNode : node,
			'color'
		);
	}

	function isColorEqual(colorA, colorB) {
		return (
			(null == colorA || null == colorB)
				? colorA === colorB
				: hex(colorA) === hex(colorB)
		);
	}

	function setColor(range, color) {
		RangeContext.formatStyle(range, 'color', color, null, isColorEqual);
	}

	/**
	 * Because Firefox, the range may not be inside the editable even though the
	 * selection may be inside the editable.
	 */
	function getNearestEditingHost(range) {
		var editable = DomUtils.getEditingHostOf(range.startContainer);
		if (editable) {
			return editable;
		}
		var copy = Dom.stableRange(range);
		var isNotEditingHost = Fn.complement(Dom.isEditingHost);
		Dom.trimRange(copy, isNotEditingHost, isNotEditingHost);
		return Dom.getEditingHostOf(
			Dom.nodeAtOffset(copy.startContainer, copy.startOffset)
		);
	}

	function unsetColor(range) {
		setColor(
			range,
			Dom.getComputedStyle(getNearestEditingHost(range), 'color')
		);
	}

	var exports = {
		hex: hex,
		getColor: getColor,
		setColor: setColor,
		unsetColor: unsetColor,
		getNearestEditingHost: getNearestEditingHost
	};

	return exports;
});
