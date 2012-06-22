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
			// Expose this function so the cite-plugin can push its own
			// button to the format plugin's multi-split-button (which
			// is a disastrous hack I know).
			// TODO make it possible to combine the items of multiple
			// plugins into a single multi split button.
			pushItem: function(item){
				props.items.push(item);
			},
			showItem: function(){},
			hideItem: function(){},
			setActiveItem: function (name) {
				activeItem = name;
			}
		};
	}

	return MultiSplitButton;
});
