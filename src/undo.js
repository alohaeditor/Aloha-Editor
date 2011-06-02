/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Undo = new GENTICS.Aloha.Plugin('undo');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Undo.languages = ['en', 'de'];

/**
 * Initialize the plugin and set initialize flag on true
 */
GENTICS.Aloha.Undo.init = function () {

	var stack = new Undo.Stack(),
		EditCommand = Undo.Command.extend({
			constructor: function(editable, oldValue) {
				this.editable = editable;
				this.oldValue = oldValue;
				this.newValue = editable.getContents();
			},
			execute: function() {
			},
			undo: function() {
				this.reset(this.oldValue);
			},

			redo: function() {
				this.reset(this.newValue);
			},
			reset: function(val) {
				this.editable.blur();
				this.editable.obj.html(val);
				this.editable.activate();
				// restore selection
			}
		});

		stack.changed = function() {
			// update UI
		};

		$(document).keydown(function(event) {
			if (!event.metaKey || event.keyCode != 90) {
				return;
			}
			event.preventDefault();
			if (event.shiftKey) {
				stack.canRedo() && stack.redo();
			} else {
				stack.canUndo() && stack.undo();
			}
		});


	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'smartContentChanged', function(jevent, aevent) {

		// workaround because on redo the editable must be blured.
		if ( aevent.triggerType != 'blur') stack.execute( new EditCommand( aevent.editable, aevent.snapshotContent) );

	});


};

/**
* toString method
* @return string
*/
GENTICS.Aloha.Undo.toString = function () {
	return 'undo';
};
