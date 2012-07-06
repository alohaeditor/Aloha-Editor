define(['aloha/jquery-ui'], function() {
	'use strict';
	var Utils = {
		makeButton: function(button, props, hasMenu) {
			button.button({
				label: Utils.makeButtonLabel(props),
				text: !!(props.text || props.html),
				icons: {
					primary: props.icon || (props.iconUrl && 'aloha-ui-inline-icon-container') || null,
					secondary: (hasMenu && 'aloha-jqueryui-icon ui-icon-triangle-1-s') || null
				}
			});
			if (props.iconUrl) {
				button.button('widget')
					  .children('.ui-button-icon-primary')
					  .append(Utils.makeButtonIconFromUrl(props.iconUrl));
			}
			return button;
		},
		makeButtonLabel: function(props) {
			// TODO text should be escaped
			return props.html || props.text || props.tooltip;
		},
		makeButtonLabelWithIcon: function(props) {
			var label = Utils.makeButtonLabel(props);
			if (props.iconUrl) {
				label = Utils.makeButtonIconFromUrl(props.iconUrl) + label;
			}
			return label;
		},
		makeButtonIconFromUrl: function(iconUrl) {
			return '<img class="aloha-ui-inline-icon" src="' + iconUrl + '">';
		},
		makeButtonElement: function(attr){
			var button = $('<button>', attr);
			// Avoid problems with IE which considers buttons to be of
			// type submit by default. One problem that occurd was that
			// hitting enter inside a text-input caused a click event in
			// the button right next to it.
			button[0].type = 'button';
			return button;
		}
	};
	return Utils;
});
