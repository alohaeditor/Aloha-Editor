/** @typedef {import('../../ui/lib/contextButton.js').ContextButton} ContextButton */
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
	'util/html',
	'util/dom',
	'ui/ui',
	'ui/contextButton',
	'ui/icons',
	'i18n!align/nls/i18n',
	'jquery',
	'PubSub'
], function (
	Aloha,
	Plugin,
	AlignTableUtils,
	Html,
	DomLegacy,
	Ui,
	ContextButton,
	Icons,
	i18n,
	/** @type {JQueryStatic} */
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

	var HORIZONTAL_OPTIONS = {
		left: {
			id: 'left',
			label: i18n.t('button.alignleft.tooltip'),
			icon: Icons.ALIGN_LEFT,
		},
		center: {
			id: 'center',
			label: i18n.t('button.aligncenter.tooltip'),
			icon: Icons.ALIGN_CENTER,
		},
		right: {
			id: 'right',
			label: i18n.t('button.alignright.tooltip'),
			icon: Icons.ALIGN_RIGHT,
		},
		justify: {
			id: 'justify',
			label: i18n.t('button.alignjustify.tooltip'),
			icon: Icons.ALIGN_JUSTIFY,
		},
	};

	var VERTICAL_OPTIONS = {
		top: {
			id: 'top',
			label: i18n.t('button.aligntop.tooltip'),
			icon: Icons.ALIGN_TOP,
		},
		middle: {
			id: 'middle',
			label: i18n.t('button.alignmiddle.tooltip'),
			icon: Icons.ALIGN_MIDDLE,
		},
		bottom: {
			id: 'bottom',
			label: i18n.t('button.alignbottom.tooltip'),
			icon: Icons.ALIGN_BOTTOM,
		},

	};

	/**
	 * Icon which is displayed when no alignment could be determined
	 */
	var HORIZONTAL_DEFAULT_ICON = 'arrow_range';
	var VERTICAL_DEFAULT_ICON = 'height';
	var PROP_ALIGN_HORIZONTAL = 'text-align';
	var PROP_ALIGN_VERTICAL = 'vertical-align';

	/**
	 * register the plugin with unique name
	 */
	var plugin = {
		_constructor: function () {
			this._super('align');
		},
		/**
		 * Configuration (available align options)
		 */
		config: {
			alignment: ['right', 'left', 'center', 'justify', 'top', 'middle', 'bottom']
		},

		/** Current alignment of the formatable block */
		_currentHorizontalAlign: '',

		/** Current vertical alignment of the formatable block */
		_currentVerticalAlign: '',

		/** @type {ContextButton?} */
		_horizontalButton: null,

		/** @type {ContextButton?} */
		_verticalButton: null,

		/** @type {array.<string>} */
		_allowedHorizontals: [],

		/** @type {array.<string>} */
		_allowedVerticals: [],

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			plugin._horizontalButton = Ui.adopt('alignMenu', ContextButton, {
				tooltip: i18n.t('button.alignmenu.tooltip'),
				icon: HORIZONTAL_DEFAULT_ICON,
				contextType: 'dropdown',

				context: function () {
					const options = [];

					for (let i = 0; i < plugin._allowedHorizontals.length; i++) {
						var opt = HORIZONTAL_OPTIONS[plugin._allowedHorizontals[i]];
						if (opt) {
							options.push(opt);
						}
					}

					// Don't open the dropdown if no options are available
					if (options.length === 0) {
						return null;
					}

					return {
						type: 'select-menu',
						initialValue: plugin._currentHorizontalAlign,
						options: {
							options: options
						},
					}
				},

				contextResolve: function (selection) {
					if (plugin._currentHorizontalAlign === selection.id) {
						// Clear the value if it's already selected
						plugin._currentHorizontalAlign = '';
					} else {
						plugin._currentHorizontalAlign = selection.id;
					}

					plugin.align(selection.id);
					var option = HORIZONTAL_OPTIONS[plugin._currentHorizontalAlign];

					if (plugin._horizontalButton) {
						plugin._horizontalButton.setIcon(option != null ? option.icon : HORIZONTAL_DEFAULT_ICON);
					}
				},
			});

			plugin._verticalButton = Ui.adopt('vertAlignMenu', ContextButton, {
				tooltip: i18n.t('button.vertalignmenu.tooltip'),
				icon: VERTICAL_DEFAULT_ICON,
				contextType: 'dropdown',

				context: function () {
					const options = [];

					for (let i = 0; i < plugin._allowedVerticals.length; i++) {
						var opt = VERTICAL_OPTIONS[plugin._allowedVerticals[i]];
						if (opt) {
							options.push(opt);
						}
					}

					// Don't open the dropdown if no options are available
					if (options.length === 0) {
						return null;
					}

					return {
						type: 'select-menu',
						initialValue: plugin._currentVerticalAlign,
						options: {
							options: options
						},
					}
				},

				contextResolve: function (selection) {
					if (plugin._currentVerticalAlign === selection.id) {
						// Clear the value if it's already selected
						plugin._currentVerticalAlign = '';
					} else {
						plugin._currentVerticalAlign = selection.id;
					}

					plugin.align(selection.id, PROP_ALIGN_VERTICAL);
					var option = VERTICAL_OPTIONS[plugin._currentVerticalAlign];

					if (plugin._verticalButton) {
						plugin._verticalButton.setIcon(option != null ? option.icon : VERTICAL_DEFAULT_ICON);
					}
				},
			});

			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated', function (e, params) {
				plugin.applyButtonConfig(params.editable.obj);
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				var rangeObject = message.range;

				if (Aloha.activeEditable) {
					plugin._updateCurrentAlignments(rangeObject);
				}
			});
		},

		_updateCurrentAlignments: function (rangeObject) {
			//reset current alignment
			plugin._currentHorizontalAlign = '';
			plugin._currentVerticalAlign = '';

			rangeObject.findMarkup(function (elem) {
				var $elem = jQuery(elem);
				var horz = $elem.css(PROP_ALIGN_HORIZONTAL);
				var vert = $elem.css(PROP_ALIGN_VERTICAL);

				if (!horz && !vert) {
					return;
				}

				plugin._currentHorizontalAlign = horz;
				plugin._currentVerticalAlign = vert;

				if (plugin._horizontalButton) {
					var opt = HORIZONTAL_OPTIONS[plugin._currentHorizontalAlign];
					plugin._horizontalButton.setIcon(opt != null ? opt.icon : HORIZONTAL_DEFAULT_ICON);
				}
				if (plugin._verticalButton) {
					var opt = VERTICAL_OPTIONS[plugin._currentVerticalAlign];
					plugin._verticalButton.setIcon(opt != null ? opt.icon : VERTICAL_DEFAULT_ICON);
				}

			}, Aloha.activeEditable.obj);
		},

		/**
		 * applies a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function (obj) {
			var config = plugin.getEditableConfig(obj);
			var allowedOptions = [];

			if (config && Array.isArray(config.alignment)) {
				allowedOptions = config.alignment;
			} else if (config && config[0] && Array.isArray(config[0].alignment)) {
				allowedOptions = config[0];
			} else if (Array.isArray(plugin.settings.alignment)) {
				allowedOptions = plugin.settings.alignment;
			} else {
				allowedOptions = [];
			}

			plugin._allowedHorizontals = allowedOptions.filter(function(name) {
				return HORIZONTAL_OPTIONS[name] != null;
			});
			plugin._allowedVerticals = allowedOptions.filter(function(name) {
				return VERTICAL_OPTIONS[name] != null;
			});

			if (plugin._horizontalButton) {
				if (plugin._allowedHorizontals.length <= 1) {
					plugin._horizontalButton.hide();
				} else {
					plugin._horizontalButton.show();
				}
			}

			if (plugin._verticalButton) {
				if (plugin._allowedVerticals.length <= 1) {
					plugin._verticalButton.hide();
				} else {
					plugin._verticalButton.show();
				}
			}
		},

		/**
		 * Sets or removes the alignment on the selected range.
		 *
		 * @param {string} alignment
		 * @param {string?} property
		 */
		align: function (alignment, property) {
			var elements = getCurrentSelectedBlockElements();
			plugin.toggleAlign(elements, property, alignment);
		},

		getSelectedCells: function (range) {
			var selectedCell;

			var activeTable = range.findMarkup(function (elem) {
				var $elem = jQuery(elem);
				if ($elem.is('td,th')) {
					selectedCell = elem;
				}
				return $elem.is('table.aloha-table');
			}, Aloha.activeEditable.obj);

			var selectedCells = jQuery(activeTable).find('.aloha-cell-selected');

			return selectedCells.length ? selectedCells : selectedCell;
		},

		/**
		 * Toggle the align property of given DOM object(s)
		 */
		toggleAlign: function (domObj, property, value) {
			property = property || PROP_ALIGN_HORIZONTAL;

			var newAlignment = value;
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
	};

	plugin = Plugin.create('align', plugin);

	return plugin;
});
