define([
	"aloha/core",
	"aloha/jquery",
	"ui/ui"
],
function( Aloha, jQuery, Ui ) {

	/**
	 * The (local) `Tab` class defines an object that represents a collection
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
			activateOn: 'ul,ol,*.parent(ul,ol)',
			components: [
				[ 'orderedList', 'unorderedList' ],
			]
		}

	 * Alternatively, tabs can also be created imperatively in this way:
	 * `new Tab( options, editable )`.
	 *
	 * The basic ui functionality of tabs is provided by jQuery UI Tabs.
	 *
	 * @param {object} options Information about the tab to be created,
	 *                         including the tab's label, and array of
	 *                         components groups it will contail.
	 * @param {Aloha.Editable} editable The editable who's toolbar this tab
	 *                                  will belong to.
	 * @constructor
	 */
	var Tab = function( options, editable ) {

		/**
		 * A unique identifier for this tab.
		 * @type {string}
		 */
		this.uid = null;

		/**
		 * Clickable tab handle which pairs with a corresponding panel element.
		 * @type {jQuery<HTMLElement>}
		 */
		this.handle = null;

		/**
		 * A reference to the inner element which holds the text and icon for
		 * this tab's handle. We keep a reference to it for easy access.
		 * @type {jQuery<HTMLElement>}
		 */
		this.title = null;

		/**
		 * The container element for this tab's panel.
		 * @type {jQuery<HTMLElement>}
		 */
		this.panel = null;

		/**
		 * The editable to which this tab is attached to.
		 * @type {jQuery<HTMLElement>}
		 */
		this.editable = null;

		/**
		 * A positive integer denoting the position of this tab in among
		 * the toolbar tabs.
		 * @type {number}
		 */
		this.index = null;

		/**
		 * True if the tab is activated.
		 * @type {boolean}
		 */
		this.activated = true;

        /**
         * Given a value which represents an activateOn test, this function
		 * will coerce the `activateOn` value into a predicate function.
		 * This function is used to generate the `Tab.shouldActivate` method
		 * for each tab instance.
		 * @param {string|boolean|function():boolean} activateOn
		 * @return {function():boolean}
         */
        var coerceActivateOnToPredicate = function( activateOn ) {
			switch( typeof activateOn ) {
			case 'function':
				return activateOn;
			case 'boolean':
				return function() {
					return activateOn;
				};
			case 'string':
				return function( el ) {
					return el ? jQuery( el ).is( activateOn ) : false;
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

		this.shouldActivate = coerceActivateOnToPredicate( options.activateOn );
		this.init.apply( this, arguments );
	};

	// Tab prototype methods

	(function() {

		/**
		 * Initializes the tab, with its options.
		 * @param {object} options Information about the tab to be created,
		 *                         including the tab's label, and array of
		 *                         components.
		 * @param {Aloha.Editable} editable The editable who's toolbar this tab
	 	 *                                  will belong to.
	 	 */
		this.init = function( options, editable ) {
			var container = editable.toolbar.find( '.aloha-toolbar-tabs-container' );

			if ( !container.length ) {
				// TODO: raise an error
				return;
			}

			this.uid = options.uid;
			this.editable = editable;
			this.index = editable.tabs.length;
			this.container = container;

			var panel = this.panel = jQuery( '<div>', {
				id : this.uid
			}).appendTo( container.find( '.aloha-toolbar-tabs-panels' ));

			this.handle = jQuery(
				  '<li class="' + this.uid + '">'
				+   '<a href="#' + this.uid + '">'
				+     '<span>' + options.label + '</span>'
				+   '</a>'
				+ '</li>'
			).appendTo( container.find( 'ul.aloha-toolbar-tab-handles' ));

			this.title = this.handle.find('>a>span');

			container.tabs( 'add', '#' + this.uid, options.label );

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
		 *
		 */
		this.activate = function() {
			var tabs = this.container.find( 'ul.aloha-toolbar-tab-handles>li' );

			if ( tabs.length ) {
				jQuery( tabs[ this.index ] ).show();

				this.activated = true;

				// If no tabs are selected, the select this tab which we have
				// just activated.
				if ( this.container.tabs( 'option', 'selected' ) == -1 ) {
					this.container.tabs( 'select', this.index );
				}
			}
		};

		/**
		 *
		 */
		this.deactivate = function() {
			var tabs = this.container.find( 'ul.aloha-toolbar-tab-handles>li' );

			if ( tabs.length ) {
				jQuery( tabs[ this.index ] ).hide();

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

					this.container.tabs( 'select', -1 );
				}
			}
		};

	}).call( Tab.prototype );

	// The toolbar is configured via `settings.toolbar` and is defined as
	// an array of tabs with component groups, where the groups are arrays of
	// controls.
	//
	// There are separate components for each editable,
	// but only the components for the active editable are shown.
	//
	// The toolbar is a container for tabs. Tabs serve to group together
	// groups of control components so that they can be shown and hidden
	// together in their feature/functional set. For exmaple groups of
	// table controls would be placed in a table tab, groups of list
	// controls in an image tab, and so forth.
	// A typical toolbar config
	Ui.toolbar = {

		/**
		 * This array holds the collection of tabs attached to this toolbar
		 * instance.
		 * @type {Array.<Tab>}
		 */
		tabs: [],

		// The `active` property tracks which editable instance is currently active.
		active: null,

		// The `create()` method does all of the one-time setup needed to create the toolbar.
		// This should be called when Aloha is fully loaded.
		create: function() {
			var toolbar = this;
			this.element = jQuery( "<div>", {
				"class": "aloha-ui aloha-toolbar",
				mousedown: function() {
					if ( Aloha.activeEditable ) {
						toolbar.range = Aloha.getSelection().getRangeAt( 0 );
						// TODO: this overlaps with toolbar.active
						toolbar.editable = Aloha.activeEditable;
					}
				}
			})
			.hide()
			.appendTo( "body" );

			// When an editable is activated, we show its associated controls.
			Aloha.bind( "aloha-editable-activated", function( event, alohaEvent ) {
				toolbar.show( alohaEvent.editable );
			});

			// When an editable is deactivated, we hide its associated controls.
			// This is currently disabled because we didn't want to implement the
			// logic for not deactivating the editable when the toolbar gains focus.
			Aloha.bind( "aloha-editable-deactivated", function( event, alohaEvent ) {
				toolbar.active = false;
				// Wait if another editable activates the toolbar
				setTimeout( function() {
					if ( !toolbar.active ) {
						toolbar.hide( alohaEvent.editable );
					}
				}, 10 );
			});

			this.subscribeEventHandlers( toolbar );
		},

		initializeTabs: function( tabs, editable ) {
			// Generate containers for tabs inside the toolbar wrapper div.

			editable.tabs = editable.tabs || [];

			var container = jQuery( editable.toolbar )
									.find( '.aloha-toolbar-tabs-container' );

			var tabsHandles = jQuery( '<ul>', {
				'class': 'aloha-toolbar-tab-handles'
			}).appendTo( container );

			var tabsPanels = jQuery( '<div>', {
				'class': 'aloha-toolbar-tabs-panels'
			}).appendTo( container );

			// Inflate tabs defined in `toolbar.settings` information.

			var tab;
			var tabsUidPrefix = GENTICS.Utils.guid() + '-';
			var j = tabs.length;

			for ( var i = 0; i < j; ++i ) {
				tab = tabs[i];
				tab.uid = tabsUidPrefix + i;
				tab.label = tab.label || '';
				editable.tabs.push( new Tab( tabs[i], editable ));
			};
		},

		// The `render()` method is called once per editable to create all components
		// associated with the editable.
		render: function( editable ) {
			// All components are contained in a div specific to the editable
			// to make it easy to show and hide the controls an activate/deactivate.
			// The editable instance gets a reference to this div.
			editable.toolbar = jQuery( "<div>", {
				"class": "aloha-toolbar-wrap"
			});

			// Prepare a list of tabs--either read from the toolbar settings,
			// or constructed form the `components` property if no tabs have
			// been specified in this editable's settings.
			var tabs;

			if ( editable.settings.toolbar.tabs
			     && editable.settings.toolbar.tabs.length ) {
				 tabs = editable.settings.toolbar.tabs;
			} else {
				tabs = [{
					name: '',
					components: editable.settings.toolbar.components
				}];
			}

			jQuery( '<div>', {
				'class': 'aloha-toolbar-tabs-container'
			})
			.appendTo( editable.toolbar )
			.tabs();

			this.initializeTabs( tabs, editable );
		},

		show: function( editable ) {
			// If this is the first time we're showing the toolbar for this
			// editable, then we need to render the controls first.
			if ( !editable.toolbar ) {
				this.render( editable );
			}
			// We hide any active controls and show this editable's controls.
			this.element.children().detach();
			this.element.append( editable.toolbar );
			this.element.fadeIn();
			this.active = editable;
		},

		hide: function( editable ) {
			if ( !Aloha.eventHandled ) {
				this.active = null;
				this.element.fadeOut(function() {
					editable.toolbar.detach();
				});
			}
		},

		subscribeEventHandlers: function( toolbar ) {
			var that = this;

			Aloha.bind( 'aloha-selection-changed', function( event, range ) {
				that.checkActiveTabs( range );
			});

			// Flag the next selection change event to be ignored

			var editable = Aloha.activeEditable && Aloha.activeEditable.obj;

			if ( editable ) {
				editable.mousedown( function( ev ) {
					ev.originalEvent.stopSelectionUpdate = true;
					Aloha.eventHandled = true;
					//e.stopSelectionUpdate = true;
				});

				editable.mouseup( function( ev ) {
					ev.originalEvent.stopSelectionUpdate = true;
					Aloha.eventHandled = false;
				});
			}
		},

		/**
		 * Determines the effective elements at the current selection. Iterates
		 * all tabs and checks whether the tab should be activated for any of the
		 * effective elements in the selection.
		 * @param {Aloha.RangeObject} range
		 */
		 checkActiveTabs: function( range ) {
		 	var effective = [];

			if ( typeof range != 'undefined' && range.markupEffectiveAtStart ) {
				var l = range.markupEffectiveAtStart.length;

				for ( var i = 0; i < l; ++i ) {
					effective.push( range.markupEffectiveAtStart[i] );
				}
			}

			var that = this;

			if ( this.active ) {
				jQuery.each( this.active.tabs, function() {
					that.showActiveTab( this, effective );
				});
			}
       },

		/**
		 * Given a tab and an array of elements, activate the tab if any of the
		 * nodes in `elements` returns true when passed to `tab`'s
		 * shouldActivate predicate. Otherwise deactivate the tab.
		 * @param {Tab} tab
		 * @param {Array.<HTMLElement>} elements The effective elements any of
		 *                                       which may activate the tab.
		 */
		showActiveTab: function( tab, elements ) {
			// We have to add a null object to the list of elements to allow us
			// to check whether the panel should be visible when we have no
			// effective elements in the current selection.
			elements.push(null);

			var shouldActivate = tab.shouldActivate;
			var isActive = false;
			var j = elements.length;

			while ( j ) {
				if ( shouldActivate( elements[ --j ] ) ) {
					isActive = true;
					break;
				}
			}

			if ( isActive ) {
				if ( !tab.activated ) {
					tab.activate();
				}
			} else {
				if ( tab.activated ) {
					tab.deactivate();
				}
			}
		}

	};

	Ui.toolbar.create();
	return Ui.toolbar;
});
