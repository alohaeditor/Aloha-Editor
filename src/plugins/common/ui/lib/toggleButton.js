define([
	'aloha/jquery',
	'ui/button',
	'aloha/jquery-ui'
],
function( jQuery, Button ) {
	'use strict';

	var idCounter = 0;

	/**
	 * ToggleButton control. Extends the Button component type to provide an
	 * easy way to create buttons that can transition between "checked" and
	 * "unchecked" states.
	 *
	 * @class
	 * @name ToggleButton
	 * @extends {Button}
	 */
	var ToggleButton = Button.extend({

		_checked: false,

		/**
		 * Sets the state of the toggleButton and updates its visual display
		 * accordingly.
		 *
		 * @param {boolean} toggled Whether the button is to be set to the
		 *                          "toggled/checked" state.
		 */
		setState: function( toggled ) {
			this._checked = toggled;
			if (toggled) {
				this.element.addClass("aloha-button-active");
			} else {
				this.element.removeClass("aloha-button-active");
			}
		},

		getState: function() {
			return this._checked;
		},

		_onClick: function() {
			this.setState( ! this._checked );
			this.click();
		}
	});

	return ToggleButton;
});
