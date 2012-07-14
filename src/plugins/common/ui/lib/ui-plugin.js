/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'jquery',
	'aloha',
	'ui/context',
	'ui/container',
	'ui/surface',
	'ui/toolbar',
	'ui/scopes',
	'ui/settings',
	'PubSub',
	// Most modules of the ui plugin depend on jquery-ui, but its easy
	// to forget to add the dependency so we do it here.
	'jqueryui'
], function(
	$,
	Aloha,
	Context,
	Container,
	Surface,
	Toolbar,
	Scopes,
	Settings,
	PubSub
) {
	'use strict';

	var context = new Context(),
	    toolbar = new Toolbar(context, getToolbarSettings());

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
		primaryScopeForegroundTab(Scopes.getPrimaryScope());
	});

   function getToolbarSettings() {
	   var userSettings = Aloha.settings.toolbar,
	       defaultSettings = Settings.defaultToolbarSettings;
	   if (!userSettings) {
		   return defaultSettings.tabs;
	   }
	   return Settings.combineToolbarSettings(
		   userSettings.tabs || [],
		   defaultSettings.tabs,
		   userSettings.exclude || []
	   );
   } 

	function primaryScopeForegroundTab() {
		var tabs = toolbar._tabs,
		    primaryScope = Scopes.getPrimaryScope(),
		    settings,
		    i;
		for (i = 0; i < tabs.length; i++) {
			settings = tabs[i].settings;
			if ('object' === $.type(settings.showOn) && settings.showOn.scope === primaryScope) {
				tabs[i].tab.foreground();
				break;
			}
		}
	}

	function adoptInto(slot, component) {
		return toolbar.adoptInto(slot, component);
	}

	return {
		adoptInto: adoptInto,
		toolbar: toolbar
	};
});
