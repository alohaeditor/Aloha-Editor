define([
	'../../src/dom',
	'../../src/colors',
	'../../src/events',
	'../color-picker/color-picker',
	'../color-picker/palette'
], function Plugin(
	dom,
	colors,
	events,
	picker,
	palette
) {
	'use strict';

	var show = picker.overlay(
		palette,
		colors.getTextColor,
		function (range, node) {
			if (dom.isEditable(range.startContainer)) {
				colors.setTextColor(
					range,
					dom.getComputedStyle(node, 'background-color')
				);
			}
		},
		colors.unsetTextColor
	);

	var button = document.createElement('button');
	button.appendChild(document.createTextNode('Change Text Color'));
	document.getElementsByTagName('body')[0].appendChild(button);

	events.add(button, 'click', show);
});
