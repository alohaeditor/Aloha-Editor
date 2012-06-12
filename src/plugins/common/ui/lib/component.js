define([
	'aloha/core',
	'aloha/jquery',
	'util/class',
],
function( Aloha, jQuery, Class ) {
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
		 * @param {Aloha.Editable} editable The editable to which this
		 *                                  component will interact with for
		 *                                  the extent of its lifetime.
		 * @constructor
		 */
		_constructor: function( editable ) {
			this.editable = editable;

			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			// TODO(p.salema@gentics.com): Consider implementing 'aloha-node-changed'
			// which would be trigger only when the user selection moves from one node
			// into another.
			Aloha.bind( 'aloha-selection-changed aloha-command-executed',
				jQuery.proxy( function( event, range ) {
					this.selectionChange( range );
				}, this ) );

			this.init();
		},

		/**
		 * Initializes this component.  To be implemented in subclasses.
		 */
		init: function() {},

		/**
		 * Shows this component.
		 */
		show: function() {
			if ( !this.visible ) {
				this.element.show();
			}
			this.visible = true;
		},

		/**
		 * Hides this component.
		 */
		hide: function() {
			if ( this.visible ) {
				this.element.hide();
			}
			this.visible = false;
		},

		/**
		 * Selection change callback.
		 * Usually overridden by the component implementation or the settings
		 * that are passed to the constructor at instantialization.
		 */
		selectionChange: function() {
			console.log('selectionChange()');	
		}

	});

	// Static fields.

	jQuery.extend( Component, {

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
		define: function( name, type, settings ) {
			Component.components[ name ] = type.extend( settings );
			return Component.components[ name ];
		},

		/**
		 * Renders a component of the given type, binding the specified
		 * editable to it.
		 *
		 * It is here that component instances are instantiated.
		 *
		 * @param {string} name Name of the component to render.
		 * @param {Aloha.Editable} editable Editable to associate component with.
		 * @return {Component} The component matching the given name.
		 */
		render: function( name, editable ) {
			var ComponentType = Component.components[ name ];
			if ( !ComponentType ) {
				throw new Error( 'Component type "' + name +
					'" is not defined.' );
			}
			return new ComponentType( editable );
		}

	});

	return Component;
});
