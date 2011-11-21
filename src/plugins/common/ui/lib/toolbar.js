// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
// Mark this click as handled by Aloha Editor
define([ 'aloha/core', 'aloha/jquery', 'ui/ui', 'ui/button' ],
function ( Aloha, jQuery, Ui, Button ) {
	// There are separate components for each editable,
	// but only the components for the active editable are shown.
	Ui.toolbar = {
		// The `active` property tracks which editable instance is currently active.
		active: null,
		
		// The `create()` method does all of the one-time setup needed to create the toolbar.
		// This should be called when Aloha is fully loaded.
		create: function() {
			var toolbar = this;
			this.element = jQuery( "<div>", {
				"class": "aloha-ui aloha-toolbar"
			})
			.hide()
			.appendTo( "body" );
			
			// When an editable is activated, we show its associated controls.
			Aloha.bind('aloha-editable-activated', function( event, alohaEvent ) {
				toolbar.show( alohaEvent.editable );
			});
			
			// When an editable is deactivated, we hide its associated controls.
			// This is currently disabled because we didn't want to implement the
			// logic for not deactivating the editable when the toolbar gains focus.
			Aloha.bind('aloha-editable-deactivated', function( event, alohaEvent ) {
				toolbar.active = false;
				// Wait if another editable activates the toolbar
				setTimeout( function() {
					if ( !toolbar.active ) {
						// TODO bind live events on aloha-ui
						toolbar.hide( alohaEvent.editable );
					}
				}, 10);
			});
		},
		
		// The `render()` method is called once per editable to create all components
		// associated with the editable.
		render: function( editable ) {
			// All components are contained in a div specific to the editable
			// to make it easy to show and hide the controls an activate/deactivate.
			// The editable instance gets a reference to this div.
			editable.toolbar = jQuery( "<div>", {
				"class": "aloha-ui aloha-toolbar-wrap"
			});
			// The toolbar is configured via `settings.toolbar` and is defined as
			// an array of groups, where the groups are arrays of controls.
			jQuery.each( editable.settings.toolbar.components, function() {
				var group = jQuery( "<div>", {
					"class": "aloha-toolbar-group"
				}).appendTo( editable.toolbar );
				// <a id="render-components"></a>
				// For each control, we render a new instance and append it to
				// the group.
				jQuery.each( this, function() {
					var component = Aloha.ui.render( this, editable );
					group.append( component.element );
				});
			});
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
//			var toolbar = this;
			if ( !Aloha.eventHandled ) {
				this.active = null;
//			setTimeout(function() {
//				if ( !toolbar.active ) {
					this.element.fadeOut(function() {
						editable.toolbar.detach();
					});
				}
//			}, 100 );
		}
	};
	
	Ui.toolbar.create();
	
	return Ui.toolbar;

});