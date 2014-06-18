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
		Coloring.getTextColor,
		function (range, node) {
			if (Dom.isEditableNode(range.startContainer)) {
				Coloring.setTextColor(
					range,
					Dom.getComputedStyle(node, 'background-color')
				);
			}
		},
		Coloring.unsetTextColor
	);

	var button = document.createElement('button');
	button.innerHTML = 'Change Text Color';
	Dom.append(button, document.querySelector('body'));
	Events.add(button, 'click', show);
});
