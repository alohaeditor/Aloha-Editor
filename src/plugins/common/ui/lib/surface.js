define([
	'aloha/core',
	'jquery',
	'util/class',
	'ui/container'
], function(
	Aloha,
	jQuery,
	Class,
	Container
) {
	'use strict';

	/**
	 * The Surface class and manager.
	 *
	 * @class
	 * @base
	 */
	var Surface = Class.extend({
		/**
		 * Check for whether or not this surface is active--that is, whether is
		 * is visible and the user can interact with it.
		 *
		 * @FIXME: @TODO: Implenent this function.
		 * @eturn {boolean} True if this surface is visible.
		 */
		isActive: function () {
			return true;
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

		instances: [],

		/**
		 * Initializes the surface manager.
		 *
		 * @static
		 */
		init: function() {
			// When an editable is activated, we show its associated surfaces.
			Aloha.bind( 'aloha-editable-activated', function( event, alohaEvent ) {
				Surface.active = alohaEvent.editable;
				Surface.show(alohaEvent.editable);
				Container.showContainersForContext(Surface.active);
			});

			// When an editable is deactivated, we hide its associated surfaces.
			Aloha.bind( 'aloha-editable-deactivated', function( event, alohaEvent ) {
				// TODO: handle a click on a surface, then a click outside
				if ( !Surface.suppressHide ) {
					Surface.hide( alohaEvent.editable );
					Surface.active = null;
				}
			});
		},

		/**
		 * Shows all surfaces for a given context.
		 *
		 * @param context.
		 */
		show: function( context ) {
			// If this is the first time we're showing the surfaces for this
			// context, then we need to initialize the surfaces first.
			if ( !context.surfaces ) {
				Surface.initialize( context );
			}

			jQuery.each( context.surfaces, function( i, surface ) {
				surface.show();
			});
		},

		/**
		 * Hides all surfaces for a given context.
		 *
		 * @param context
		 */
		hide: function (context) {
			jQuery.each(context.surfaces, function (i, surface) {
				surface.hide();
			});
		},

		/**
		 * Initializes all surfaces for an context.
		 * @todo Rename to initialize.
		 * @todo Remove the above @todo.
		 *
		 * @param context
		 */
		initialize: function (context) {
			context.surfaces = [];
			jQuery.each(Surface.Types, function (i, Type) {
				var surface = Type.createSurface(context);
				if (surface) {
					context.surfaces.push(surface);
					Surface.instances.push(surface);
				}
			});
		},

		/**
		 * Registers a new surface type.
		 *
		 * @param {Surface} surface
		 */
		registerType: function (surface) {
			Surface.Types.push(surface);
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
		trackRange: function (element) {
			element.bind('mousedown', function (e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = true;
				Surface.suppressHide = true;

				if (Aloha.activeEditable) {
					var selection = Aloha.getSelection();
					Surface.range = (0 < selection.getRangeCount())
					              ? selection.getRangeAt(0)
								  : null;
					// TODO: this overlaps with Surface.active
					Surface.editable = Aloha.activeEditable;
				}
			});
			
			element.bind('mouseup', function (e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = false;
				Surface.suppressHide = false;
			});
		},

		onActivatedSurface: function (tuples, eventName, $event, range, nativeEvent) {
			var i;
			for (i = 0; i < tuples.length; i++) {
				if (tuples[i][0].isActive()) {
					tuples[i][1]($event, range, nativeEvent);
				}
			}
		}
	});

	Surface.init();

	return Surface;
});
