/**
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'aloha/core',
	'jquery',
	'ui/component',
	'ui/componentState'
], function (Aloha, jQuery, Component, ComponentState) {
	'use strict';

	// TODO merge this api with componentState
	return {
		setStateTrueAll: function (type) {
			ComponentState.setState(type, 'state', true);
		},

		setStateFalseAll: function (type) {
			ComponentState.setState(type, 'state', false);
		},

		showAll: function (type) {
			ComponentState.setState(type, 'show', true);
		},

		hideAll: function (type) {
			ComponentState.setState(type, 'show', false);
		},

		enableAll: function (type) {
			ComponentState.setState(type, 'enable', true);
		},

		disableAll: function (type) {
			ComponentState.setState(type, 'enable', false);
		},

		getStateOfFirst: function (type) {
			return ComponentState.getState(type, 'state');
		},

		togglePin: function(pinned) {
			// TODO I don't know what this method is supposed to do
		}
	};
});
