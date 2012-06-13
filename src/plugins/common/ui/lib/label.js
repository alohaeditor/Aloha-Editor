define(["aloha/core",
		"aloha/jquery",
		"ui/component"],
function(Aloha, $, Component){

	var Label = Component.extend({
		init: function() {
			this._super();
		}
	});

	return Label;
});
