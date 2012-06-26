define([
	'aloha/core',
	'jquery',
	'util/class',
	'aloha/console'
], function (Aloha, jQuery, Class, console) {
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

	/**
	 * A hash of all component instances.  Instances are grouped into arrays
	 * which are mapped against their component type name.  Therefore all
	 * components that have are instances of from the "linkButton" component
	 * type, for example, will be put into an array whose key in the hash will
	 * be "linkButton."
	 *
	 * @type {object<string, Array<Component>>}
	 * @private
	 */
	var componentInstances = {};

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
			Component.components[name] = type.extend(settings);
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

			if (!componentInstances[type]) {
				componentInstances[type] = [];
			}

			var instance = new ComponentType();
			componentInstances[type].push(instance);

			return instance;
		},

		eachInstance: function (instanceTypes, forEach) {
			var instances = [];
			var j = instanceTypes.length;
			while (j) {
				if (componentInstances[instanceTypes[--j]]) {
					instances = instances.concat(
						componentInstances[instanceTypes[j]]);
				}
			}
			j = instances.length;
			while (j) {
				if (false === forEach(instances[--j])) {
					return;
				}
			}
		},

		getGlobalInstance: function (name) {
			return this.render(name, Aloha.activeEditable);
		}
	});

	return Component;
});
