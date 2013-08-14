define([
	'../../src/dom',
	'../../src/editing',
	'../../src/functions'
], function Colors(
	dom,
	editing
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
	 * Gets the text color at the given range.
	 *
	 * @param {Range} range
	 * @return {String} Style color string
	 */
	function getTextColor(range) {
		var node = dom.nodeAtOffset(range.startContainer, range.startOffset);
		return dom.getComputedStyle(
			3 === node.nodeType ? node.parentNode : node,
			'color'
		);
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
	 * Sets the text color at the given range.
	 *
	 * @param {Range} range
	 * @param {String} color
	 */
	function setTextColor(range, color) {
		editing.format(range, 'color', color, null, isColorEqual);
	}

	/**
	 * Removes color at the given range.
	 *
	 * @param {Range} range
	 */
	function unsetTextColor(range) {
		var editable = dom.getNearestEditingHost(range);
		if (editable) {
			setTextColor(range, dom.getComputedStyle(editable, 'color'));
		}
	}

	/**
	 * Function for working with colors.
	 *
	 * colors.hex()
	 * colors.getTextColor()
	 * colors.setTextColor()
	 * colors.unsetTextColor()
	 */
	var exports = {
		hex: hex,
		getTextColor: getTextColor,
		setTextColor: setTextColor,
		unsetTextColor: unsetTextColor
	};

	return exports;
});
