/* ui-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * The ui/ui-plugin module controls the creation and display of the UI.
 */
define('ui/ui-plugin', [
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
], function (
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
		toolbar = new Toolbar(context, getToolbarSettings(), getResponsiveMode());

	var adoptedComponents = {};

	/** @type {Aloha.Surface} Currently the active Surface implementation to use/adopt into. */
	var activeSurface = toolbar;

	Aloha.bind('aloha-editable-activated', function (event, alohaEvent) {
		Surface.show(context);
		toolbar.setWidth();
		Container.showContainersForContext(context, event);
	});

	Aloha.bind('aloha-editable-deactivated', function (event, alohaEvent) {
		if (!Surface.suppressHide) {
			Surface.hide(context);
		}
	});

	PubSub.sub('aloha.ui.scope.change', function () {
		Container.showContainersForContext(context);
		primaryScopeForegroundTab();
	});

	function getToolbarSettings() {
		var userSettings = Aloha.settings.toolbar,
		    defaultSettings = Settings.defaultToolbarSettings;

		if (!userSettings) {
			return defaultSettings;
		}

		var defaultTabSettings = asNormalizedResponsiveSettings(defaultSettings, 'tabs');

		return Settings.combineToolbarSettings(
			asNormalizedResponsiveSettings(userSettings, 'tabs'),
			defaultTabSettings,
			asNormalizedResponsiveSettings(userSettings, 'exclude')
		);
	}

	function asNormalizedResponsiveSettings(settingsObj, propertyName) {
		if (settingsObj.hasOwnProperty(propertyName)) {
			return {
				mobile: settingsObj[propertyName],
				tablet: settingsObj[propertyName],
				desktop: settingsObj[propertyName],
			};
		}

		return {
			mobile: (settingsObj.mobile || {})[propertyName],
			tablet: (settingsObj.tablet || {})[propertyName],
			desktop: (settingsObj.desktop || {})[propertyName],
		};
	}

	function getResponsiveMode() {
		if (Aloha.settings.toolbar && Aloha.settings.toolbar.hasOwnProperty('responsiveMode')) {
			var value = Aloha.settings.toolbar.responsiveMode;
			return value.toString() === '1' || value === true || value.toString().toLowerCase() === 'true';
		}
		return false;
	}

	/* TODO: Check if this can be removed. Already defined in `toolbar.js` as well. */
	function primaryScopeForegroundTab() {
		if (!toolbar.active) {
			return;
		}

		var tabs = toolbar._tabs,
		    settings,
		    i;
		for (i = 0; i < tabs.length; i++) {
			settings = tabs[i].settings;
			if ('object' === $.type(settings.showOn) && Scopes.isActiveScope(settings.showOn.scope) && tabs[i].tab.hasVisibleComponents()) {
				tabs[i].tab.foreground();
				break;
			}
		}
	}

	/**
	 * Adopts a component instance into the UI.
	 *
	 * Usually, the implementation of this method will display the
	 * component, at a position in the UI given by the slot
	 * argument.
	 *
	 * @param slot
	 *        A position argument that is interpreted by the UI however it likes.
	 * @param component
	 *        An instance of a component to adopt into the given slot.
	 * @api
	 */
	function adoptInto(slot, component) {
		adoptedComponents[slot] = component;
		return activeSurface.adoptInto(slot, component);
	}

	function unadopt(slot) {
		delete adoptedComponents[slot];
		activeSurface.unadopt(slot);
	}

	function getActiveSurface() {
		return activeSurface;
	}

	/**
	 * Sets the current active Surface to handle all UI elements.
	 * @param {*} surface The surface instance which should be used.
	 * @param {boolean} replayAdoption If all previously adopted component calls should be replayed/applied to this surface instance.
	 * @param {boolean} removeFromOld If it should remove all adopted components from the old/previous surface.
	 */
	function setActiveSurface(surface, replayAdoption, removeFromOld) {
		if (activeSurface === surface) {
			return;
		}

		var oldSurface = activeSurface;
		activeSurface = surface;

		// Hide and show the toolbar if it is being de-/activated
		if (oldSurface != null) {
			oldSurface.disable();
			oldSurface.hide();
		}
		if (activeSurface != null) {
			activeSurface.enable();
			activeSurface.show();
		}

		if (replayAdoption || removeFromOld) {
			Object.entries(adoptedComponents).forEach(function(entry) {
				if (removeFromOld) {
					oldSurface.unadopt(entry[0]);
				}
				if (replayAdoption) {
					surface.adoptInto(entry[0], entry[1]);
				}
			});
		}
	}

	/**
	 * Shows the toolbar.
	 *
	 * By default, the toolbar will be hidden when no editable is
	 * activated, and shown when an editable is activated. Calling
	 * this function will show the toolbar regardless of whether an
	 * editable is activated.
	 *
	 * The toolbar will only become visible if tabs are visible as well.
	 * To make tabs visible, set a scope. For example
	 * Scopes.setScope('Aloha.continuoustext');
	 *
	 * Please note that the toolbar will not remain visible if an
	 * editable is subsequently deactivated.
	 *
	 * @param {?Object} event
	 *        An optional event argument that caused the toolbar to be show.
	 *        Will be passed on to Aloha.settings.toolbar.tabs[i].showOn functions.
	 * @api
	 */
	function showToolbar(event) {
		Surface.show(context);
		Container.showContainersForContext(context, event);
	}

	/**
	 * This module is part of the Aloha API.
	 * It is valid to override this module via requirejs to provide a
	 * custom behaviour. An overriding module must implement all API
	 * methods. Every member must have an api annotation. No non-api
	 * members are allowed.
	 * @api
	 */
	return {
		/**
		 * Adopts a component instance into the UI.
		 *
		 * Usually, the implementation of this method will display the
		 * component, at a position in the UI given by the slot
		 * argument.
		 *
		 * @param slot
		 *        A position argument that is interpreted by the UI however it likes.
		 * @param component
		 *        An instance of a component to adopt into the given slot.
		 * @api
		 */
		adoptInto: adoptInto,
		unadopt: unadopt,
		showToolbar: showToolbar,
		getContext: function() {
			return context;
		},
		getToolbarInstance: function() {
			return toolbar;
		},
		getToolbarSettings: getToolbarSettings,
		getActiveSurface: getActiveSurface,
		setActiveSurface: setActiveSurface,
	};
});
