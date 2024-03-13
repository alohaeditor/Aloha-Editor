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

	var configurations = {};

	function insertHR() {
		if (Aloha.activeEditable) {
			var range = Aloha.Selection.getRangeObject();
			Dom.insertIntoDOM($('<hr>'), range, Aloha.activeEditable.obj, true);
			range.select();
		}
	}

	var button;

	return Plugin.create('horizontalruler', {

		_constructor: function () {
			this._super('horizontalruler');
		},

		config: ['hr'],

		init: function () {
			var plugin = this;

			button = Ui.adopt('insertHorizontalRule', Button, {
				tooltip: i18n.t('button.addhr.tooltip'),
				iconOnly: true,
				icon: Icons.HORIZONTAL_RULE,
				click: insertHR
			});

			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);
				var enabled = config
				           && ($.inArray('hr', config) > -1)
				           && ContentRules.isAllowed(editable.obj[0], 'hr');
				configurations[editable.getId()] = !!enabled;
			});

			PubSub.sub('aloha.editable.destroyed', function (message) {
				delete configurations[message.editable.getId()];
			});

			PubSub.sub('aloha.editable.activated', function (message) {
				button.show(!!configurations[message.editable.getId()]);
			});
		}

	});

});

