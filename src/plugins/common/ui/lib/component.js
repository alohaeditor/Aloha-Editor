// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([
	"aloha/core",
	"aloha/jquery",
	"util/class",
],
function( Aloha, jQuery, Class ) {
	// All components inherit from `Component`.
	/**
	 * Component class and manager
	 * @class
	 * @base
	 */
	var Component = Class.extend({
		visible: true,

		/**
		 * Component constructor
		 * @param editable {Aloha.Editable}
		 * @constructor
		 */
		_constructor: function( editable ) {
			this.editable = editable;

			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			// TODO(p.salema@gentics.com): Consider implementing "aloha-node-changed'
			// which would be trigger only when the user selection moves from one node
			// into another.
			Aloha.bind( "aloha-selection-changed aloha-command-executed", jQuery.proxy( function( event, range ) {
				this.selectionChange( range );
			}, this ) );

			this.init();
		},

		/**
		 * Initializes the component
		 */
		init: function() {},

		/**
		 * Shows the component
		 */
		show: function() {
			if ( !this.visible ) {
				this.element.show();
			}
			this.visible = true;
		},

		/**
		 * Hides the component
		 */
		hide: function() {
			if ( this.visible ) {
				this.element.hide();
			}
			this.visible = false;
		},

		// usually overridden by the component or the settings
		/**
		 * Event listener for selection change
		 */
		selectionChange: function() {}
	});

	jQuery.extend( Component, {
		/**
		 * List of all defined components
		 * @type {Object.<string, Component>}
		 */
		components: {},

		/**
		 * Defines a component
		 * @param name {string} component name
		 * @param type {Component} component type to inherit from
		 * @param settings {Object} settings to configure component type
		 * @returns {Component} generated component class
		 */
		define: function( name, type, settings ) {
			return Component.components[ name ] = type.extend( settings );
		},

		/**
		 * Renders a component for an editable
		 * @param name {string} name of component to render
		 * @param editable {Aloha.Editable} editable to associate component with
		 * @returns {Component}
		 */
		render: function( name, editable ) {
			var component = Component.components[ name ];
			return new component( editable );
		}
	});

	return Component;
});
