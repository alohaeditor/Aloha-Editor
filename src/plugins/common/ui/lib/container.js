/**
 * License ...
 */

/**
 * Aloha Editor User Interface API Semantics
 * =========================================
 *
 * TODO(Petro): Move this documentation to a more appropriate place.
 *
 * Note
 * ===
 *    * This documentation is "thinking out loud," and very much "work in work
 *      in progress--as is the Aloha UI API itself.
 *
 *    * For flexibility and ease, it seems that it would be best that the Aloha
 *      UI API will not constrain the developer to these semantics, but will
 *      naively assume that these semantics are observed.
 *
 * Components
 * ---
 * Aloha Editor represents its user interface using objects called
 * `components`.  A uniform interface for these components allows them to be
 * agnostic to what container they are rendered on.
 *
 * Controls
 * ---
 * Interactive components like buttons, are called `controls`, to distinguish
 * them from non-interactive components like labels, and icons.
 *
 * Containers
 * ---
 * In rendering the UI, components are organized in visual groups, and these
 * groups are in turn bundled onto `containers`.  Containers can be tabs, as in
 * the case of the floating menu, or panels like in the sidebar.  Containers
 * allow a collection of controls that represent a feature set to be rendered
 * as a group and to be brought in and out of view together.
 *
 * Surfaces
 * ---
 * `Surfaces` are areas on a web page in which containers can be placed.  The
 * sidebar, and the toolbar are examples of such surfaces.  The possibility
 * exists for other surfaces to be defined--such as a ribbon, or a footer menu.
 */

define([
	"aloha/core",
	"aloha/jquery",
	"util/class"
],
function( Aloha, jQuery, Class ) {
	'use strict';

	/**
	 * This object provides a unique associative container which maps hashed
	 * `showOn` values (see `generateKeyForShowOnValue()`) with objects that
	 * hold a corresponding `shouldShow` function (which is also derived from
	 * the `showOn` value), and an array of containers which share this
	 * predicate.  The main advantage we get from a hash set is that lookups
	 * can be done in constant time.
	 * @type {object.<string, object>}
	 */
	var showGroups = {};

	/**
	 * Given a `showOn` value, generate a string from a concatenation of its
	 * type and value. We need to include the typeof of the `showOn` value onto
	 * the returned string so that we can distinguish a value of "true"
	 * (string) and a value `true` (boolean) which would be coerced to
	 * different `shouldShow` functions but would otherwise be stringified as
	 * simply "true".
	 * @param {string|boolean|function():boolean} showOn
	 * @return {string} A key that distinguishes the type and value of the
	 *                  given `showOn` value. eg: "boolean:true".
	 */
	function generateKeyForShowOnValue( showOn ) {
		return jQuery.type( showOn ) + ':' + showOn.toString();
	};

	/**
	 * Place the a container into the appropriate a group in the `showGroups`
	 * hash.  Containers with functionally equivalent `showOn` values are
	 * grouped together so that instead of having to perform N number of tests
	 * to determine whether N number of containers should be shown or hidden,
	 * we can instead perform 1 test for N number of containers in many some
	 * cases.
	 * @param {Aloha.ui.container} container
	 */
	function addToShowGroup( container ) {
		var key = generateKeyForShowOnValue( container.showOn );
		var group = showGroups[ key ];

		if ( group ) {
			group.containers.push( container );
		} else {
			group = showGroups[ key ] = {
				shouldShow: coerceShowOnToPredicate( container.showOn ),
				containers: [ container ]
			};
		};

		container.shouldShow = group.shouldShow;
	};

	/**
	 * Given a value which represents a `showOn` test, coerce the value into a
	 * predicate function.
	 * @param {string|boolean|function():boolean} showOn
	 * @return {function():boolean}
	 */
	function coerceShowOnToPredicate( showOn ) {
		switch( jQuery.type( showOn ) ) {
		case 'function':
			return showOn;
		case 'boolean':
			return function() {
				return showOn;
			};
		case 'string':
			return function( el ) {
				return el ? jQuery( el ).is( showOn ) : false;
			};
		case 'undefined':
			return function() {
				return true;
			};
		default:
			return function() {
				return false;
			};
		}
	};

	/**
	 * Given an array of elements, show all containers whose group's
	 * `shouldShow` function returns true for any of the nodes in the `elements`
	 * array. Otherwise hide those containers.
	 *
	 * We test a group of containers instead of individual containers because,
	 * if we were to test each container's `shouldShow` function individually,
	 * we would do so at a cost of O(num_of_elements * N) in any and all cases.
	 * But by grouping containers into sets that have functionally equivalent
	 * `showOn` conditions, we minimize the work we have to do for most cases,
	 * since it is likely that there will often be containers which have the same
	 * condition regarding when they are to be shown.
	 *
	 * Organized our data in this way allows this function to perform 1 *
	 * (number of elements) `shouldShow` test for N containers in most cases,
	 * rather than N * (number of elements) tests for N containers in all
	 * cases.
	 * @param {Array.<HTMLElement>} elements The effective elements any of
	 *                                       which may cause the container to
	 *                                       shown.
	 */
	function showContainersForElements( elements ) {
		// Add a null object to the elements array so that we can test whether
		// the panel should be activated when we have no effective elements in
		// the current selection.
		elements.push( null );

		for ( var group in showGroups ) {
			var shouldShow = group.shouldShow;

			if ( !shouldShow ) {
				continue;
			}

			var j = elements.length;

			while ( j ) {
				if ( shouldShow( elements[ --j ] ) ) {
					toggleContainers( group.container, 'show' );	
				} else {
					toggleContainers( group.container, 'hide' );
				}
			}
		}
	};

	/**
	 * Show or hide a set of containers.
	 * @param {Array.<Aloha.ui.container>} containers
	 * @param {string} action Either "hide" or "show", and nothing else.
	 */
	function toggleContainers( containers, action ) {
		if ( action != 'show' && action != 'hide' ) {
			return;
		}

		var j = containers.length;
	
		while ( j ) {
			containers[ --j ][ action ]();			
		}
	};

	// Event handler for aloha-selection-changed. Determine the effective
	// elements at the current selection, and then invoke
	// `showContainersForElements()` to show and hide the appropriate
	// containers.
	Aloha.bind('aloha-selection-changed', function() {
		var effective = [];
		
		if ( typeof range != 'undefined' && range.markupEffectiveAtStart ) {
			var j = range.markupEffectiveAtStart.length;
		
			while ( j ) {
				effective.push( range.markupEffectiveAtStart[ --j ] );
			}
		}
	});


	// ------------------------------------------------------------------------
	// API methods, and properties
	// ------------------------------------------------------------------------

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
		 * done by testing the elements in the current selected range against
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
			this.onInit.call( this );
			addToShowGroup( this );
		},

		/** 
		 * @return {jQuery<HTMLElement>} The element representing the rendered
		 *                               container.
		 */
		render: function() {
			var el = this.element = jQuery( '<div>', {
				'class': 'aloha-ui-container, aloha-ui-tab'
			});

			switch( this.type ) {
			case 'tab':
				break;
			case 'panel':
				break;
			}

			this.onRender.call( this );

			return el;
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

		onInit:   function() {},
		onRender: function() {},
		onShow:   function() {},
		onHide:   function() {}

	});

	// ------------------------------------------------------------------------
	// Tests
	// ------------------------------------------------------------------------
	var c1 = new Container();
	/*
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


	/**
	 * `Tab` defines an object that represents a collection
	 * of related component groups to be rendered together on the toolbar. Tabs
	 * are organized by feature and functionality so that related controls can
	 * be brought in and out of view depending on whether they are appropriate
	 * for a given user context.
	 *
	 * Tabs can be defined declaritivly in the Aloha configuration in the
	 * following manner:

		Aloha.settings.toolbar.tabs: [
			{
				label: 'Lists',
				activateOn: 'ul,ol,*.parent(.aloha-editable ul,.aloha-editable ol)',
				components: [ [ 'orderedList', 'unorderedList' ] ]
			}
		]

	 * Alternatively, tabs can also be created imperatively in this way:
	 * `new Tab( options, editable )`.
	 *
	 * The basic ui functionality of tabs is provided by jQuery UI Tabs.
	 *
	 * @param {object} options Information about the tab to be created,
	 *                         including the tab's label, and array of
	 *                         component groups it will contain.
	 * @param {Aloha.Editable} editable The editable who's toolbar this tab
	 *                                  will belong to.
	 * @constructor
	 */
	var Tab = function( options, editable ) {
		/**
		 * The editable to which this tab is attached to.
		 * @type {jQuery<HTMLElement>}
		 */
		this.editable = null;
		this.init.apply( this, arguments );
	};

	//
	// Prototype methods for the Tab object.
	//

	(function() {

		/**
		 * Initialize a tab, with its options.
		 * @param {object} options Information about the tab to be created,
		 *                         including the tab's label, and array of
		 *                         component groups.
		 * @param {Aloha.Editable} editable The editable who's toolbar this tab
	 	 *                                  will belong to.
	 	 */
		this.init = function( options, editable ) {
			this.container = editable.toolbar.find( '.aloha-toolbar-tabs-container' );

			// console.assert( this.container.length === 1 )	

			this.uid = options.uid;
			this.editable = editable;
			this.index = editable.tabs.length;

			this.handle = jQuery(
				  '<li>'
				+   '<a href="#' + this.uid + '">'
				+		options.label
				+   '</a>'
				+ '</li>'
			);

			var panel = this.panel = jQuery( '<div>', { id : this.uid });

			jQuery.each( options.components, function() {
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

			this.handle
			    .appendTo( this.container.find( 'ul.aloha-toolbar-tab-handles' ))
				.hide();

			this.panel
			    .appendTo( this.container.find( '.aloha-toolbar-tabs-panels' ))
				.hide();
		};

		/**
		 * A predicate that returns true if the user's selection change results
		 * in a selection which can be manipulated with the controls of this
		 * tab.
		 * @param {HTMLElement} node
		 * @param {Range} range The range of the current selection.
		 * @return {boolean} True if this tab should be shown on the toolbar.
		 */
		this.shouldActivate = function( node, range ) {
			return true;
		};

		/**
		 * Make this tab accessible on the toolbar.
		 */
		this.activate = function() {
			var tabs = this.container.find( 'ul.aloha-toolbar-tab-handles>li' );

			if ( tabs.length ) {
				this.show();
				this.activated = true;

				// If no tabs are selected, then select the tab which was just
				// activated.
				if ( this.container.find( '.ui-tabs-active' ).length == 0 ) {
					this.container.tabs( 'select', this.index );
				} else if ( this.container.tabs( 'option', 'selected' )
				            == this.index ) {
					this.container.tabs( 'select', this.index );
				}
			}
		};

		/**
		 * Make this tab disappear from the toolbar.
		 */
		this.deactivate = function() {
			var tabs = this.container.find( 'ul.aloha-toolbar-tab-handles>li' );

			if ( tabs.length ) {
				this.hide();
				this.activated = false;

				// If the tab we just deactivated was the selected tab, then we
				// need to selected another tab in its stead. We select the
				// first activated tab we find, or else we deselect all tabs.
				if ( this.index == this.container.tabs( 'option', 'selected' ) ) {
					var tabs = this.editable.tabs;

					for ( var i = 0; i < tabs.length; ++i ) {
						if ( tabs[i].activated ) {
							this.container.tabs( 'select', i );
							return;
						}
					}

					// This does not work...
					// this.container.tabs( 'select', -1 );

					this.handle.removeClass( 'ui-tabs-active' );
				}
			}
		};

		this.hide = function() {
			this.handle.hide();
			// this.panel.hide();
		};

		this.show = function() {
			this.handle.show();
			// Defer the showing of tab panels to occure when the tab is
			// selected.
			// this.panel.show();
		};

	}).call( Tab.prototype );
});
