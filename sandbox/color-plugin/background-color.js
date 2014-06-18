define([
	'dom',
	'events',
	'./coloring',
	'../color-picker/color-picker',
	'../color-picker/palette'
], function Plugin(
	dom,
	events,
	coloring,
	picker,
	palette
) {
	'use strict';

	var show = picker.overlay(
		palette,
		coloring.getBackgroundColor,
		function (range, node) {
			if (dom.isEditableNode(range.startContainer)) {
				coloring.setBackgroundColor(
					range,
					dom.getComputedStyle(node, 'background-color')
				);
			}
		},
		coloring.unsetBackgroundColor
	);

	var button = document.createElement('button');
	button.appendChild(document.createTextNode('Change Background Color'));
	document.getElementsByTagName('body')[0].appendChild(button);

	events.add(button, 'click', show);
});
