/* align-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
define([
	'aloha',
	'aloha/plugin',
	'align/align-table-utils',
	'util/arrays',
	'util/html',
	'util/dom',
	'ui/ui',
	'ui/contextButton',
	'ui/icons',
	'i18n!align/nls/i18n',
	'i18n!aloha/nls/i18n',
	'jquery',
	'PubSub'
], function (
	Aloha,
	Plugin,
	AlignTableUtils,
	Arrays,
	Html,
	DomLegacy,
	Ui,
	ContextButton,
	Icons,
	i18n,
	i18nCore,
	jQuery,
	PubSub
) {
	'use strict';

	/**
	 * Gets block elements inside `range`.
	 * @return {Array}
	 */
	function getCurrentSelectedBlockElements() {
		var range = Aloha.Selection.getRangeObject();
		var selection = range.getRangeTree(),
			cac = range.getCommonAncestorContainer(),
			elements = [];
		var cells, i, len;

		jQuery.each(selection, function () {
			var node = this.domobj;
			if (this.type === 'none' || !node) {
				return;
			}
			if (Html.isBlock(node)) {
				elements.push(node);
				return;
			}
			// Because the align-text property needs to be set on a block-level
			// element in order for it to have visual effect
			while (node && !Html.isBlock(node)) {
				if ((Html.isBlock(cac) && cac === node.parentNode) ||
					DomLegacy.isEditingHost(node.parentNode)) {
					break;
				}
				node = node.parentNode;
			}
			if (Html.isBlock(node)) {
				elements.push(node);
			}
		});

		if (elements.length === 0 && selection.length > 0 && Html.isBlock(cac) && !DomLegacy.isEditingHost(cac)) {
			elements.push(cac);
		}

		if (AlignTableUtils.isInsideTable(cac)) {
			elements = AlignTableUtils.getSelectedTableCells(cac, elements);
		}
		return elements;
	}

	function getAlignmentIcon(alignment) {
		switch (alignment) {
			case 'left':
				return Icons.MAPPING.ALIGN_LEFT;
			case 'center':
				return Icons.MAPPING.ALIGN_CENTER;
			case 'right':
				return Icons.MAPPING.ALIGN_RIGHT;
			case 'justify':
				return Icons.MAPPING.ALIGN_JUSTIFY;
		}
	}

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create('align', {
		_constructor: function () {
			this._super('align');
		},
		/**
		 * Configuration (available align options)
		 */
		config: {
			alignment: ['right', 'left', 'center', 'justify', 'top', 'middle', 'bottom']
		},

		/**
		 * Alignment wanted by the user
		 */
		alignment: '',

		verticalAlignment: '',

		/**
		 * Alignment of the selection before modification
		 */
		lastAlignment: '',

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			var that = this;
			var availableOptions = [
				{
					id: 'left',
					label: 'Left',
					icon: Icons.MAPPING.ALIGN_LEFT,
				},
				{
					id: 'center',
					label: 'Center',
					icon: Icons.MAPPING.ALIGN_CENTER,
				},
				{
					id: 'right',
					label: 'Right',
					icon: Icons.MAPPING.ALIGN_RIGHT,
				},
				{
					id: 'justify',
					label: 'Justify',
					icon: Icons.MAPPING.ALIGN_JUSTIFY,
				}
			];

			that.alignmentButton = Ui.adopt('alignMenu', ContextButton, {
				tooltip: i18n.t('button.addcharacter.tooltip'),
				icon: Icons.MAPPING.ALIGN_LEFT,
				contextType: 'dropdown',

				context: function() {
					const options = [];

					for (let i = 0; i < availableOptions.length; i++) {
						const option = availableOptions[i];

						if (jQuery.inArray(option.id, that.settings.alignment) >= 0) {
							options.push(option);
						}
					}

					return {
						type: 'select-menu',
						initialValue: that.alignment,
						options: {
							iconsOnly: true,
							options: options
						},
					}
				},

				contextResolve: function(alignment) {
					that.alignment = alignment;

					that.align(alignment);

					if (that.alignmentButton) {
						that.alignmentButton.setIcon(getAlignmentIcon(that.alignment))
					}
				},
			});

			var that = this;

			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated', function (e, params) {
				that.applyButtonConfig(params.editable.obj);
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				var rangeObject = message.range;

				if (Aloha.activeEditable) {
					that.buttonPressed(rangeObject);
				}
			});
		},

		buttonPressed: function (rangeObject) {
			this.horizontalButtonPressed(rangeObject);
		},

		horizontalButtonPressed: function (rangeObject) {
			var that = this;

			this.lastAlignment = this.alignment;

			//reset current alignment
			this.alignment = '';

			rangeObject.findMarkup(function () {
				// try to find explicitly defined text-align style property
				if (this.style.textAlign !== "") {
					that.alignment = this.style.textAlign;
					return true;
				}

				that.alignment = jQuery(this).css('text-align');
			}, Aloha.activeEditable.obj);
		},

		/**
		 * applies a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function (obj) {
			var config = this.getEditableConfig(obj);

			if ( config && config.alignment && !this.settings.alignment ) {
				config = config;
			} else if ( config[0] && config[0].alignment) {
				config = config[0];
			} else if (this.settings.alignment) {
				config.alignment = this.settings.alignment;
			}

			if (typeof config.alignment !== 'undefined') {
				this.settings.alignment = config.alignment;
			}
		},

		/**
		 * Sets or removes the alignment on the selected range.
		 *
		 * @param {string} alignment
		 */
		align: function (alignment) {
			this.lastAlignment = this.alignment;
			this.alignment = alignment;

			var elements = getCurrentSelectedBlockElements();
			this.toggleAlign(elements);
		},

		getSelectedCells: function (range) {

			var selectedCell;

			var activeTable = range.findMarkup(function () {
				if (jQuery(this).is('td,th')) {
					selectedCell = this;
				}
				return jQuery(this).is('table.aloha-table');
			}, Aloha.activeEditable.obj);

			var selectedCells = jQuery(activeTable).find('.aloha-cell-selected');

			return selectedCells.length ? selectedCells : selectedCell;

		},

		/**
		 * Toggle the align property of given DOM object(s)
		 */
		toggleAlign: function (domObj, property) {
			var that = this;

			property = property || 'text-align';

			var newAlignment = that.alignment;
			var shouldRemoveAlignment = true;

			jQuery(domObj).each(function () {
				var currentAlignment = jQuery(this).css(property);

				if (currentAlignment != newAlignment) {
					shouldRemoveAlignment = false;
					return false;
				}
			});

			jQuery(domObj).each(function () {
				var currentAlignment = jQuery(this).css(property);

				if ((currentAlignment == newAlignment) && shouldRemoveAlignment) {
					jQuery(this).css(property, '');
				} else {
					jQuery(this).css(property, newAlignment);
				}

			});
		}
	});
});
