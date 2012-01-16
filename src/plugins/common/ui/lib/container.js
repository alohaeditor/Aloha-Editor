/**
 * Defines a `Container` Class.
 * Panels and tabs, extend this class.
 */

define([
	'aloha/core',
	'aloha/jquery',
	'util/class'
], function( Aloha, jQuery, Class ) {
	'use strict';

	/**
	 * Temporary helper function.
	 * TODO: Remove me when you no longer needed (don't forget to remove
	 *       invocations of this function in this source file.
	 * @ignore
	 * @param {string} str
	 */
	function debug( str ) {
		if ( false ) {
			console.log( str );
		}
	};

	/**
	 * This object provides a unique associative container which maps hashed
	 * `showOn` values (see `Container.generateKeyForShowOnValue()`) with
	 * objects that hold a corresponding `shouldShow` function (which is also
	 * derived from the `showOn` value), and an array of containers which share
	 * this predicate.  The main advantage we get from a hash set is that
	 * lookups can be done in constant time.
	 * @type {object.<string, object>}
	 */
	var showGroups = {};

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
		 * Whether this container is visible of not.
		 * @type {boolean}
		 */
		visible: true,

		/**
		 * Indicates the type of the container: "tab" or "panel".
		 * @type {string}
		 */
		type: 'tab',

		/**
		 * A unique identifier for this container.
		 * @type {string}
		 */
		uid: null,

		/**
		 * The containing (wrapper) element for this container.
		 * @type {jQuery<HTMLElement>}
		 */
		element: null,

		/**
		 * Clickable handle for this container, which pairs with a
		 * corresponding panel element.
		 * @type {jQuery<HTMLElement>}
		 */
		handle: null,

		/**
		 * The panel element for this container on which components will be
		 * rendered.
		 * @type {jQuery<HTMLElement>}
		 */
		panel: null,

		/**
		 * Zero-base index of this container's position in the `surface` that
		 * it is rendered on.
		 * @type {number}
		 */
		index: null,

		/**
		 * True if this tab is activated (ie: having focus, so that not only is
		 * it visible but also top-most, exposing its components for
		 * interaction).
		 * @type {boolean}
		 */
		activated: false,

		/**
		 * A value to test whether this container should be shown when its
		 * `shouldShow` method is invoked.
		 * @param {string|boolean|function():boolean}
		 */
		showOn: true,

		/**
		 * A predicate that tests whether this container should be shown.  This
		 * is done by testing the elements in the current selected range against
		 * the `showOn` value.
		 * @param {Array.<HTMLElement>=} elements A set of elements to test.
		 * @return {boolean} True if this container should be made visible.
		 */
		shouldShow: function() {
			return true;
		},

		/**
		 * Initialize a new container with the specified properties.
		 * @param {object=} settings Optional properties, and override methods.
		 * @constructor
		 */
		_constructor: function( settings ) {
			var init;

			if ( settings ) {
				init = settings.init;
				delete settings.init;
				jQuery.extend( this, settings );
			}

			this.init();

			if ( jQuery.type( init ) == 'function' ) {
				init.call( this );
			}
		},

		init: function() {
			this.addToShowGroup();
			this.onInit.call( this );
		},

		/**
		 * @return {jQuery<HTMLElement>} The element representing the rendered
		 *                               container.
		 */
		render: function() {
			this.element = jQuery( '<div>', {
				'class': 'aloha-ui-container, aloha-ui-tab'
			});

			this.onRender.call( this );

			return this.element;
		},

		/**
		 * Place the a container into the appropriate group in the `showGroups`
		 * hash.  Containers with functionally equivalent `showOn` values are
		 * grouped together so that instead of having to perform N number of tests
		 * to determine whether N number of containers should be shown or hidden,
		 * we can instead perform 1 test for N number of containers in many cases.
		 */
		addToShowGroup: function() {
			var key = Container.generateKeyForShowOnValue( this.showOn );
			var group = showGroups[ key ];

			if ( group ) {
				group.containers.push( container );
			} else {
				group = showGroups[ key ] = {
					shouldShow: Container.coerceShowOnToPredicate( this.showOn ),
					containers: [ this ]
				};
			}

			this.shouldShow = group.shouldShow;
		},

		show: function() {
			this.element.show();
			this.visible = true;
			this.onShow.call( this );
		},

		hide: function() {
			this.element.hide();
			this.visible = false;
			this.onHide.call( this );
		},

		//
		// Events handlers
		//

		onInit   : function() {},
		onRender : function() {},
		onShow   : function() {},
		onHide   : function() {}

	});


	// ------------------------------------------------------------------------
	// Class methods, and properties
	// ------------------------------------------------------------------------

	/**
	 * Given a `showOn` value, generate a string from a concatenation of its
	 * type and value.  We need to include the typeof of the `showOn` value onto
	 * the returned string so that we can distinguish a value of "true"
	 * (string) and a value `true` (boolean) which would be coerced to
	 * different `shouldShow` functions but would otherwise be stringified as
	 * simply "true".
	 * @static
	 * @param {string|boolean|function():boolean} showOn
	 * @return {string} A key that distinguishes the type and value of the
	 *                  given `showOn` value.  eg: "boolean:true".
	 */
	Container.generateKeyForShowOnValue = function( showOn ) {
		return jQuery.type( showOn ) + ':' + showOn.toString();
	};

	/**
	 * Given a value which represents a `showOn` test, coerce the value into a
	 * predicate function.
	 * @static
	 * @param {string|boolean|function():boolean} showOn
	 * @return {function():boolean}
	 */
	Container.coerceShowOnToPredicate = function( showOn ) {
		switch( jQuery.type( showOn ) ) {
		case 'function':
			return showOn;
		case 'string':
			return function( el ) {
				return el ? jQuery( el ).is( showOn ) : false;
			};
		default:
			return function() {
				return true;
			};
		}
	};

	/**
	 * Show or hide a set of containers.
	 * @static
	 * @param {Array.<Aloha.ui.Container>} containers
	 * @param {string} action Either "hide" or "show", and nothing else.
	 */
	Container.toggleContainers = function( containers, action ) {
		if ( action != 'show' && action != 'hide' ) {
			return;
		}

		var j = containers.length;

		while ( j ) {
			debug( 'Container.toggleContainers: ' + action + ' `'
				+ containers[ j - 1 ].label + '`.' );

			containers[ --j ][ action ]();
		}
	};

	/**
	 * Given an array of elements, show all containers whose group's
	 * `shouldShow` function returns true for any of the nodes in the `elements`
	 * array.  Otherwise hide those containers.
	 *
	 * We test a group of containers instead of individual containers because,
	 * if we were to test each container's `shouldShow` function individually,
	 * we would do so at a cost of O(num_of_elements * N) in any and all cases.
	 * But by grouping containers into sets that have functionally equivalent
	 * `showOn` conditions, we can minimize the work we have to do for most
	 * cases, since it is likely that there will often be containers which have
	 * the same condition regarding when they are to be shown.
	 *
	 * Organizing our data in this way allows this function to perform 1 *
	 * (number of elements) `shouldShow` test for N containers in most cases,
	 * rather than N * (number of elements) tests for N containers in all
	 * cases.
	 * @TODO(petro): Figure out a way to leave out containers which belong in
	 *               deactivated (hidden) toolbars from being shown, since this
	 *               is unnecessary work.
	 * @static
	 * @param {Array.<HTMLElement>} elements A list of elements, any of which
	 *                                       may cause the container to shown.
	 */
	Container.showContainersForElements = function( elements ) {
		// Add a null object to the elements array so that we can test whether
		// the panel should be activated when we have no elements in the
		// current selection.
		if ( elements && jQuery.type( elements.push ) == 'function' ) {
			elements.push( null );
		} else {
			elements = [ null ];
		}

		var group,
		    groupKey,
		    shouldShow,
		    j,
		    show;

		for ( groupKey in showGroups ) {
			group = showGroups[ groupKey ];
			shouldShow = group.shouldShow;

			if ( !shouldShow ) {
				continue;
			}

			j = elements.length;
			show = false;

			while ( j ) {
				debug( 'shouldShow `' + groupKey + '` group for '
					+ ( elements[ j - 1 ] && '`<' + elements[ j - 1 ].nodeName + '>`' )
					+ '? ' + ( shouldShow( elements[ j - 1 ] ) ? 'Yes' : 'No' )
					+ '.' );

				var element = elements[ j - 1 ];

				if ( shouldShow( elements[ --j ] ) ) {
					show = true;
					break;
				}
			}

			Container.toggleContainers( group.containers,
				show ? 'show' : 'hide' );
		}
	};

	// ------------------------------------------------------------------------
	// Tests
	// ------------------------------------------------------------------------

	// TODO: more!

	/*
	var c1 = new Container();
	var c2 = new Container({
		showOn: 'p>i'
	});
	var c3 = new Container({
		showOn: function(el) {
			return el.is('a');
		}
	});
	var c4 = new Container({
		showOn: 'p>i'
	});
	var c5 = new Container({
		showOn: 'p>a'
	});
	*/

	return Container;
});
