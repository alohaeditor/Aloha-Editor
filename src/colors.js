define([
	'dom',
	'ranges',
	'editing'
], function Colors(
	Dom,
	Ranges,
	Editing
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('colors');
	}

	var COLOR_PREFIX = /^(#|rgba?|hsl)\(?([^\(\)]+)/i;
	var COMMA = /\s*,\s*/;

	/**
	 * Normalizes hexidecimal colors from
	 * #f34 to #ff3344
	 *
	 * @param {String} color
	 * @return {String} Long version of hexidecimal color value
	 */
	function normalizeHex(color) {
		if (7 === color.length) {
			return color;
		}
		var r = color.substr(1, 1);
		var g = color.substr(2, 1);
		var b = color.substr(3, 1);
		return '#' + r + r + g + g + b + b;
	}

	/**
	 * Converts rgb color array to a hex color string.
	 *
	 * @param {Array<String>} rgb
	 * @return {String}
	 */
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

	/**
	 * Given a color string will normalize it to a hex color string.
	 *
	 * @param {String} value
	 * @return {String}
	 */
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

	/**
	 * Checks whether the two given colors are equal in value (if not in
	 * representation).
	 *
	 * isColorEqual('#f00', 'rgb(255,0,0)') === true
	 *
	 * @param {String} colorA
	 * @param {String} colorB
	 * @return {Boolean}
	 */
	function isColorEqual(colorA, colorB) {
		return (
			(null == colorA || null == colorB)
				? colorA === colorB
				: hex(colorA) === hex(colorB)
		);
	}

	/**
	 * Gets the style of the start container of the given range.
	 *
	 * @param {Range} range
	 * @param {String} property
	 * @return {String} Style value
	 */
	function getStyle(range, property) {
		var node = Dom.nodeAtOffset(range.startContainer, range.startOffset);
		return Dom.getComputedStyle(
			Dom.Nodes.TEXT === node.nodeType ? node.parentNode : node,
			property
		);
	}

	/**
	 * Gets the text color at the given range.
	 *
	 * @param {Range} range
	 * @return {String} Style color string
	 */
	function getTextColor(range) {
		return getStyle(range, 'color');
	}

	/**
	 * Sets the text color at the given range.
	 *
	 * @param {Range} range
	 * @param {String} color
	 */
	function setTextColor(range, color) {
		Editing.format(range, 'color', color, isColorEqual);
	}

	/**
	 * Removes the text color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetTextColor(range) {
		var editable = Ranges.getNearestEditingHost(range);
		if (editable) {
			setTextColor(range, Dom.getComputedStyle(editable, 'color'));
		}
	}

	/**
	 * Gets the background color at the given range.
	 *
	 * @param {Range} range
	 * @return {String} Style color string
	 */
	function getBackgroundColor(range) {
		return getStyle(range, 'background-color');
	}

	/**
	 * Sets the background color at the given range.
	 *
	 * @param {Range} range
	 * @param {String} color
	 */
	function setBackgroundColor(range, color) {
		Editing.format(range, 'background-color', color, isColorEqual);
	}

	/**
	 * Removes the background color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetBackgroundColor(range) {
		var editable = Ranges.getNearestEditingHost(range);
		if (editable) {
			setBackgroundColor(range, Dom.getComputedStyle(editable, 'background-color'));
		}
	}

	return {
		hex                  : hex,
		getTextColor         : getTextColor,
		setTextColor         : setTextColor,
		unsetTextColor       : unsetTextColor,
		getBackgroundColor   : getBackgroundColor,
		setBackgroundColor   : setBackgroundColor,
		unsetBackgroundColor : unsetBackgroundColor
	};
});
