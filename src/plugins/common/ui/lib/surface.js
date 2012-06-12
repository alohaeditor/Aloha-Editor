define([
	'aloha/core',
	'aloha/jquery',
	'util/class',
	'ui/container'
],
function( Aloha, jQuery, Class, Container ) {
	'use strict';

	/**
	 * The Surface class and manager.
	 *
	 * @class
	 * @base
	 */
	var Surface = Class.extend({

		/**
		 * Surface constructor.
		 *
		 * @param {Aloha.Editable} editable The editable to which this surface
		 *                                  is bound to for the duration of its
		 *                                  lifetime.
		 * @constructor
		 */
		_constructor: function( editable ) {
			this.editable = editable;
		}

	});

	// Static fields for the Surface class.

	jQuery.extend( Surface, {

		/**
		 * The editable that is currently active.  The components that belong
		 * to this surface will interact with this surface.
		 *
		 * @static
		 * @type {Aloha.Editable}
		 */
		active: null,

		/**
		 * The range of the current selection.
		 * 
		 * Interacting with a surface removes focus from the editable, so the
		 * surface is responsible for keeping track of the range that should be
		 * modified by the components.
		 * 
		 * @static
		 * @type {Aloha.Selection}
		 */
		range: null,

		/**
		 * List of surface types.  Each type must extend Surface.
		 *
		 * @static
		 * @type {Array.<Surface>}
		 */
		Types: [],

		/**
		 * Initializes the surface manager.
		 *
		 * @static
		 */
		init: function() {
			// When an editable is activated, we show its associated surfaces.
			Aloha.bind( 'aloha-editable-activated', function( event, alohaEvent ) {
				Surface.active = alohaEvent.editable;
				Surface.show( alohaEvent.editable );

				// The range isn't set until after the activated event and
				// selection-changed doesn't fire on activation.  So we
				// "yeild."
				setTimeout( function() {
					Container.showContainers( Surface.active,
						Aloha.getSelection().getRangeAt( 0 ) );
				}, 1 );
			});

			// When an editable is deactivated, we hide its associated surfaces.
			Aloha.bind( 'aloha-editable-deactivated', function( event, alohaEvent ) {
				// TODO: handle a click on a surface, then a click outside
				if ( !Surface.suppressHide ) {
					Surface.hide( alohaEvent.editable );
					Surface.active = null;
				}
			});

			// When the selection changes, toggle the appropriate containers
			// for each active surface.
			// TODO: Is there a more reliable alternative to
			//       `range.markupEffectiveAtStart`? It seems that it needs to
			//       be fixed. There are times when you would click in the
			//       editable and the `markupEffectiveAtStart` array will have
			//       "incorrect" elements--that is, not the element or parents
			//       of the element you clicked on.
			Aloha.bind( 'aloha-selection-changed', function( event, range ) {
				if ( Surface.active ) {
					Container.showContainers( Surface.active, range );
				}
			});

			// When a special selection event is triggered (for example table
			// selection changed), toggle the appropriate containers.
			Aloha.bind( 'aloha-special-selection-changed',
				function( event, elements, selectionType ) {
					if ( Surface.active ) {
						Container.showContainersForContext( Surface.active,
							elements, selectionType );
					}
				});
		},

		/**
		 * Shows all surfaces for a given editable.
		 *
		 * @param {Aloha.Editable} editable.
		 */
		show: function( editable ) {
			// If this is the first time we're showing the surfaces for this
			// editable, then we need to initialize the surfaces first.
			if ( !editable.surfaces ) {
				Surface.initialize( editable );
			}

			jQuery.each( editable.surfaces, function( i, surface ) {
				surface.show();
			});
		},

		/**
		 * Hides all surfaces for a given editable.
		 *
		 * @param {Aloha.Editable} editable
		 */
		hide: function( editable ) {
			jQuery.each( editable.surfaces, function( i, surface ) {
				surface.hide();
			});
		},

		/**
		 * Initializes all surfaces for an editable.
		 * @todo Rename to initialize
		 *
		 * @param {Aloha.Editable} editable
		 */
		initialize: function( editable ) {
			editable.surfaces = [];
			jQuery.each( Surface.Types, function( i, Type ) {
				var surface = Type.createSurface( editable );
				if ( surface ) {
					editable.surfaces.push( surface );
				}
			});
		},

		/**
		 * Registers a new surface type.
		 *
		 * @param {Surface} surface
		 */
		registerType: function( surface ) {
			Surface.Types.push( surface );
		},

		/**
		 * Track editable and range when interacting with a surface.
		 *
		 * @param {jQuery<HTMLElement>} element A component or surface for
		 *                                      which we wish to keep track of
		 *                                      the current selection range
		 *                                      when the user interacts with
		 *                                      it.
		 */
		trackRange: function( element ) {
			element.bind( 'mousedown', function(e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = true;
				Surface.suppressHide = true;

				if ( Aloha.activeEditable ) {
					Surface.range = Aloha.getSelection().getRangeAt( 0 );
					// TODO: this overlaps with Surface.active
					Surface.editable = Aloha.activeEditable;
				}
			});
			
			element.bind( 'mouseup', function(e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = false;
				Surface.suppressHide = false;
			});
		}

	});

	Surface.init();

	return Surface;
});
