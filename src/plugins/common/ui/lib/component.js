// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([
	"aloha/core",
	"aloha/jquery",
	"util/class",
],
function( Aloha, jQuery, Class ) {
	// All components inherit from `Component`.
	var Component = Class.extend({
		visible: true,

		_constructor: function( editable, settings ) {
			this.editable = editable;
			var init = settings.init;
			delete settings.init;
			jQuery.extend( this, settings );

			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			// TODO(p.salema@gentics.com): Consider implementing "aloha-node-changed'
			// which would be trigger only when the user selection moves from one node
			// into another.
			Aloha.bind( "aloha-selection-changed aloha-command-executed", jQuery.proxy( function( event, range ) {
				this.selectionChange( range );
			}, this ) );

			this.init();
			if ( init ) {
				init.call( this );
			}
		},

		init: function() {},

		show: function() {
			if ( !this.visible ) {
				this.element.show();
			}
			this.visible = true;
		},

		hide: function() {
			if ( this.visible ) {
				this.element.hide();
			}
			this.visible = false;
		},

		// usually overridden by the component or the settings
		selectionChange: function() {}
	});

	jQuery.extend( Component, {
		components: {},

		define: function( name, type, settings ) {
			Component.components[ name ] = {
				type: type,
				settings: settings
			};
			return settings;
		},

		render: function( name, editable ) {
			var component = Component.components[ name ];
			return new component.type( editable, component.settings );
		}
	});

	return Component;
});
