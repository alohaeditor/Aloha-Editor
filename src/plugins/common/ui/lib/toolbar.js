define([
	'aloha/jquery',
	'ui/surface',
	'ui/tab'
], function( jQuery, Surface, Tab ) {

	// The toolbar is configured via `settings.toolbar` and is defined as
	// an array of tabs with component groups, where the groups are arrays of
	// controls.
	//
	// There are separate components for each editable,
	// but only the components for the active editable are shown.
	//
	// As a container for tabs, the toolbar serves to group together groups of
	// control components so that they can be shown and hidden together in their
	// feature/functional set.  For exmaple groups of table controls would be
	// placed in a table tab, groups of list controls in an image tab, and so
	// forth.
	var Toolbar = Surface.extend({
		_constructor: function( editable ) {
			this._super( editable );

			// All containers are rendered in a div specific to the editable to
			// make it easy to show and hide the toolbar containers on
			// activate/deactivate. The editable instance gets a reference to
			// this div.
			editable.toolbar = jQuery( '<div>', {
				'class': 'aloha-toolbar-wrap'
			});

			var settings,
				tabs = editable.settings.toolbar,
				container = Tab.createContainer().appendTo( editable.toolbar ),
				j = tabs.length,
				i = 0;

			for ( ; i < j; ++i ) {
				settings = tabs[i];

				new Tab({
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable,
					container: container
				}, settings.components );
			}
		},

		show: function() {
			// We hide any active controls and show this editable's controls.
			Toolbar.element.children().detach();
			Toolbar.element.append( this.editable.toolbar );
			Toolbar.element.stop().fadeTo( 200, 1 );
		},

		hide: function() {
			var toolbar = this;
			Toolbar.element.stop().fadeOut( 200, function() {
				toolbar.editable.toolbar.detach();
			});
		}
	});

	jQuery.extend( Toolbar, {
		init: function() {
			Toolbar.element = jQuery( "<div>", {
				"class": "aloha-surface aloha-toolbar"
			})
			.hide()
			.appendTo( "body" );

			Surface.trackRange( Toolbar.element );
		},

		createSurface: function( editable ) {
			if ( editable.settings.toolbar && editable.settings.toolbar.length ) {
				return new Toolbar( editable );
			}
			return null;
		}
	});

	Toolbar.init();
	Surface.registerType( Toolbar );

	return Toolbar;
});
