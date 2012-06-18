define([
	'aloha/jquery',
	'ui/surface',
	'ui/tab',
	'ui/subguarded',
	'ui/floating',
	'aloha/jquery-ui'
],
function( jQuery, Surface, Tab, subguarded, floatSurface ) {

	/**
	 * The toolbar is configured via `settings.toolbar` and is defined as an
	 * array of tabs with component groups, where the groups are arrays of
	 * controls.
	 *
	 * There are separate components for each editable, but only the components
	 * for the active editable are shown.
	 *
	 * As a container for tabs, the toolbar serves to group together groups of
	 * control components so that they can be shown and hidden together in
	 * their feature/functional set.  For exmaple groups of table controls
	 * would be placed in a table tab, groups of list controls in an image tab,
	 * and so forth.
	 *
	 * Toolbar class and manager
	 *
	 * @class
	 * @extends {Surface}
	 */
	var Toolbar = Surface.extend({

		/**
		 * Toolbar constructor.
		 *
		 * @param {Aloha.Editable} editable
		 * @constructor
		 * @override
		 */
		_constructor: function( editable ) {
			this._super( editable );

			// All containers are rendered in a div specific to the editable to
			// make it easy to show and hide the toolbar containers on
			// activate/deactivate.  The editable instance gets a reference to
			// this div.

			this.$element = jQuery( '<div>', { 'class': 'aloha-ui-toolbar' });
			editable.toolbar = this.$element;
			var settings;
			var tabs = editable.settings.toolbar;
			var container = Tab.createContainer().appendTo( editable.toolbar );
			var i;
			for ( i = 0; i < tabs.length; i++ ) {
				settings = tabs[ i ];
				new Tab( {
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable,
					container: container
				}, settings.components );
			}

			this.initializeFloating();
			this.initializeDragging();
		},

		initializeFloating: function() {
			var surface = this;

			this.$element.css( 'position', 'absolute' );
			this.$element.draggable();

			subguarded( [
				'aloha-selection-changed',
				'aloha-editable-activated'
			], Surface.onActivatedSurface,
				this, function( $event, range, event ) {
				if ( Aloha.activeEditable ) {
					floatSurface( surface, Aloha.activeEditable );
				}
			} );

			var isScrolling = false;
			jQuery( window ).scroll( function( $event, nativeEvent ) {
				// @TODO only do this for active surfaces.
				if ( !isScrolling ) {
					isScrolling = true;
					setTimeout( function () {
						isScrolling = false;
						if ( Aloha.activeEditable ) {
							floatSurface( surface, Aloha.activeEditable );
						}
					}, 50 );
				}
			});
		},

		initializeDragging: function() {

		},

		enableFloating: function() {
			
		},

		disableFloating: function() {

		},

		/**
		 * Shows the toolbar
		 */
		show: function() {
			// We hide any active controls and show this editable's controls.
			Toolbar.element.children().detach();
			Toolbar.element.append( this.editable.toolbar );
			Toolbar.element.stop().fadeTo( 200, 1 );
		},

		/**
		 * Hides the toolbar
		 */
		hide: function() {
			var toolbar = this;
			Toolbar.element.stop().fadeOut( 200, function() {
				toolbar.editable.toolbar.detach();
			});
		}
	});

	jQuery.extend( Toolbar, {
		/**
		 * Initializes the toolbar manager
		 */
		init: function() {
			Toolbar.element = jQuery( '<div>', {
				'class': 'aloha-surface aloha-toolbar'
			}).hide().appendTo( 'body' );
			Surface.trackRange( Toolbar.element );
		},

		/**
		 * Creates a toolbar for an editable.
		 *
		 * @param {Aloha.Editable} editable
		 * @returns {Toolbar}
		 */
		createSurface: function( editable ) {
			if ( editable.settings.toolbar &&
			     editable.settings.toolbar.length ) {
				return new Toolbar( editable );
			}
			return null;
		},

		/**
		 * @param name
		 *        The name of a component that exists in the tab that should be activated.
		 */
		activateTabOfButton: function(name) {
			// TODO
		},

		// Only added so that the calls that originally went to
		// FloatingMenu.* can be preserved for the time being. When it
		// is clear that the calls can be safely removed from
		// the plugins, these methods can be removed as well.
		setScope: function(scope) { },
		createScope: function(scope, extendsScope) {}
	});

	Toolbar.init();
	Surface.registerType( Toolbar );

	return Toolbar;
});
