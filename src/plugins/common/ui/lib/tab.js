/**
 * Defines a `Tab` Class that extends Aloha.ui's `Container`.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'ui/ui',
	'ui/container'
], function( Aloha, jQuery, Ui, Container ) {
	'use strict';

	var uid = 0;

	/**
	 * Classname constants...
	 * @type {string}
	 */

	 // Classname constants.  Will be exposed as static variables in the Tab
	 // class.
	 // @type {string}
	var CONTAINER_CLASS = 'aloha-ui-tabs-container';
	var HANDLES_CLASS = 'aloha-ui-tabs-handles';
	var PANELS_CLASS = 'aloha-ui-tabs-panels';

	/**
	 * `Tab` defines a Aloha.Ui.Container object that represents a collection
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
	 * @extends {Aloha.ui Container}
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
			var editable = this.editable = settings.editable;

			this.container = editable.toolbar.find( '.' + CONTAINER_CLASS );

			this.index = editable.tabs.length;

			this.id = "tab-container-" + (uid++);
			var panel = this.panel = jQuery( '<div>', { id : this.id } );

			var handle = this.handle = jQuery( '<li><a href="#' + this.id
				+ '">' + settings.label + '</a></li>' );

			if ( components ) {
				jQuery.each( components, function() {
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
			}

			handle.appendTo( this.container.find( 'ul.' + HANDLES_CLASS ) );
			panel.appendTo( this.container.find( '.' + PANELS_CLASS ) );
		},

		/**
		 * Make this tab accessible on its surface element.
		 * @override
		 */
		show: function() {
			var tabs = this.container.find( 'ul.' + HANDLES_CLASS + '>li' );

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
			var tabs = this.container.find( 'ul.' + HANDLES_CLASS + '>li' );

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

	/**
	 * Creates holding elements for jQuery UI Tabs for a surface.
	 * @static
	 * @return {jQuery<HTMLElement>} The holder container onwhich we invoke
	 *                               jQuery UI Tabs once it is populated with
	 *                               tab containers.
	 */
	Tab.createContainer = function() {
		var container_holder = jQuery( '<div>', {
			'class': CONTAINER_CLASS
		});

		jQuery( '<ul>', { 'class': HANDLES_CLASS } )
			.appendTo( container_holder );

		jQuery( '<div>', { 'class': PANELS_CLASS } )
			.appendTo( container_holder );

		return container_holder;
	};

	Tab.CONTAINER_CLASS = CONTAINER_CLASS;
	Tab.HANDLES_CLASS = HANDLES_CLASS;
	Tab.PANELS_CLASS = PANELS_CLASS;

	return Tab;
});
