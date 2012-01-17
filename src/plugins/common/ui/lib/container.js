/**
 * Defines a `Container` Class.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'util/class'
], function( Aloha, jQuery, Class ) {
	'use strict';

	/**
	 * This object provides a unique associative container which maps hashed
	 * `showOn` values (see `getShowOnId()`) with objects that
	 * hold a corresponding `shouldShow` function (which is also derived from
	 * the `showOn` value), and an array of containers which share this
	 * predicate.  The main advantage we get from a hash set is that lookups
	 * can be done in constant time.
	 * @type {object.<string, object>}
	 */
	var showGroups = {};

	var uid = 1;

	function getShowOnId( showOn ) {
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
	// "Public" methods, and properties
	// ------------------------------------------------------------------------

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
			var showOn = Container.normalizeShowOn( settings.showOn ),
				key = getShowOnId( showOn ),
				group = showGroups[ key ];

			if ( !group ) {
				group = showGroups[ key ] = {
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
		showContainers: function( range ) {
			var group, groupKey, show, j,
				// Add a null object to the elements array so that we can test whether
				// the panel should be activated when we have no effective elements in
				// the current selection.
				elements = [ null ];

			if ( range && range.markupEffectiveAtStart ) {
				j = range.markupEffectiveAtStart.length;
				while ( j ) {
					elements.push( range.markupEffectiveAtStart[ --j ] );
				}
			}

			for ( groupKey in showGroups ) {
				show = false;
				group = showGroups[ groupKey ];

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
