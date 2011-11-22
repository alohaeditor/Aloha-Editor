// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([ 'aloha/core', 'aloha/jquery', 'ui/component' ],
function ( Aloha, jQuery, Component ) {
	
	jQuery('.aloha-ui')
		.live('mousedown', function( event ) {
			if (!Aloha.eventHandled) {
				Aloha.eventHandled = true;
			}
		})
		.live('mouseup', function() {
			Aloha.eventHandled = false;
		});

	Aloha.ui = {
		components: {},
		
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
		// The `type` parameter may be anything that has been defined via `createType`.
		// The `component` parameter is the name of the component.
		// The properties for the `settings` parameter are dependent upon the type.
		// Check out the [bold plugin](bold.html) to see how this is used.
		create: function( type, component, settings ) {
			settings.type = type;
			settings.name = component;
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
			var component = new Aloha.ui[ settings.type ]( editable, settings );
			component.init( editable, settings );
			return component;
		}
	};
	
	return Aloha.ui;
});
