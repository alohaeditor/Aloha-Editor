/** @typedef {import('../../ui/lib/button').Button} Button */
/* horizontalruler-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * License http://aloha-editor.org/license.php
 */
define([
	'jquery',
	'aloha',
	'PubSub',
	'aloha/plugin',
	'aloha/content-rules',
	'util/dom',
	'ui/ui',
	'ui/icons',
	'ui/button',
	'i18n!horizontalruler/nls/i18n'
], function (
	$,
	Aloha,
	PubSub,
	Plugin,
	ContentRules,
	Dom,
	Ui,
	Icons,
	Button,
	i18n
) {
	'use strict';

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			HorizontalRulerPlugin._insertButton.hide();
			return;
		}

		var config = HorizontalRulerPlugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray('hr', config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], 'hr');

		if (enabled) {
			HorizontalRulerPlugin._insertButton.show();
		} else {
			HorizontalRulerPlugin._insertButton.hide();
		}
	}

	var HorizontalRulerPlugin = {

		config: ['hr'],

		/** @type {Button} */
		_insertButton: null,

		init: function () {
			HorizontalRulerPlugin._insertButton = Ui.adopt('insertHorizontalRule', Button, {
				tooltip: i18n.t('button.addhr.tooltip'),
				iconOnly: true,
				icon: Icons.HORIZONTAL_RULE,
				click: function() {
					HorizontalRulerPlugin.insertHR();
				},
			});

			// Set the button visible if it's enabled via the config
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				checkVisibility(editable);
			});

			// Reset and hide the button when leaving an editable
			PubSub.sub('aloha.editable.deactivated', function () {
				HorizontalRulerPlugin._insertButton.hide();
			});

			checkVisibility(Aloha.activeEditable);
		},

		insertHR: function () {
			if (Aloha.activeEditable) {
				var range = Aloha.Selection.getRangeObject();
				Dom.insertIntoDOM($('<hr>'), range, Aloha.activeEditable.obj, true);
				range.select();
			}
		}
	};

	HorizontalRulerPlugin = Plugin.create('horizontalruler', HorizontalRulerPlugin);

	return HorizontalRulerPlugin;
});

