define([
	'dom',
	'colors',
	'events',
	'sandbox/color-picker/color-picker',
	'sandbox/color-picker/palette'
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
		colors.getBackgroundColor,
		function (range, node) {
			if (dom.isEditable(range.startContainer)) {
				colors.setBackgroundColor(
					range,
					dom.getComputedStyle(node, 'background-color')
				);
			}
		},
		colors.unsetBackgroundColor
	);

	var button = document.createElement('button');
	button.appendChild(document.createTextNode('Change Background Color'));
	document.getElementsByTagName('body')[0].appendChild(button);

	events.add(button, 'click', show);
});
