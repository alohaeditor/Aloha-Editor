define([ 'aloha/jquery', 'ui/ui' ],
function( jQuery, Ui ) {
	Ui.createType( "multiSplit", {
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			var element = this.element = jQuery( "<div>", {
				"class": "aloha-multi-split"
			});
			
			jQuery.each( editable.settings.formatBlock, function( i, block ) {
				jQuery( "<p>", {
					text: block,
					click: function() {
						Aloha.execCommand( "formatBlock", false, block, Ui.toolbar.range );
					}
				})
				.appendTo( element );
			});
		}
	});
	
	return Ui.multiSplit;
});
