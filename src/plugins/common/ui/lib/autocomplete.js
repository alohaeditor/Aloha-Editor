define([
	"aloha/jquery",
	"ui/ui",
	
	"jquery-plugin!./vendor/jquery-ui-autocomplete-html"
],
function( jQuery, Ui ) {
	function parse( template, item ) {
		return template.replace( /{{([^}]+)}}/g, function( _, name ) {
			return name in item ? item[ name ] : "";
		});
	}
	
	Aloha.ui.createType( "autocomplete", {
		init: function() {
			var that = this;
			this.element = jQuery( "<input>" )
				.autocomplete({
					html: true,
					source: function( req, res ) {
						Aloha.RepositoryManager.query({
							queryString: req.term,
							objectTypeFilter: that.types
						}, function( data ) {
							res( jQuery.map( data.items, function( item ) {
								return {
									label: parse( that.template, item ),
									value: item.name,
									obj: item
								};
							}));
						});
					}
				})
				.bind( "autocompletechange", jQuery.proxy( function( event, ui ) {
					this.setValue( event.target.value, ui.item ? ui.item.obj : null );
				}, this ) );
		},
		
		// invoked when the user has changed the value and blurred the field
		setValue: function( value, item ) {}
	});
});
