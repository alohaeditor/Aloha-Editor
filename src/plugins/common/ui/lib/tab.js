/**
 * Defines a `Tab` Class that extends `Container`.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'ui/container',
	'ui/component',
], function( Aloha, jQuery, Container, Component ) {
	'use strict';

	var uid = 0;

	/**
	 * `Tab` defines a Container object that represents a collection
	 * of related component groups to be rendered together on the toolbar.
	 * Tabs are organized by feature and functionality so that related controls
	 * can be brought in and out of view depending on whether they are
	 * appropriate for a given user context.
	 *
	 * Tabs can be defined declaritivly in the Aloha configuration in the
	 * following manner:

	   Aloha.settings.toolbar: [
			{
				label: 'Lists',
				showOn: 'ul,ol,*.parent(.aloha-editable ul,.aloha-editable ol)',
				components: [ [ 'orderedList', 'unorderedList' ] ]
			}
	   ]

	 * Alternatively, tabs can also be created imperatively in this way:
	 * `new Tab( options, components )`.
	 * @class
	 * @extends {Container}
	 */
	var Tab = Container.extend({

		/**
		 * All that this constructor does is save the `components` array into a
		 * local variable, to be used during instantialization.
		 * @param {object<string, *>} settings
		 * @param {Array.<Array<string>>} components
		 * @constructor
		 * @override
		 */
		_constructor: function( settings, components ) {
			this._super( settings, components );
			var editable = this.editable;

			this.container = settings.container;
			this.list = this.container.data( "list" );
			this.panels = this.container.data( "panels" );
			this.index = editable.tabs.length;
			this.id = "tab-container-" + (uid++);

			var panel = this.panel = jQuery( '<div>', { id : this.id } );
			var handle = this.handle = jQuery( '<li><a href="#' + this.id
				+ '">' + settings.label + '</a></li>' );

			jQuery.each( components, function() {
				var group = jQuery( '<div>', {
					'class': 'aloha-toolbar-group'
				}).appendTo( panel );

				// <a id="render-components"></a>
				// For each control, we render a new instance and append it to
				// the group.
				jQuery.each( this, function() {
					var component = Component.render( this, editable );
					group.append( component.element );
				});
			});

			handle.appendTo( this.list );
			panel.appendTo( this.panels );
			this.container.tabs( "refresh" );
		},

		/**
		 * Make this tab accessible on its surface element.
		 * @override
		 */
		show: function() {
			var tabs = this.list.children();

			if ( tabs.length == 0 ) {
				return;
			}

			this.handle.show();
			this.visible = true;

			// If no tabs are selected, then select the tab which was just
			// shown.
			if ( this.container.find( '.ui-tabs-active' ).length == 0 ) {
				this.container.tabs( 'select', this.index );
			} else if ( this.container.tabs( 'option', 'selected' )
			            == this.index ) {
				this.container.tabs( 'select', this.index );
			}
		},

		/**
		 * Make this tab disappear.
		 * @override
		 */
		hide: function() {
			var tabs = this.list.children();

			if ( tabs.length == 0 ) {
				return;
			}

			this.handle.hide();
			this.visible = false;

			// If the tab we just hid was the selected tab, then we need to
			// select another tab in its stead.  We select the first visible
			// tab we find, or else we deselect all tabs.
			if ( this.index == this.container.tabs( 'option', 'selected' ) ) {
				tabs = this.editable.tabs;

				for ( var i = 0; i < tabs.length; ++i ) {
					if ( tabs[i].visible ) {
						this.container.tabs( 'select', i );
						return;
					}
				}

				// This does not work...
				// this.container.tabs( 'select', -1 );

				this.handle.removeClass( 'ui-tabs-active' );
			}
		}
	});

	jQuery.extend( Tab, {
		/**
		 * Creates holding elements for jQuery UI Tabs for a surface.
		 * @static
		 * @return {jQuery<HTMLElement>} The holder container onwhich we invoke
		 *                               jQuery UI Tabs once it is populated with
		 *                               tab containers.
		 */
		createContainer: function() {
			var container = jQuery( "<div>" ),
				list = jQuery( "<ul>" ).appendTo( container ),
				panels = jQuery( "<div>" ).appendTo( container );

			return container
				.data( "list", list )
				.data( "panels", panels )
				.tabs();
		}
	});

	return Tab;
});
