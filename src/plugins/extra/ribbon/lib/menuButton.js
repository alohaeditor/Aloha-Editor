define([
	"jquery",
	"ribbon/ribbon",
	'ui/component'
], function($, lib, Component) {

	var MenuButton = Component.extend({
		init: function(){
			this.element = $("<ul class='aloha-ribbon-singleton'></ul>");
			lib.setupButton(this.element, this);
			this.element.menubar({
				select: lib.onSelect
			});
		}
	});

	return MenuButton;
});
