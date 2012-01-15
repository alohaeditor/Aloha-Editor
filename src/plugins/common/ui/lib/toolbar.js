/**
 * FIXME(petro@gentics.com): Fix showing and hiding of toolbars when multiple
 *                           toolbar when we have mutliple editables. Problem
 *                           will be in tab.js .
 *
 */

define([
	'aloha/core',
	'aloha/jquery',
	'ui/ui',
	'ui/tab'
], function( Aloha, jQuery, Ui, Tab ) {

	// The toolbar is configured via `settings.toolbar` and is defined as
	// an array of tabs with component groups, where the groups are arrays of
	// controls.
	//
	// There are separate components for each editable,
	// but only the components for the active editable are shown.
	//
	// As a container for tabs, the toolbar serves to group together groups of
	// control components so that they can be shown and hidden together in their
	// feature/functional set.  For exmaple groups of table controls would be
	// placed in a table tab, groups of list controls in an image tab, and so
	// forth.
	Ui.toolbar = {

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

			// Event handler for aloha-selection-changed.  Determine the
			// effective elements at the current selection, and then invoke
			// `Ui.Container.showContainersForElements()` to show and hide the
			// appropriate containers.
			//
			// TODO: Is there a more reliable alternative to
			//       `range.markupEffectiveAtStart`? It seems that it needs to
			//       be fixed. There are times when you would click in the
			//       editable and the `markupEffectiveAtStart` array will have
			//       "incorrect" elements--that is, not the element or parents
			//       of the element you clicked on.

			Aloha.bind( 'aloha-selection-changed', function( event, range ) {
				var effective = [];

				if ( range && range.markupEffectiveAtStart ) {
					var j = range.markupEffectiveAtStart.length;

					while ( j ) {
						effective.push( range.markupEffectiveAtStart[ --j ] );
					}
				}

				Ui.Container.showContainersForElements( effective );
			});
		},

		/**
		 * Generate tabs inside the toolbar wrapper div, and inflates tabs from
		 * toolbar settings.  Invokes jQueryUI Tabs on the tabs container
		 * created inside the toolbar.
		 * @param {Array.<object>} tabs Tab settings from `toolbar.settings`.
		 * @param {Aloha.Editable} editable The editable whose toolbar will
		 *                                  hold the inflated tags.
		 */
		renderContainers: function( tabs, editable ) {
			var settings,
			    holder = Tab.createHolders( editable.toolbar ),
			    tabsUidPrefix = GENTICS.Utils.guid() + '-',
			    j = tabs.length,
			    i = 0;

			editable.tabs = editable.tabs || [];

			for ( ; i < j; ++i ) {
				settings = tabs[i];

				editable.tabs.push( new Tab({
					uid: tabsUidPrefix + i,
					label: settings.label || '',
					showOn: settings.showOn,
					editable: editable
				}, settings.components ));
			}

			holder.tabs();

			Ui.Container.showContainersForElements([]);
		},

		/**
		 * The `render()` method is called once per editable to create all
		 * components associated with the editable.
		 * @param {Aloha.Editable} editable
		 */
		render: function( editable ) {
			// All containers are rendered in a div specific to the editable to
			// make it easy to show and hide the toolbar containers on
			// activate/deactivate.  The editable instance gets a reference to
			// this div.
			editable.toolbar = jQuery( '<div>', {
				'class': 'aloha-toolbar-wrap'
			});

			jQuery( '<div>', {
				'class': Ui.TABS_CONTAINER_CLASS
			}).appendTo( editable.toolbar );

			var tabs;

			if ( editable.settings.toolbar
			     && editable.settings.toolbar ) {
				tabs = editable.settings.toolbar;
			} else {
				tabs = [];
			}

			this.renderContainers( tabs, editable );
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
		}

	};

	Ui.toolbar.create();

	return Ui.toolbar;
});
