// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([ "aloha/core", "util/class", "aloha/jquery" ],
function( Aloha, Class, jQuery ) {
	// All components inherit from `Aloha.ui.component`.
	Aloha.ui.component = Class.extend({
		visible: true,
		
		_constructor: function( editable, settings ) {
			this.editable = editable;
			jQuery.extend( this, settings );
			
			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			Aloha.bind( "aloha-selection-changed aloha-command-executed", jQuery.proxy( function( event, range ) {
				this.selectionChange( range );
			}, this ) );
			
			this.init();
		},
		
		init: function() {},
		
		show: function() {
			if ( !this.visible ) {
				this.element.show();
			}
			this.visible = true;
		},
		
		hide: function() {
			if ( this.visible ) {
				this.element.hide();
			}
			this.visible = false;
		},
		
		// usually overridden by the component or the settings
		selectionChange: function() {}
	});
	
	return Aloha.ui.component;
});
