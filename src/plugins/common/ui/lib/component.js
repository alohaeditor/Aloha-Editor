define([
	'aloha/core',
	'jquery',
	'util/class',
	'aloha/console',
	'ui/componentState',
	'PubSub'
], function (Aloha, jQuery, Class, console, ComponentState, PubSub) {
	'use strict';

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

		/**
		 * @type {boolean} Whether or not this component is visible.
		 */
		visible: true,

		/**
		 * @constructor
		 */
		_constructor: function () {
			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			// TODO(p.salema@gentics.com): Consider implementing 'aloha-node-changed'
			// which would be trigger only when the user selection moves from one node
			// into another.
			Aloha.bind('aloha-selection-changed aloha-command-executed',
				jQuery.proxy(function (event, range) {
					this.selectionChange(range);
				}, this));

			this.init();

			var thisComponent = this;
			ComponentState.applyAllStates(thisComponent.type, thisComponent);
			PubSub.sub('aloha-ui-component-state-change.' + thisComponent.type, function(message){
				ComponentState.applyState(thisComponent.type, message.state, thisComponent);
			});
		},

		/**
		 * Initializes this component.  To be implemented in subclasses.
		 */
		init: function () {},

		/**
		 * Shows this component.
		 */
		show: function () {
			if (!this.visible) {
				this.element.show();
			}
			this.visible = true;
		},

		/**
		 * Hides this component.
		 */
		hide: function () {
			if (this.visible) {
				this.element.hide();
			}
			this.visible = false;
		},

		/**
		 * Selection change callback.
		 * Usually overridden by the component implementation or the settings
		 * that are passed to the constructor at instantialization.
		 */
		selectionChange: function () {
			//console.log('selectionChange()');
		}

	});

	// Static fields.

	jQuery.extend(Component, {

		/**
		 * @type {object<string, Component>} A hash map of all defined
		 *                                   components types, mapping the
		 *                                   names of component type against
		 *                                   their corresponding constructors.
		 */
		components: {},

		/**
		 * Defines a component type.
		 *
		 * @param {string} name The unique name of the Component type.
		 * @param {Component} type An existing Component type to inherit from.
		 * @param {object} settings Properties and methods which, along with
		 *                          the inherited properties, will constitues
		 *                          a new component type.
		 * @return {Component} A generated Component sub class.
		 */
		define: function (name, type, settings) {
			var extendedType = type.extend(settings);
			extendedType.prototype.type = name;
			Component.components[name] = extendedType;
			return Component.components[name];
		},

		/**
		 * Renders a component of the given type.
		 *
		 * It is here that component instances are instantiated.
		 *
		 * @param {string} type The name of the component type we want to
		 *                      (initialize if needed and) render.
		 * @return {Component} An instance of the component of the given type.
		 */
		render: function (type) {
			var ComponentType = Component.components[type];
			if (!ComponentType) {
				console.warn('Component type "' + type + '" is not defined.');
				return null;
			}
			return new ComponentType();
		}
	});

	return Component;
});
