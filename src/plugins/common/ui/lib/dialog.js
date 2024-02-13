define([
	'ui/ui-plugin',
], function (
	UiPlugin
) {
	'use strict';

	// Implementation is in dynamicUi

	return {
		confirm: function(config) {
			return UiPlugin.getActiveSurface().openConfirmDialog(config);
		},
		alert: function(config) {
			return UiPlugin.getActiveSurface().openAlertDialog(config)
		},
	};
});
