/**
 * This is a helper module for porting plugins from the old
 * ui-attributefield.js in the aloha core to the new ui-plugin.
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'aloha/core',
	'jquery',
	'ui/component',
	'ui/multiSplit'
], function (Aloha, jQuery, Component, MultiSplit) {

	function MultiSplitButton(props) {

		Component.define(props.name, MultiSplit, {
			scope: props.scope,
			getButtons: function () {
				return makeButtonsFromOldStyleProps(props, false);
			},
			getItems: function () {
				return makeButtonsFromOldStyleProps(props, true);
			}
		});

		var activeItem = null;

		function makeButtonsFromOldStyleProps(props, wide) {
			var buttons = [];
			jQuery.each(props.items, function (_, item) {
				if (!!item.wide != wide) {
					return;
				}
				buttons.push({
					tooltip: item.tooltip,
					text: item.text,
					icon: item.iconClass,
					click: item.click,
					isActive: function () {
						// TODO return activeItem === item.name;
					}
				});
			});
			return buttons;
		}

		return {
			showItem: function () {},
			hideItem: function () {},
			setActiveItem: function (name) {
				activeItem = name;
			}
		};
	}

	return MultiSplitButton;
});
