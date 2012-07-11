define([
	'aloha/core',
	'jquery',
	'util/class'
], function (Aloha, $, Class) {
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
	var Component = Class.extend({

		id: 0,

		/**
		 * Flag to indicate that this is an instance of a component and  not the class object.
		 */
		isInstance: true,

		/**
		 * The Container instance or null if this component was not
		 * adopted by a counter by calling Component.adopt().
		 */
		container: null,

		/**
		 * Will be set in Component.define()
		 */
		type: null,

		/**
		 * @type {boolean} Whether or not this component is visible.
		 */
		visible: true,

		/**
		 * The type property is set in Component.define(), so components should only ever be instantiated through define.
		 * @constructor
		 */
		_constructor: function() {
			this.id = idCounter++;

			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			// TODO(p.salema@gentics.com): Consider implementing 'aloha-node-changed'
			// which would be trigger only when the user selection moves from one node
			// into another.
			Aloha.bind('aloha-selection-changed aloha-command-executed',
				$.proxy(function (event, range) {
					this.selectionChange(range);
				}, this));

			this.init();
		},

		adopt: function(container) {
			this.container = container;
		},

		/**
		 * Initializes this component.  To be implemented in subclasses.
		 */
		init: function() {},

		isVisible: function() {
			return this.visible;
		},

		/**
		 * Shows this component.
		 */
		show: function(show_opt) {
			if (false === show_opt) {
				this.hide();
				return;
			} 
			// Only call container.childVisible if we switch from hidden to visible
			if (!this.visible) {
				this.visible = true;
				this.element.show();
				if (this.container) {
					this.container.childVisible(this);
				}
			}
		},

		/**
		 * Hides this component.
		 */
		hide: function() {
			// Only call container.childVisible if we switch from visible to hidden
			if (this.visible) {
				this.visible = false;
				this.element.hide();
				if (this.container) {
					this.container.childHidden(this);
				}
			}
		},

		focus: function() {
			// First the container element must be visible before a
			// descendant element can be focused. In the case of a
			// toolbar with tabs this means that the tab must be brought
			// into view.
			if (this.container) {
				this.container.childFocus(this);
			}
			this.element.focus();
		},

		enable: function(enable_opt){},
		disable: function(){},

		/**
		 * Selection change callback.
		 * Usually overridden by the component implementation or the settings
		 * that are passed to the constructor at instantialization.
		 */
		selectionChange: function () {
		}

	});

	return Component;
});
