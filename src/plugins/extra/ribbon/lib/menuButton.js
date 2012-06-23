define([
	"jquery",
	"ribbon/ribbon",
	'ui/component'
], function($, lib, Component) {

	var MenuButton = Component.extend({
		init: function(){
			this.element = lib.makeSplitButton(this);
		}
	});

	return MenuButton;
});
