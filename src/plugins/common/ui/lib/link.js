define([
	"aloha/core",
	"ui/ui",
	"i18n!ui/nls/i18n", 
	"aloha/jquery",
	"ui/autocomplete",
	"ui/toggleButton",
	// TODO: remove (just for testing)
	'ui/../../link/extra/linklist'
],
function( Aloha, Ui, i18n, jQuery ) {
	Ui.create( "link", "toggleButton", {
		label: i18n.t( "button.createLink.label" ),
		icon: "aloha-icon aloha-icon-link",
		iconOnly: true,
		
		click: function() {
			var state = Aloha.queryCommandValue( "createLink", Ui.toolbar.range );
			if ( state ) {
				Aloha.execCommand( "unlink", false, null, Ui.toolbar.range );
			} else {
				Aloha.execCommand( "createLink", false, "http://example.com", Ui.toolbar.range );
			}
		},
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			this.setState( !!value );
		}
	});
	
	Ui.create( "editLink", "autocomplete", {
		template: "{{name}}<br>{{url}}",
		
		selectionChange: function() {
			var value = Aloha.queryCommandValue( "createLink" );
			if ( value ) {
				this.show();
				value = jQuery( findAnchor() ).attr( "data-name" ) || value;
				this.element.val( value );
			} else {
				// this needs to be commented out to actually be able to use
				// the component (see comment in setValue about range management)
				this.hide();
			}
		},
		
		setValue: function( value, item ) {
			var anchor = findAnchor( Ui.toolbar.range ),
				href = item ? item.url : value;
			Aloha.execCommand( "createLink", false, href, Ui.toolbar.range );
			Aloha.RepositoryManager.markObject( anchor, item );
			jQuery( anchor ).attr( "data-name", item ? item.name : null ); 
		}
	});
	
	function findAnchor( range ) {
		range = range || Aloha.getSelection().getRangeAt( 0 );
		range = new GENTICS.Utils.RangeObject( range );
		return range.findMarkup(function () {
			return this.nodeName.toLowerCase() == 'a';
		});
	}
});
