define([
	'dom',
	'events',
	'./coloring',
	'../color-picker/color-picker',
	'../color-picker/palette'
], function (
	Dom,
	Events,
	Coloring,
	Picker,
	Palette
) {
	'use strict';

	var show = Picker.overlay(
		Palette,
		Coloring.getBackgroundColor,
		function (range, node) {
			if (Dom.isEditableNode(range.startContainer)) {
				Coloring.setBackgroundColor(
					range,
					Dom.getComputedStyle(node, 'background-color')
				);
			}
		},
		Coloring.unsetBackgroundColor
	);

	var button = document.createElement('button');
	button.innerHTML = 'Change Background Color';
	Dom.append(button, document.querySelector('body'));
	Events.add(button, 'click', show);
});
