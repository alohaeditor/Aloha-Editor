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

	var AbstractEditor = Class.extend(Observable, {
		schema: null,

		_constructor: function(schema) {
			this.schema = schema;
		},
		render: function() {
			// Implement in subclass!
		},

		getValue: function() {
			// Implement in subclass!
		},

		/**
		 * We do not throw any change event here, as we need to break the loop "Block" -> "Editor" -> "Block"
		 */
		setValue: function() {
			// Implement in subclass!
		},

		destroy: function() {
			// Implement in subclass!
		},

		/**
		 * On deactivating, we still need to trigger a change event if the value has been modified.
		 */
		_deactivate: function() {
			this.trigger('change', this.getValue());
			this.destroy();
		}
	});

	var AbstractFormElementEditor = AbstractEditor.extend({

		formInputElementDefinition: null,

		_$formInputElement: null,

		render: function() {
			var $wrapper = $('<div class="aloha-block-editor" />');
			var guid = GENTICS.Utils.guid();
			$wrapper.append(this.renderLabel(guid).attr('id', guid));
			$wrapper.append(this.renderFormElement(guid).attr('id', guid));
			return $wrapper;
		},

		renderLabel: function() {
			return $('<label />').html(this.schema.label);
		},

		renderFormElement: function() {
			var that = this;
			this._$formInputElement = $(this.formInputElementDefinition);

			this._$formInputElement.change(function() {
				that.trigger('change', that.getValue());
			});

			return this._$formInputElement;
		},

		getValue: function() {
			return this._$formInputElement.val();
		},

		/**
		 * We do not throw any change event here, as we need to break the loop "Block" -> "Editor" -> "Block"
		 */
		setValue: function(value) {
			this._$formInputElement.val(value);
		},
		destroy: function() {
			this._$formInputElement.remove();
		}

	});

	var StringEditor = AbstractFormElementEditor.extend({
		formInputElementDefinition: '<input type="text" />'
	});

	var NumberEditor = AbstractFormElementEditor.extend({
		formInputElementDefinition: '<input type="range" />'
	});

	return {
		AbstractEditor: AbstractEditor,
		AbstractFormElementEditor: AbstractFormElementEditor,
		StringEditor: StringEditor,
		NumberEditor: NumberEditor
	}
});