define([
	"jquery",
	"ui/component"
],
function (jQuery, Component) {
	/**
	 * Text component type
	 * @class
	 * @extend {Component}
	 */
	var Text = Component.extend({
		/**
		 * Initializes the text component
		 * @override
		 */
		init: function () {
			this._super();
			this.element = jQuery("<input>")
				.on('change', jQuery.proxy(function (event) {
					this.setValue(event.target.value);
				}, this))
				.on('keyup', jQuery.proxy(function (event) {
					this.updateValue(event.target.value);
				}, this));
		},

		// invoked when the user has changed the value
		/**
		 * Sets the value of the text field
		 *
		 * Note that this method is called on the "change" event,
		 * which is not triggered on every keypress, but only
		 * when the element loses focus or enter is pressed.
		 *
		 * @param {string} value The new value of the text input.
		 */
		setValue: function (value) {},

		/**
		 * The current value of the text component.
		 *
		 * @return {string} The current value of the text component.
		 */
		getValue: function () {
			return this.element.val();
		},

		// invoked every time the input value is changed.
		/**
		 * Sets the value of the text field.
		 *
		 * In contrast to setValue() this function is called, every
		 * time on the "keyup" event, not only on
		 * the "change" event, which is only triggered when enter is
		 * pressed or the element loses focus.
		 *
		 * @param {string} value The new value of the text input.
		 */
		updateValue: function (value) {}
	});

	return Text;
});
