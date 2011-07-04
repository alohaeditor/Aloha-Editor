/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(['core/observable'],
function(Observable) {
	"use strict";

	var
		jQuery = window.alohaQuery || window.jQuery, $ = jQuery,
		Aloha = window.Aloha;

	return Class.extend(Observable, {
		
		_$input: null,

		render: function() {
			var that = this;
			this._$input = $('<input type="text" />');
			this._$input.change(function() {
				// TODO: trigger this event only if validation successful.
				that.trigger('change', that.getValue());
			});

			return this._$input;
		},

		getValue: function() {
			return this._$input.val();
		},

		/**
		 * We do not throw any change event here, as we need to break the loop "Block" -> "Editor" -> "Block"
		 */
		setValue: function(value) {
			this._$input.val(value);
		},

		destroy: function() {
			this._$input.remove();
			this._$input = null;
		}
	});
});