define([
	'aloha/core',
	'aloha/jquery',
	'util/class',
	'ui/container'
], function( Aloha, jQuery, Class, Container ) {
	var Surface = Class.extend({
		_constructor: function( editable ) {
			this.editable = editable;
		}
	});

	jQuery.extend( Surface, {
		/**
		 * The currently active editable that the components interact with.
		 * @type {object}
		 */
		active: null,

		/**
		 * The currently active range.
		 * 
		 * Interacting with a surface removes focus from the editable, so the
		 * surface is responsible for keeping track of the range that should
		 * be modified by the components.
		 * 
		 * @type {object}
		 */
		range: null,

		/**
		 * List of surface types.
		 * @type {array}
		 */
		surfaceTypes: [],

		init: function() {
			// When an editable is activated, we show its associated surfaces.
			Aloha.bind( "aloha-editable-activated", function( event, alohaEvent ) {
				Surface.active = alohaEvent.editable;
				Surface.show( alohaEvent.editable );
				// The range isn't set until after the activated event
				// and selection-changed doesn't fire on activation
				setTimeout(function() {
					Container.showContainers( Surface.active,
						Aloha.getSelection().getRangeAt( 0 ) );
				}, 1 );
			});

			// When an editable is deactivated, we hide its associated surfaces.
			Aloha.bind( "aloha-editable-deactivated", function( event, alohaEvent ) {
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
			Aloha.bind( "aloha-selection-changed", function( event, range ) {
				if ( Surface.active ) {
					Container.showContainers( Surface.active, range );
				}
			});
		},

		show: function( editable ) {
			// If this is the first time we're showing the surfaces for this
			// editable, then we need to initialize the surfaces first.
			if ( !editable.surface ) {
				this.initForEditable( editable );
			}

			jQuery.each( editable.surface.surfaces, function( i, surface ) {
				surface.show();
			});
		},

		hide: function( editable ) {
			jQuery.each( editable.surface.surfaces, function( i, surface ) {
				surface.hide();
			});
		},

		initForEditable: function( editable ) {
			editable.surface = {
				surfaces: []
			};

			jQuery.each( this.surfaceTypes, function( i, surfaceType ) {
				var surface = surfaceType.createSurface( editable );
				if ( surface ) {
					editable.surface.surfaces.push( surface );
				}
			});
		},

		/**
		 * Registers a new surface type.
		 * @param {object} surface
		 */
		registerType: function( surface ) {
			Surface.surfaceTypes.push( surface );
		},

		/**
		 * Track editable and range when interacting with a surface
		 */
		trackRange: function( element ) {
			element
				.bind( "mousedown", function() {
					Surface.suppressHide = true;

					if ( Aloha.activeEditable ) {
						Surface.range = Aloha.getSelection().getRangeAt( 0 );
						// TODO: this overlaps with Surface.active
						Surface.editable = Aloha.activeEditable;
					}
				})
				.bind( "mouseup", function() {
					Surface.suppressHide = false;
				});
		}
	});

	Surface.init();

	return Surface;
});
