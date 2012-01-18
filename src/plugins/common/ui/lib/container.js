/**
 * Defines a `Container` Class.
 */

/* 
 * Containers are activated based on the `showOn` setting for the container.
 * The values are normalized to functions which accept an element and return a
 * boolean; true means the container should be shown.
 * 
 * For efficiency, we group all containers that have the same normalized
 * `showOn` function together, so we can evaluate it once, regardless of how
 * many containers are using the same logic. In order for this to work, the
 * exact same function must be returned from `Container.normalizeShowOn` when
 * the logic is the same.
 * 
 * The list of containers is then stored on the editable instance as
 * `editable.container.groups`, which is a hash of `showOn` ids to an array of
 * containers. The `showOn` ids are unique identifiers that are stored as
 * properties of the `showOn` function (see `getShowOnId()`). This gives us
 * constant lookup times when grouping containers.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'util/class'
], function( Aloha, jQuery, Class ) {
	'use strict';

	var uid = 1;
	function getShowOnId( showOn ) {
		// store a unique id on the showOn function
		// see full explanation at top of file
		if ( !showOn.showOnId ) {
			showOn.showOnId = uid++;
		}
		return showOn.showOnId;
	}

	/**
	 * Show or hide a set of containers.
	 * @param {Array.<Aloha.ui.Container>} containers
	 * @param {boolean} show Whether to show or hide
	 */
	function toggleContainers( containers, show ) {
		var action = show ? "show" : "hide",
			j = containers.length;

		while ( j ) {
			containers[ --j ][ action ]();
		}
	};

	// ------------------------------------------------------------------------
	// Instance methods, and properties
	// ------------------------------------------------------------------------

	/**
	 * Aloha.ui.Container class.  Aloha.ui.Tab and Aloha.ui.Panel classes extend
	 * this class.
	 * @class
	 * @base
	 */
	var Container = Class.extend({
		/**
		 * The containing (wrapper) element for this container.
		 * @type {jQuery<HTMLElement>}
		 */
		element: null,

		/**
		 * Initialize a new container with the specified properties.
		 * @param {object=} settings Optional properties, and override methods.
		 * @constructor
		 */
		_constructor: function( settings ) {
			var group,
				containerSettings = settings.editable.container,
				showOn = Container.normalizeShowOn( settings.showOn ),
				key = getShowOnId( showOn );

			if ( !containerSettings ) {
				containerSettings = settings.editable.container = {
					groups: {}
				};
			}

			group = containerSettings.groups[ key ];
			if ( !group ) {
				group = containerSettings.groups[ key ] = {
					shouldShow: showOn,
					containers: []
				};
			}

			group.containers.push( this );
		},

		show: function() {
			this.element.show();
		},

		hide: function() {
			this.element.hide();
		}
	});

	jQuery.extend( Container, {
		normalizeShowOn: (function() {
			var stringFns = [],
				returnTrue = function() {
					return true;
				};

			return function( showOn ) {
				switch( jQuery.type( showOn ) ) {
				case 'function':
					return showOn;
				case 'string':
					if ( !stringFns[ showOn ] ) {
						stringFns[ showOn ] = function( el ) {
							return el ? jQuery( el ).is( showOn ) : false;
						};
					}
					return stringFns[ showOn ];
				default:
					return returnTrue;
				}
			};
		})(),

		/**
		 * Given a range, show appropriate containers.
		 *
		 * @TODO(petro): Figure out a way to leave out containers which belong in
		 *               deactivated (hidden) toolbars from being shown, since this
		 *               is unnecessary work.
		 * @param {object} range The range to show containers for
		 * @static
		 */
		showContainers: function( editable, range ) {
			var group, groupKey, show, j, element,
				isEditingHost = GENTICS.Utils.Dom.isEditingHost,
				// Add a null object to the elements array so that we can test whether
				// the panel should be activated when we have no effective elements in
				// the current selection.
				elements = [ null ];

			for ( element = range.startContainer;
					!isEditingHost( element );
					element = element.parentNode ) {
				elements.push( element );
			}

			for ( groupKey in editable.container.groups ) {
				show = false;
				group = editable.container.groups[ groupKey ];

				j = elements.length;
				while ( j ) {
					if ( group.shouldShow( elements[ --j ] ) ) {
						show = true;
						break;
					}
				}

				toggleContainers( group.containers, show );
			}
		}
	});

	return Container;
});
