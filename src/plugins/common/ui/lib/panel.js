define([
	'aloha/jquery',
	'ui/container',
	'ui/component',
], function( jQuery, Container, Component ) {
	var Panel = Container.extend({
		_constructor: function( settings, components ) {
			this._super( settings, components );

			var editable = this.editable,
				element = this.element = jQuery( "<div>", {
						"class": "aloha-panel"
					}),
				title = jQuery( "<div>", {
						"class": "aloha-panel-title",
						text: settings.label
					})
					.appendTo( element ),
				content = jQuery( "<div>", {
						"class": "aloha-panel-content"
					}).appendTo( element );

			jQuery.each( components, function() {
				var component = Component.render( this, editable );
				content.append( component.element );
			});
		},

		show: function() {
			this.element.show();
		},

		hide: function() {
			this.element.hide();
		}
	});

	return Panel;
});
