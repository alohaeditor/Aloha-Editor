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
	'ui/toggleButton',
	'ui/button',
	'ui/scopes',
	'ui/port-helper-attribute-field',
	'i18n!abbr/nls/i18n',
	'i18n!aloha/nls/i18n'
], function (
	Aloha,
	jQuery,
	PubSub,
	Plugin,
	ContentRules,
	Ui,
	ToggleButton,
	Button,
	Scopes,
	AttributeField,
	i18n,
	i18nCore
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

		PubSub.sub('aloha.selection.context-change', function (message) {
			if (!Aloha.activeEditable) {
				return;
			}

			if (!configurations[Aloha.activeEditable.getId()]) {
				plugin._formatAbbrButton.hide();
				plugin._insertAbbrButton.hide();
				return;
			}

			plugin._formatAbbrButton.show();
			plugin._insertAbbrButton.show();

			var range = message.range;
			var foundMarkup = plugin.findAbbrMarkup(range);

			if (foundMarkup) {
				plugin.abbrField.show();
				plugin.remAbbrButton.show();
				plugin.abbrField.setTargetObject(foundMarkup, 'title');
				plugin._formatAbbrButton.setState(true);
				plugin._insertAbbrButton.hide();
				addAdditionalTargetObject(range, plugin.abbrField);
				Scopes.enterScope(plugin.name, 'abbr');
			} else {
				plugin.abbrField.hide();
				plugin.remAbbrButton.hide();
				plugin.abbrField.setTargetObject(null);
				plugin._formatAbbrButton.setState(false);
				Scopes.leaveScope(plugin.name, 'abbr', true);
			}
		});
	}

	/**
	 * Add additional target objects, in case the selection includes several
	 * abbrs tag.
	 *
	 * @param {RangeObject} rangeObject Selection Range
	 * @param {LinkPlugin} that Link Plugin object
	 */
	function addAdditionalTargetObject(rangeObject, field) {
		var abbrs = rangeObject.findAllMarkupByTagName('ABBR', rangeObject);
		for (var i = 0, len = abbrs.length; i < len; i++) {
			field.addAdditionalTargetObject(abbrs[i]);
		}
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
		    var me = this;

			this._formatAbbrButton = Ui.adopt("formatAbbr", ToggleButton, {
				tooltip: i18n.t("button.abbr.tooltip"),
				icon: "aloha-icon aloha-icon-abbr",
				scope: 'Aloha.continuoustext',
				click: function () {
					me.formatAbbr();
				}
			});

			this._insertAbbrButton = Ui.adopt("insertAbbr", Button, {
				tooltip: i18n.t('button.addabbr.tooltip'),
				icon: 'aloha-icon aloha-icon-abbr',
				scope: 'Aloha.continuoustext',
				click: function () {
					me.insertAbbr(false);
				}
			});

			this.abbrField = new AttributeField({
				width: 320,
				name: 'abbrText',
				scope: 'Aloha.continuoustext'
			});

			this.remAbbrButton = Ui.adopt("removeAbbr", Button, {
				tooltip: i18n.t('button.remabbr.tooltip'),
				icon: 'aloha-icon aloha-icon-abbr-rem',
				scope: 'Aloha.continuoustext',
				click: function () {
					me.removeAbbr();
				}
			});
		},

		/**
		 * Parse a all editables for abbreviations
		 * Add the abbr shortcut to all edtiables
		 */
		bindInteractions: function () {
			var me = this;
			
			// on blur check if abbr title is empty. If so remove the a tag
			this.abbrField.addListener('blur', function (obj, event) {
				if (this.getValue() == '') {
					me.removeAbbr();
				}
			});

			// add to all editables the abbr shortcut
			for (var i = 0; i < Aloha.editables.length; i++) {
				// CTRL+G
				Aloha.editables[i].obj.keydown(function (e) {
					if (e.metaKey && e.which == 71) {
						if (me.findAbbrMarkup()) {
							me.abbrField.foreground();
							me.abbrField.focus();
						} else {
							me.insertAbbr();
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
		 * Format the current selection or if collapsed the current word as abbr.
		 * If inside a abbr tag the abbr is removed.
		 */
		formatAbbr: function () {
			var range = Aloha.Selection.getRangeObject();

			if (Aloha.activeEditable) {
				if (this.findAbbrMarkup(range)) {
		            this.removeAbbr();
		        } else {
		            this.insertAbbr();
		        }
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

			this.abbrField.foreground();
			this.abbrField.focus();
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
