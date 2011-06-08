/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

(function(window, undefined){
	"use strict";
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;

	var dmp = new diff_match_patch;

	function reversePatch(patch) {
		var reversed = dmp.patch_deepCopy(patch);
		for (var i = 0; i < reversed.length; i++) {
			for (var j = 0; j < reversed[i].diffs.length; j++) {
				if (reversed[i].diffs[j][0] != 0) {
					reversed[i].diffs[j][0] = -(reversed[i].diffs[j][0]);
				}
			}
		}
		return reversed;
	}

	/**
	 * register the plugin with unique name
     */
	Aloha.Undo = new (Aloha.Plugin.extend({
		_constructor: function(){
			this._super('undo');
		},

		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de'],

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			var stack = new Undo.Stack(),
			    EditCommand = Undo.Command.extend({
					constructor: function(editable, patch) {
						this.editable = editable;
						this.patch = patch;
					},
					execute: function() {
					},
					undo: function() {
						var contents = this.editable.getContents(),
						    applied = dmp.patch_apply(reversePatch(this.patch), contents),
						    oldValue = applied[0];
						this.reset(oldValue);
					},
					redo: function() {
						var contents = this.editable.getContents(),
						    applied = dmp.patch_apply(this.patch, contents),
						    newValue = applied[0];
						this.reset(newValue);
					},
					reset: function(val) {
						var reactivate = null;
						if (Aloha.getActiveEditable() === this.editable) {
							Aloha.deactivateEditable();
							reactivate = this.editable;
						}

						this.editable.obj.html(val);

						if (null !== reactivate) {
							reactivate.activate();
						}
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

			Aloha.bind('alohaSmartContentChanged', function(jevent, aevent) {
				// workaround because on redo the editable must be blured.
				if ( aevent.triggerType != 'blur') {
					// only push an EditCommand if something actually changed.
					var oldValue = aevent.snapshotContent;
					var newValue = aevent.editable.getContents();
					var patch = dmp.patch_make(oldValue, newValue);
					if (0 != patch.length) {
						stack.execute( new EditCommand( aevent.editable, patch ) );
					}
				}
			});
		},

		/**
		 * toString method
		 * @return string
		 */
		toString: function () {
			return 'undo';
		}

	}))();
})(window);
