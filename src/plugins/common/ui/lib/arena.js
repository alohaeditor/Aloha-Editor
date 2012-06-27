define(['ui/component'],function(Component){
	var Arena = Component.extend({
		init: function(){
			this.element = $('<div>');
		},
		addComponent: function(component) {
			this.element.append(component.element);
		}
	});
	return Arena;
});
