/*global define: true */
/**
 * This is a helper module for porting plugins from the old
 * ui-attributefield.js in the aloha core to the new ui-plugin.
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'aloha/core',
	'jquery',
	'ui/ui',
	'ui/multiSplit'
], function (
	Aloha,
	jQuery,
	Ui,
	MultiSplit
) {
	'use strict';

	function MultiSplitButton(props) {
		var multiSplit;

		multiSplit = Ui.adopt(props.name, MultiSplit, {
			scope: props.scope,
			getButtons: function () {
				var buttons = [];
				jQuery.each(props.items, function (i, item) {
					buttons.push({
						tooltip: item.tooltip,
						text: item.text,
						name: item.name,
						icon: item.iconClass,
						click: item.click,
						init: function () {
							if (item.cls) {
								this.element.addClass(item.cls);
							}
							if (item.init) {
								item.init.call(this);
							}
						},
						wide: item.wide
					});
				});
				return buttons;
			}
		});

		return {
			// Expose this function so the cite-plugin can push its own
			// button to the format plugin's multi-split-button (which
			// is a disastrous hack I know).
			// TODO make it possible to combine the items of multiple
			// plugins into a single multi split button.
			pushItem: function (item) {
				multiSplit.addButton(item);
			},
			showItem: function (name) {
				multiSplit.show(name);
			},
			hideItem: function (name) {
				multiSplit.hide(name);
			},
			setActiveItem: function (name) {
				multiSplit.setActiveButton(name);
			}
		};
	}

	return MultiSplitButton;
});
