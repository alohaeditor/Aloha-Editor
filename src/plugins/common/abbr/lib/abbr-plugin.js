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
	'ui/ui',
	'ui/icons',
	'ui/attributeToggleButton',
	'ui/scopes',
	'i18n!abbr/nls/i18n',
], function (
	Aloha,
	jQuery,
	PubSub,
	Plugin,
	ContentRules,
	Ui,
	Icons,
	AttributeToggleButton,
	Scopes,
	i18n
) {
	'use strict';

	var GENTICS = window.GENTICS;
	var $ = jQuery;
	var configurations = {};

	/**
	 * Subscribes event handlers to facilitate user interaction on editables.
	 *
	 * @private
	 * @param {ListPlugin} plugin
	 */
	function registerEventHandlers(plugin) {
		PubSub.sub('aloha.editable.created', function (message) {
			var editable = message.editable;
			var config = plugin.getEditableConfig(editable.obj);
			var enabled = config
			           && ($.inArray('abbr', config) > -1)
			           && ContentRules.isAllowed(editable.obj[0], 'abbr');
			configurations[editable.getId()] = !!enabled;
		});

		PubSub.sub('aloha.editable.destroyed', function (message) {
			delete configurations[message.editable.getId()];
		});

		/**
		 * Flag for proper deactivation handling.
		 * The context-change event triggers after editable-deactivated.
		 * One weird quirk is however, that event after/during editable-deactivated,
		 * the `activeEditable` is still set.
		 * Therefore the context-change would enable the button again, which is wrong.
		 */
		var actuallyLeftEditable = false;

		PubSub.sub('aloha.selection.context-change', function (message) {
			if (!Aloha.activeEditable || actuallyLeftEditable) {
				return;
			}

			if (!configurations[Aloha.activeEditable.getId()]) {
				plugin._formatAbbrButton.hide();
				return;
			}

			plugin._formatAbbrButton.show();

			var range = message.range;
			var foundMarkup = plugin.findAbbrMarkup(range);

			if (foundMarkup) {
				plugin._formatAbbrButton.setActive(true);
				plugin._formatAbbrButton.activateInput(true);
				plugin._formatAbbrButton.setTargetElement($(foundMarkup));
				Scopes.enterScope(plugin.name);
			} else {
				plugin._formatAbbrButton.setActive(false);
				plugin._formatAbbrButton.deactivateInput();
				plugin._formatAbbrButton.setTargetElement(null);
				Scopes.leaveScope(plugin.name);
			}
		});

		Aloha.bind('aloha-editable-activated', function() {
			actuallyLeftEditable = false;
		});

		Aloha.bind('aloha-editable-deactivated', function(event, params) {
			if (params.newEditable == null) {
				plugin._formatAbbrButton.setActive(false);
				plugin._formatAbbrButton.deactivateInput();
				plugin._formatAbbrButton.setTargetElement(null);
				Scopes.leaveScope(plugin.name);
				actuallyLeftEditable = true;
			}
		})
	}

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create('abbr', {
		/**
		 * default button configuration
		 */
		config: [ 'abbr' ],

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			this.createButtons();
		    this.bindInteractions();
		    registerEventHandlers(this);
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
		    var that = this;

			this._formatAbbrButton = Ui.adopt("formatAbbr", AttributeToggleButton, {
				tooltip: i18n.t("button.abbr.tooltip"),
				icon: Icons.ABBREVIATION,
				targetAttribute: 'title',
				inputLabel: i18n.t('input.label'),
				panelLabel: i18n.t('panel.label'),
				pure: true,
				onToggle: function (activated) {
					if (activated) {
						that.insertAbbr(true);
						that._formatAbbrButton.setActive(true);
					} else {
						that.removeAbbr();
						that._formatAbbrButton.setActive(false);
					}
				},
			});
		},

		/**
		 * Parse a all editables for abbreviations
		 * Add the abbr shortcut to all edtiables
		 */
		bindInteractions: function () {
			var that = this;


			// add to all editables the abbr shortcut
			for (var i = 0; i < Aloha.editables.length; i++) {
				// CTRL+G
				Aloha.editables[i].obj.keydown(function (e) {
					if (e.metaKey && e.which == 71) {
						if (that.findAbbrMarkup()) {
							that.removeAbbr();
						} else {
							that.insertAbbr();
						}

						// prevent from further handling
						// on a MAC Safari cursor would jump to location bar. Use ESC then META+L
						e.stopPropagation();
						e.preventDefault();

						return false;
					}
				});
			}
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

			if (Aloha.activeEditable) {
				return range.findMarkup( function() {
					return this.nodeName.toLowerCase() == 'abbr';
				}, Aloha.activeEditable.obj);
			} else {
				return null;
			}
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
			if (this.findAbbrMarkup(range)) {
				return;
			}

			// if selection is collapsed then extend to the word.
			if (range.isCollapsed() && extendToWord != false) {
				GENTICS.Utils.Dom.extendToWord(range);
			}

			if (range.isCollapsed()) {
		        // insert a abbr with text here
		        var abbrText = i18n.t('newabbr.defaulttext');
		        var newAbbr = jQuery('<abbr title="">' + abbrText + '</abbr>');
		        GENTICS.Utils.Dom.insertIntoDOM(newAbbr, range, jQuery(Aloha.activeEditable.obj));
		        range.startContainer = range.endContainer = newAbbr.contents().get(0);
		        range.startOffset = 0;
		        range.endOffset = abbrText.length;
		    } else {
				var newAbbr = jQuery('<abbr title=""></abbr>');
		        GENTICS.Utils.Dom.addMarkup(range, newAbbr, false);
		    }

		    range.select();
		},

		/**
		 * Remove an a tag.
		 */
		removeAbbr: function () {
		    var range = Aloha.Selection.getRangeObject();
		    var foundMarkup = this.findAbbrMarkup();
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

	});

});
