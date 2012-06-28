define(['ribbon/ribbon', 'ui/component'], function (ribbon, Component) {
	'use strict';
	return Component.extend({
		init: function () {
			this.element = ribbon.makeMenuButton(this);
		}
	});
});
