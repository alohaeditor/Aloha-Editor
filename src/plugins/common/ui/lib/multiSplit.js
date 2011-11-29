define([ 'aloha/jquery', 'ui/ui' ],
function ( jQuery, Ui ) {
	Ui.createType( "multiSplit", {
		init: function( editable, settings ) {
			this._super( editable, settings );
			
			this.element = jQuery( "<div>", {
				'class': 'aloha-multi-split'
			});
			
			var that = this;
			this.element.bind( "mousedown", function() {
				that.range = Aloha.getSelection().getRangeAt( 0 );
			});

			jQuery.each( editable.settings.formatBlock, function( i, block ) {
				jQuery( "<p>", {
					text: block,
					click: function() {
						Aloha.execCommand( "formatBlock", false, block, that.range );
					}
				})
				.appendTo( that.element );
			});
		}
	});
	
	return Ui.multiSplit;
});
