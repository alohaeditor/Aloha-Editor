/**
 * Aloha Editor User Interface API Semantics
 * =========================================
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
 * Components (Buttons, Labels, Icons)
 * ---
 * Aloha Editor represents its user interface using objects called
 * `components`.  A uniform interface for these components allows them to be
 * agnostic to what container they are rendered on.
 *
 * Controls (Buttons)
 * ---
 * Interactive components like buttons, are called `controls`, to distinguish
 * them from non-interactive components like labels, and icons.
 *
 * Containers (Tabs, Panels)
 * ---
 * In rendering the UI, components are organized in visual groups, and these
 * groups are in turn bundled onto `containers`.  Containers can be tabs, as in
 * the case of the floating menu, or panels like in the sidebar.  Containers
 * allow a collection of controls that represent a feature set to be rendered
 * as a group and to be brought in and out of view together.
 *
 * Surfaces (Toolbar, Ribbon)
 * ---
 * `Surfaces` are areas on a web page in which containers can be placed.  The
 * sidebar, and the toolbar are examples of such surfaces.  The possibility
 * exists for other surfaces to be defined--such as a ribbon, or a footer menu.
 *
 *
 * Class structure
 * ===
 * TODO(petro@gentics.com)
 */

define([
	"aloha/core",
	"aloha/jquery",
	"ui/component",
	"ui/container"
],
function( Aloha, jQuery, Component, Container ) {

	jQuery( document )
		.delegate( ".aloha-ui", "mousedown", function() {
			Aloha.eventHandled = true;
		})
		.delegate( ".aloha-ui", "mouseup", function() {
			Aloha.eventHandled = false;
		});

	Aloha.ui = {
		components: {},

		Container: Container,
		
		// The first step of creating a component is to define a component type.
		// Component types define how a component is displayed and what types of
		// interactions the component allows.
		// Check out the [button component type](button.html) to see how this is used. 
		createType: function( type, base, proto ) {
			if ( !proto ) {
				proto = base;
				base = Component;
			}
			
			// All component types expose their API as constructors and prototypes.
			// This should make it easy to extend existing component types.
			// Complex components can also easily be composed of smaller components.
			Aloha.ui[ type ] = base.extend( proto );
		},
		
		// Next, we need to create a component.
		// The `component` parameter is the name of the component.
		// The `type` parameter may be anything that has been defined via `createType`.
		// The properties for the `settings` parameter are dependent upon the type.
		// Check out the [bold plugin](bold.html) to see how this is used.
		create: function( component, type, settings ) {
			settings.name = component;
			settings.type = type;
			this.components[ component ] = settings;
		},
		
		// After a component has been created, it can be rendered any number of times.
		// Components are rendered for a specific editable instance,
		// because the configuration may be dependent upon the settings of the editable instance.
		// The `render` method returns the rendered component. The properties will be
		// dependent upon the type, but every component will have an `element` property
		// which is a reference to the main element of the component.
		render: function( component, editable ) {
			var settings = this.components[ component ];
			return new Aloha.ui[ settings.type ]( editable, settings );
		}
	};
	
	// temporary location helper methods
	// TODO: these need to live somewhere not tied to the UI
	Aloha.ui.util = {
		findElemFromRange: function( tag, range ) {
			range = range || Aloha.getSelection().getRangeAt( 0 );
			range = new GENTICS.Utils.RangeObject( range );
			return range.findMarkup(function() {
				return this.nodeName.toLowerCase() === tag;
			});
		}
	};
	
	return Aloha.ui;
});
