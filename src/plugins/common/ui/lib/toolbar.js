define([
	'jquery',
	'ui/surface',
	'ui/tab',
	'ui/subguarded',
	'ui/floating',
	'aloha/jquery-ui'
],
function(jQuery, Surface, Tab, subguarded, floating) {

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

		isFloating: false,
		_tabs: [],

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
				this._tabs.push(new Tab({
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable,
					container: container
				}, settings.components));
			}

			this.initializeFloating();
			this.initializeDragging();
		},

		initializeFloating: function() {
			// TODO: read cookie
			this.isFloating = true;

			var surface = this;

			this.$element.css({
				'position': 'absolute',
				'z-index': 9999
			});

			subguarded([
				'aloha-selection-changed',
				'aloha-editable-activated'
			], Surface.onActivatedSurface,
				this, function($event, range, event) {
				if (Aloha.activeEditable) {
					floating.floatSurface(surface, Aloha.activeEditable);
				}
			});

			var isScrolling = false;
			jQuery(window).scroll(function($event, nativeEvent) {
				// @TODO only do this for active surfaces.
				if (!isScrolling) {
					isScrolling = true;
					setTimeout(function () {
						isScrolling = false;
						if (Aloha.activeEditable) {
							floating.floatSurface(surface, Aloha.activeEditable);
						}
					}, 50);
				}
			});

			var $pin = jQuery('<div class="aloha-ui-pin">');
			$pin.click(function () {
				surface.isFloating = !surface.isFloating;

				if (surface.isFloating) {
					$pin.removeClass('aloha-ui-pin-down');
				} else {
					$pin.addClass('aloha-ui-pin-down');
				}

				floating.togglePinSurface(surface, Aloha.activeEditable);
			});
			this.$element.find('.ui-tabs:first').append($pin);
		},

		initializeDragging: function () {
			this.$element.draggable({
				'distance': 20
			});
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
		}
	});

	Toolbar.init();
	Surface.registerType( Toolbar );

	return Toolbar;
});
