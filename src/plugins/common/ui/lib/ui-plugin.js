/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha',
	'ui/context',
	'ui/container',
	'ui/surface',
	'ui/toolbar',
	'PubSub',
	// Most modules of the ui plugin depend on jquery-ui, but its easy
	// to forget to add the dependency so we do it here.
	'aloha/jquery-ui'
], function(
	Aloha,
	Context,
	Container,
	Surface,
	Toolbar,
	PubSub
) {
	'use strict';

	var context = new Context(),
	    toolbar = new Toolbar(context, Aloha.settings.toolbar);

	Aloha.bind('aloha-editable-activated', function(event, alohaEvent) {
		Surface.show(context);
		Container.showContainersForContext(context, event);
	});

	Aloha.bind('aloha-editable-deactivated', function(event, alohaEvent) {
		if (!Surface.suppressHide) {
			Surface.hide(context);
		}
	});

	PubSub.sub('aloha.ui.scope.change', function(){
		Container.showContainersForContext(context);
	});

	function assignToSlot(configuredSlot, component) {
		toolbar.assignToSlot(configuredSlot, component);
	}

	return {
		assignToSlot: assignToSlot
	};
});
