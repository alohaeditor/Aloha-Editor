/**
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'aloha/core',
	'jquery',
	'ui/component'
], function (Aloha, jQuery, Component) {
	'use strict';

	function setStateAll(type, state) {
		Component.eachInstance([type], function (component) {
			component.setState(state);
		});
	}

	return {
		setStateTrueAll: function (type) {
			setStateAll(type, true);
		},

		setStateFalseAll: function (type) {
			setStateAll(type, false);
		},

		showAll: function (type) {
			Component.eachInstance([type], function (component) {
				component.show();
			});
		},

		hideAll: function (type) {
			Component.eachInstance([type], function (component) {
				component.hide();
			});
		},

		enableAll: function (type) {
			Component.eachInstance([type], function (component) {
				component.enable();
			});
		},

		disableAll: function (type) {
			Component.eachInstance([type], function (component) {
				component.disable();
			});
		},

		getStateOfFirst: function (type) {
			var state;
			var gotState = false;
			Component.eachInstance([type], function (component) {
				if (!gotState) {
					gotState = true;
					state = component.getState();
					return false;
				}
			});
		}
	};
});
