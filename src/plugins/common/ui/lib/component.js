/**
 * @typedef {object} Component
 * @property {number} id Unique numerical ID for this component instance
 * @property {boolean} isInstance Flag to indicate that this is an instance of a component and  not the class object.
 * @property {JQuery} element jQuery ref to the root element of this component.
 * @property {*=} container The Container instance or null if this component was not adopted by a container by calling Component.adopt().
 * @property {string} type The type of the component. Must be defined in classes which extend this class.
 * @property {string} name The name/slot this component is being rendered in. Will set when this component is being adopted.
 * @property {'dropdown' | 'modal' | null} renderContext In which kind of rendering-context this component resides in.
 * This is useful if you want to have different styling or behaviour, depending if it's visible in the regular
 * toolbar/ui, or if it's visible somewhere else.
 * If `null`/not specified, it's the default context, which should be considered the toolbar.
 * @property {boolean} visible Whether or not this component is visible.
 * @property {boolean} disabled Whether this component is disabled and can be interacted with.
 * @property {boolean} touched Whether the user has interacted/changed the value of this component.
 * @property {object | null} validationErrors When this component is being validated, which kind of errors it has.
 * `null` when no errors are present, otherwise a object with potentially multiple validation errors.
 * @property {function(*): void} changeNotify Function to call when the value of the component changes.
 * @property {function(): void} touchNotify Function to call when the user interacted with the component.
 * 
 * @property {function(*): void} adoptParent
 * @property {function(): void} destroy
 * @property {function(): boolean} isVisible
 * @property {function(): boolean} isValid
 * 
 * @property {function(): void} show Shows the component instance. Updates `visible`
 * @property {function(): void} hide Hides the component instance. Updates `visible`
 * @property {function(): void} enable Enables the component instance. Updates `disabled`
 * @property {function(): void} disable Disables the component instance. Updates `disabled`
 * @property {function(): void} touch Marks the component as touched. Updates `touched`. Calls `triggerTouchNotification`.
 * @property {function(): void} untouch Unmarks the component as touched. Updated `touched`.
 * 
 * @property {function(): void} triggerTouchNotification Util function to mark this component as touched and call the `touchNotify` callback.
 * @property {function(): void} triggerChangeNotification Util function which calls the `changeNotify` callback with the `getValue` return value.
 * 
 * @property {function(*): void} setValue Sets the value for this instance.
 * @property {function(): *} getValue Get the value of this instance.
 */

define([
	'jquery',
	'util/class'
], function (
	$,
	Class
) {
	'use strict';

	var idCounter = 0;

	/**
	 * Component class and manager.
	 *
	 * This implementation constitues the base of all UI components (buttons,
	 * and labels).  The `Component' constructor object, with its static
	 * properties and functions, manages all components instances.
	 *
	 * @class
	 * @base
	 */
	var Component = Class.extend(/** @type {Component} */({

		id: 0,
		type: null,
		name: null,

		isInstance: true,
		element: $(),
		container: null,
		renderContext: null,

		visible: true,
		disabled: false,
		touched: false,

		validationErrors: null,
		changeNotify: null,
		touchNotify: null,

		/**
		 * The type property is set in Component.define(), so components should only ever be instantiated through define.
		 * @constructor
		 */
		_constructor: function () {
			this.id = idCounter++;
			this.init();
			$(this.element)[0]._alohaComponent = this;
		},

		adoptParent: function (container) {
			this.container = container;
		},

		destroy: function() {
			this.container = null;
			this.element.remove();
			this.element = $();
		},

		/**
		 * Initializes this component.  To be implemented in subclasses.
		 */
		init: function () {},

		isVisible: function () {
			return this.visible;
		},

		show: function (show_opt) {
			if (false === show_opt) {
				this.hide();
				return;
			}
			// Only call container.childVisible if we switch from hidden to visible
			if (!this.visible) {
				this.visible = true;
				this.element.show();
				if (this.container) {
					this.container.childVisible(this, true);
				}
			}
		},

		hide: function () {
			// Only call container.childVisible if we switch from visible to hidden
			if (this.visible) {
				this.visible = false;
				this.element.hide();
				if (this.container) {
					this.container.childVisible(this, false);
				}
			}
		},

		focus: function () {
			this.element.focus();
			if (this.container) {
				this.container.childFocus(this);
			}
		},

		foreground: function () {
			if (this.container) {
				this.container.childForeground(this);
			}
		},

		enable: function () {
			this.disabled = false;
		},
		disable: function () {
			this.disabled = true;
		},

		touch: function() {
			this.touched = true;
			this.triggerTouchNotification();
		},
		untouched: function() {
			this.touched = false;
		},

		triggerTouchNotification: function() {
			if (typeof this.touchNotify === 'function') {
				this.touchNotify();
			}
		},
		triggerChangeNotification: function() {
			if (typeof this.changeNotify === 'function') {
				this.changeNotify(this.getValue());
			}
		},

		isValid: function() {
			return this.validationErrors == null;
		},

		setValue: function(value) {
			// Needs to be overritten
		},
		getValue: function() {
			return null;
		},
	}));

	return Component;
});
