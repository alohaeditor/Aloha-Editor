define([
	"jquery",
	"ui/component"
],
function (jQuery, Component) {
	/**
	 * Input component type
	 * @class
	 * @extend {Component}
	 */
	var Input = Component.extend({
		/**
		 * Initializes the text component
		 * @override
		 */
		init: function () {
			this._super();
			this.element = jQuery("<input>")
				.on('change', jQuery.proxy(function (event) {
					this.touch();
					var value = event.target.value;
					if (typeof this.changeNotify === 'function') {
						this.changeNotify(value);
					}
				}, this))
				.on('keyup', jQuery.proxy(function (event) {
					this.touch();
				}, this));
		},

		/**
		 * Sets the value of the input field
		 *
		 * @param {string} value The new value of the text input.
		 */
		setValue: function (value) {
			this.element.val(value);
		},

		/**
		 * The current value of the text component.
		 *
		 * @return {string} The current value of the text component.
		 */
		getValue: function () {
			return this.element.val();
		},

		enable: function () {
			this.disabled = false;
			this.element.removeAttr('disabled');
		},

		disable: function () {
			this.disabled = true;
			this.element.attr('disabled', 'disabled');
		}
	});

	return Input;
});
