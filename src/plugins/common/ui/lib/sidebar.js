define([
	"aloha/jquery",
	"ui/surface",
	"ui/panel"
], function( jQuery, Surface, Panel ) {
	var Sidebar = Surface.extend({
		_constructor: function( editable ) {
			this._super( editable );

			editable.sidebar = jQuery( "<div>", {
				"class": "aloha-sidebar-wrap"
			});

			jQuery.each( editable.settings.sidebar, function() {
				var panel = new Panel({
					label: this.label,
					editable: editable,
					showOn: this.showOn
				}, this.components );
				editable.sidebar.append( panel.element );
			});
		},

		show: function() {
			// We hide any active controls and show this editable's controls.
			Sidebar.element.children().detach();
			Sidebar.element.append( this.editable.sidebar );
			Sidebar.element.stop().fadeTo( 200, 1 );
		},

		hide: function() {
			var editable = this.editable;
			Sidebar.element.stop().fadeOut( 200, function() {
				editable.sidebar.detach();
			});
		}
	});

	jQuery.extend( Sidebar, {
		init: function() {
			Sidebar.element = jQuery( "<div>", {
				"class": "aloha-surface aloha-sidebar"
			})
			.hide()
			.appendTo( "body" );

			Surface.trackRange( Sidebar.element );
		},

		createSurface: function( editable ) {
			if ( editable.settings.sidebar && editable.settings.sidebar.length ) {
				return new Sidebar( editable );
			}
			return null;
		}
	});

	Sidebar.init();
	Surface.registerType( Sidebar );

	return Sidebar;
});
