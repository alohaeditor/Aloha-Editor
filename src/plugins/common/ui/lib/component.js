// The main UI objects are components.
// Components can be placed inside any container, such as a toolbar or sidebar.
define([ 'aloha/core', 'util/class', 'aloha/jquery' ],
function ( Aloha, Class, jQuery ) {
	
	// All components inherit from `Aloha.ui.component`.
	Aloha.ui.component = Class.extend({
		visible: true,
		
		init: function( editable, settings ) {
			this.editable = editable;
			this.settings = settings;
			
			// Components are responsible for updating their state and visibility
			// whenever the selection changes.
			Aloha.bind( "aloha-selection-changed aloha-command-executed", jQuery.proxy( function( event, range ) {
				this.selectionChange( range );
			}, this ) );
		},
		
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
		
		selectionChange: function() {
			if ( this.settings.selectionChange ) {
				this.settings.selectionChange.apply( this, arguments );
			}
		}
	});
	
	return Aloha.ui.component;
});