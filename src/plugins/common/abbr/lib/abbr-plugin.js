/* abbr-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/content-rules',
	'aloha/keybinds',
	'ui/ui',
	'ui/icons',
	'ui/attributeToggleButton',
	'ui/scopes',
	'i18n!abbr/nls/i18n',
], function (
	Aloha,
	$,
	PubSub,
	Plugin,
	ContentRules,
	Keybinds,
	Ui,
	Icons,
	AttributeToggleButton,
	Scopes,
	i18n
) {
	'use strict';

	var GENTICS = window.GENTICS;

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			AbbreviationPlugin._formatAbbrButton.hide();
			return;
		}

		var config = AbbreviationPlugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray('abbr', config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], 'abbr');

		if (enabled) {
			AbbreviationPlugin._formatAbbrButton.show();
		} else {
			AbbreviationPlugin._formatAbbrButton.hide();
		}
	}

	/**
	 * Subscribes event handlers to facilitate user interaction on editables.
	 */
	function registerEventHandlers() {
		// Set the button visible if it's enabled via the config
		PubSub.sub('aloha.editable.activated', function (message) {
			var editable = message.editable;
			checkVisibility(editable);
		});

		// Reset and hide the button when leaving an editable
		PubSub.sub('aloha.editable.deactivated', function () {
			AbbreviationPlugin._formatAbbrButton.hide();
			AbbreviationPlugin._formatAbbrButton.setActive(false);
			AbbreviationPlugin._formatAbbrButton.deactivateInput();
			AbbreviationPlugin._formatAbbrButton.setTargetElement(null);
			Scopes.leaveScope(AbbreviationPlugin.name);
		});

		// Handle the active-state of the button
		PubSub.sub('aloha.selection.context-change', function (message) {
			var range = message.range;
			var foundMarkup = AbbreviationPlugin.findAbbrMarkup(range);

			if (foundMarkup) {
				AbbreviationPlugin._formatAbbrButton.setActive(true);
				AbbreviationPlugin._formatAbbrButton.activateInput(true);
				AbbreviationPlugin._formatAbbrButton.setTargetElement($(foundMarkup));
				Scopes.enterScope(AbbreviationPlugin.name);
			} else {
				AbbreviationPlugin._formatAbbrButton.setActive(false);
				AbbreviationPlugin._formatAbbrButton.deactivateInput();
				AbbreviationPlugin._formatAbbrButton.setTargetElement(null);
				Scopes.leaveScope(AbbreviationPlugin.name);
			}
		});
	}

	/**
	 * register the plugin with unique name
	 */
	var AbbreviationPlugin = {
		/**
		 * default button configuration
		 */
		config: ['abbr'],

		_formatAbbrButton: null,

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			AbbreviationPlugin.createButtons();

			Aloha.bind('aloha-editable-created', function (e, editable) {
				Keybinds.bind(editable.obj, 'abbr', Keybinds.asKeybind([Keybinds.MOD_CONTROL_OR_META, 'g']), function() {
					if (AbbreviationPlugin.findAbbrMarkup()) {
						AbbreviationPlugin.removeAbbr();
					} else {
						AbbreviationPlugin.insertAbbr();
					}
				});
			});

			registerEventHandlers();
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			AbbreviationPlugin._formatAbbrButton = Ui.adopt("formatAbbr", AttributeToggleButton, {
				tooltip: i18n.t("button.abbr.tooltip"),
				icon: Icons.ABBREVIATION,
				targetAttribute: 'title',
				inputLabel: i18n.t('input.label'),
				panelLabel: i18n.t('panel.label'),
				pure: true,
				onToggle: function (activated) {
					if (activated) {
						AbbreviationPlugin.insertAbbr(true);
						AbbreviationPlugin._formatAbbrButton.setActive(true);
					} else {
						AbbreviationPlugin.removeAbbr();
						AbbreviationPlugin._formatAbbrButton.setActive(false);
					}
				},
			});

			checkVisibility(Aloha.activeEditable);
		},

		/**
		 * Check whether inside a abbr tag
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
		 * @return markup
		 * @hide
		 */
		findAbbrMarkup: function (range) {
			if (typeof range == 'undefined') {
				range = Aloha.Selection.getRangeObject();
			}

			if (!Aloha.activeEditable) {
				return null;
			}

			return range.findMarkup(function () {
				return this.nodeName.toLowerCase() == 'abbr';
			}, Aloha.activeEditable.obj);
		},

		/**
		 * Insert a new abbr at the current selection. When the selection is collapsed,
		 * the abbr will have a default abbr text, otherwise the selected text will be
		 * the abbr text.
		 */
		insertAbbr: function (extendToWord) {
			// current selection or cursor position
			var range = Aloha.Selection.getRangeObject();

			// do not insert a abbr in a abbr
			if (AbbreviationPlugin.findAbbrMarkup(range)) {
				return;
			}

			// if selection is collapsed then extend to the word.
			if (range.isCollapsed() && extendToWord != false) {
				GENTICS.Utils.Dom.extendToWord(range);
			}

			if (range.isCollapsed()) {
				// insert a abbr with text here
				var abbrText = i18n.t('newabbr.defaulttext');
				var newAbbr = $('<abbr title="">' + abbrText + '</abbr>');
				GENTICS.Utils.Dom.insertIntoDOM(newAbbr, range, jQuery(Aloha.activeEditable.obj));
				range.startContainer = range.endContainer = newAbbr.contents().get(0);
				range.startOffset = 0;
				range.endOffset = abbrText.length;
			} else {
				var newAbbr = $('<abbr title=""></abbr>');
				GENTICS.Utils.Dom.addMarkup(range, newAbbr, false);
			}

			range.select();
		},

		/**
		 * Remove an a tag.
		 */
		removeAbbr: function () {
			var range = Aloha.Selection.getRangeObject();
			var foundMarkup = AbbreviationPlugin.findAbbrMarkup();
			if (foundMarkup) {
				// remove the abbr
				GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
				// select the (possibly modified) range
				range.select();
			}
		},

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all abbrs and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {
			// nothing to do...
		},

		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'abbr';
		}
	};

	AbbreviationPlugin = Plugin.create('abbr', AbbreviationPlugin);

	return AbbreviationPlugin;
});
