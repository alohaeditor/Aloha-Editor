/**
 * Define a `Tab` Class that extends Aloha.ui.Container.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'ui/ui'
], function( Aloha, jQuery, Ui ) {
	'use strict';

	/**
	 * Classname constants...
	 * @type {string}
	 */

	Ui.TABS_CONTAINER_CLASS = 'aloha-ui-tabs-container';
	Ui.HANDLES_CONTAINER_CLASS = 'aloha-ui-tabs-handles';
	Ui.PANELS_CONTAINER_CLASS = 'aloha-ui-tabs-panels';

	// Used to store a local, and temporary copy of the components setting
	// passed to the Tab constructor and needed during initialization.
	var components_settings;

	/**
	 * `Tab` defines an object that represents a collection
	 * of related component groups to be rendered together on the toolbar. Tabs
	 * are organized by feature and functionality so that related controls can
	 * be brought in and out of view depending on whether they are appropriate
	 * for a given user context.
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
	 * `new Tab( options, editable )`.
	 */
	var Tab = Aloha.ui.Container.extend({

		/**
		 * All that this constructor does save the components array into a
		 * local variable, to be used during instantialization.
		 * @param {object<string, *>} settings
		 * @param {Array.<Array<string>>} components
		 * @constructor
		 */
		_constructor: function( settings, components ) {
			components_settings = components;
			this._super( settings );
		},

		/**
		 * Initialze this tab instance.
		 */
		init: function() {
			this._super();

			if ( !components_settings ) {
				return;
			}

			var editable = this.editable;

			this.container = editable.toolbar.find( '.' + Ui.TABS_CONTAINER_CLASS );

			// console.assert( this.container.length === 1 )

			this.index = editable.tabs.length;

			this.handle = jQuery( '<li><a href="#' + this.uid + '">'
				+ this.label + '</a></li>' );

			var panel = this.panel = jQuery( '<div>', { id : this.uid } );

			jQuery.each( components_settings, function() {
				var group = jQuery( '<div>', {
					'class': 'aloha-toolbar-group'
				}).appendTo( panel );

				// <a id="render-components"></a>
				// For each control, we render a new instance and append it to
				// the group.
				jQuery.each( this, function() {
					var component = Aloha.ui.render( this, editable );
					group.append( component.element );
				});
			});

			this.handle.appendTo( this.container.find(
				'ul.' + Ui.HANDLES_CONTAINER_CLASS )).hide();

			this.panel.appendTo( this.container.find(
				'.' + Ui.PANELS_CONTAINER_CLASS )).hide();
		},

		/**
		 * Make this tab accessible on its surface element.
		 * @override
		 */
		show: function() {
			var tabs = this.container.find( 'ul.' + Ui.HANDLES_CONTAINER_CLASS + '>li' );

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
			var tabs = this.container.find( 'ul.' + Ui.HANDLES_CONTAINER_CLASS + '>li' );

			if ( tabs.length == 0 ) {
				return;
			}

			this.handle.hide();
			this.visible = false;

			// If the tab we just hid was the selected tab, then we need to
			// select another tab in its stead. We select the first visible
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

	return Tab;
});
