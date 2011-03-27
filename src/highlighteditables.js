/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

GENTICS.Aloha.HighlightEditables = new GENTICS.Aloha.Plugin('highlighteditables');

/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.HighlightEditables.init = function () {

	// remember refernce to this class for callback
	var that = this;

	// highlight editables as long as the mouse is moving
	GENTICS.Utils.Position.addMouseMoveCallback(function () {
		for ( var i = 0; i < GENTICS.Aloha.editables.length; i++) {
			var editable = GENTICS.Aloha.editables[i];
			if (!GENTICS.Aloha.activeEditable && !editable.isDisabled()) {
				editable.obj.addClass('GENTICS_editable_highlight');
			}
		}
	});

	// fade editable borders when mouse stops moving
	GENTICS.Utils.Position.addMouseStopCallback(function () {
		that.fade();
	});

	// mark active Editable with a css class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha,
			"editableActivated",
			function (jEvent, aEvent) {
				aEvent.editable.obj.addClass('GENTICS_editable_active');
				that.fade();
			}
	);

	// remove active Editable ccs class
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha,
			"editableDeactivated",
			function (jEvent, aEvent) {
				aEvent.editable.obj.removeClass('GENTICS_editable_active');
			}
	);

};

/**
 * fades all highlighted editables
 */
GENTICS.Aloha.HighlightEditables.fade = function () {
	for ( var i = 0; i < GENTICS.Aloha.editables.length; i++) {
		var editable = GENTICS.Aloha.editables[i].obj;
		if (editable.hasClass('GENTICS_editable_highlight')) {
			editable.removeClass('GENTICS_editable_highlight')
				.css('outline', '5px solid #FFE767')
				.animate({
					outlineWidth : '0px'
				}, 300, 'swing', function () {
					jQuery(this).css('outline', '');
				});
		}
	}
};
