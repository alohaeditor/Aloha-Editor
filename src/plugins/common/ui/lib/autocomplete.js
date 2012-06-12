define([
	"aloha/jquery",
	"aloha/repositorymanager",
	"ui/component",
	"jquery-plugin!./vendor/jquery-ui-autocomplete-html"
],
function( jQuery, RepositoryManager, Component ) {
	/**
	 * Generates the HTML for an item
	 * @param {string} template
	 * @param {object} item
	 * @return {string}
	 */
	function parse( template, item ) {
		return template.replace( /{{([^}]+)}}/g, function( _, name ) {
			return name in item ? item[ name ] : "";
		});
	}

	/**
	 * Autocomplete component type
	 * @class
	 * @extends {Component}
	 */
	var Autocomplete = Component.extend({
		/**
		 * Initializes the autocomplete component
		 * @override
		 */
		init: function() {
			this._super();
			var that = this;
			this.element = jQuery( "<input>" )
				.autocomplete({
					html: true,
					source: function( req, res ) {
						RepositoryManager.query({
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
		/**
		 * Sets the value of the component
		 * @param {string} value Raw value
		 * @param {object} item Structured value
		 */
		setValue: function( value, item ) {}
	});

	return Autocomplete;
});
