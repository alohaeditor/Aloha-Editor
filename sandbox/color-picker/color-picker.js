define([
	'dom',
	'ranges',
	'colors',
	'./overlay'
], function ColorPicker(
	dom,
	ranges,
	colors,
	Overlay
) {
	'use strict';

	function isColor(value) {
		return value.substr(0, 1) === '#' || value.substr(0, 3) === 'rgb';
	}

	function pick(picked, range, setColor, unsetColor) {
		if (range.collapsed) {
			ranges.expand(range, 'word');
		}
		if (dom.hasClass(picked.firstChild, 'clear')) {
			unsetColor(range, picked.firstChild);
		} else {
			setColor(range, picked.firstChild);
		}
		ranges.select(range);
	}

	var rangeAtOpen;

	function show(anchor, overlay, getSwatchClass, getColor) {
		rangeAtOpen = ranges.get(overlay.$element[0].ownerDocument);
		if (rangeAtOpen) {
			var swatchClass = getSwatchClass(getColor(rangeAtOpen));
			if (swatchClass) {
				overlay.focus(
					overlay.$element.find('.' + swatchClass).closest('td')[0]
				);
			} else {
				overlay.clear();
			}
		}
		var offset = Overlay.calculateOffset(anchor);
		offset.top = Math.round(
			offset.top + parseInt(dom.getComputedStyle(anchor, 'height'), 10)
		);
		offset.left = Math.round(offset.left);
		overlay.show(offset, anchor);
	}

	/**
	* Generates swatches.
	*
	* @param {Object} swatches
	* @param {Function(String)} getSwatchClass
	* @return {Array<String>}
	*/
	function generateSwatches(swatches, getSwatchClass) {
		var list = swatches.map(function (color) {
			return (
				isColor(color)
					? '<div class="' + getSwatchClass(color) + '" '
						+ 'style="background-color: ' + color + '" '
						+ 'title="' + color + '"></div>'
					: '<div class="' + getSwatchClass(color) + ' '
						+ color + '"></div>'
			);
		});
		list.push(
			'<div class="clear" title="Remove Color">&#10006</div></td>'
		);
		return list;
	}

	function createOverlay(palette, getColor, setColor, unsetColor) {
		var getSwatchClass = (function (swatches) {
			var index = {};
			swatches.forEach(function (color, i) {
				index[colors.hex(color.toLowerCase())] = 'swatch' + i;
			});
			return function getSwatchClass(color) {
				return (
					index[color.toLowerCase()]
						||
					index[colors.hex(color.toLowerCase())]
				);
			};
		}(palette));

		var overlay = new Overlay(
			generateSwatches(palette, getSwatchClass),
			function (picked) {
				if (rangeAtOpen) {
					pick(picked, rangeAtOpen, setColor, unsetColor);
				}
			}
		);

		dom.addClass(overlay.$element[0], 'aloha-ui-colorpicker-overlay');

		return function () {
			show(this, overlay, getSwatchClass, getColor);
		};
	}

	return {
		overlay: createOverlay
	};
});
