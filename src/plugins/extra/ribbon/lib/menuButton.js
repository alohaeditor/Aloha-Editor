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

	Component.define("insertTag", MenuButton, {
		label: "X",
		menu: [
			{ label: "Z",
			  menu: [ { label: "Q", onclick: function(){console.log("Q");} },
					  { label: "W", onclick: function(){console.log("W");} } ] },
			{ label: "V",
			  menu: [ { label: "Q", onclick: function(){console.log("Q");} },
					  { label: "W", onclick: function(){console.log("W");} } ] }
		]
	});

	return MenuButton;
});
