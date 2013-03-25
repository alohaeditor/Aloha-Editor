/* format-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
define('format/format-plugin', [
	'aloha',
	'aloha/plugin',
	'aloha/state-override',
	'jquery',
	'util/arrays',
	'util/maps',
	'ui/ui',
	'ui/toggleButton',
	'ui/port-helper-multi-split',
	'PubSub',
	'i18n!format/nls/i18n',
	'i18n!aloha/nls/i18n',
	'aloha/selection'
], function (
	Aloha,
	Plugin,
	StateOverride,
	jQuery,
	Arrays,
	Maps,
	Ui,
	ToggleButton,
	MultiSplitButton,
	PubSub,
	i18n,
	i18nCore
) {
	'use strict';

	var GENTICS = window.GENTICS;
	var pluginNamespace = 'aloha-format';
	var commandsByElement = {
		'b': 'bold',
		'strong': 'bold',
		'i': 'italic',
		'em': 'italic',
		'del': 'strikethrough',
		'sub': 'subscript',
		'sup': 'superscript',
		'u': 'underline',
		's': 'strikethrough'
	};
	var componentNameByElement = {
		'strong': 'strong',
		'em': 'emphasis',
		's': 'strikethrough2'
	};
	var textLevelSemantics = {
		'u': true,
		'em': true,
		'strong': true,
		'b': true,
		'i': true,
		'cite': true,
		'q': true,
		'code': true,
		'abbr': true,
		'del': true,
		's': true,
		'sub': true,
		'sup': true
	};
	var blockLevelSemantics = {
		'p': true,
		'h1': true,
		'h2': true,
		'h3': true,
		'h4': true,
		'h5': true,
		'h6': true,
		'pre': true
	};
	var interchangeableNodeNames = {
		"B": ["STRONG", "B"],
		"I": ["EM", "I"],
		"STRONG": ["STRONG", "B"],
		"EM": ["EM", "I"]
	};

	function formatInsideTableWorkaround(button) {
		var selectedCells = jQuery('.aloha-cell-selected');
		if (selectedCells.length > 0) {
			var cellMarkupCounter = 0;
			selectedCells.each(function () {
				var cellContent = jQuery(this).find('div'),
				cellMarkup = cellContent.find(button);
				if (cellMarkup.length > 0) {
					// unwrap all found markup text
					// <td><b>text</b> foo <b>bar</b></td>
					// and wrap the whole contents of the <td> into <b> tags
					// <td><b>text foo bar</b></td>
					cellMarkup.contents().unwrap();
					cellMarkupCounter++;
				}
				cellContent.contents().wrap('<'+button+'></'+button+'>');
			});

			// remove all markup if all cells have markup
			if (cellMarkupCounter === selectedCells.length) {
				selectedCells.find(button).contents().unwrap();
			}
			return true;
		}
		return false;
	}

	function textLevelButtonClickHandler(formatPlugin, button) {
		if (formatInsideTableWorkaround(button)) {
			return false;
		}
		formatPlugin.addMarkup( button ); 
		return false;
	}

	function blockLevelButtonClickHandler(formatPlugin, button) {
		if (formatInsideTableWorkaround(button)) {
			return false;
		}

		formatPlugin.changeMarkup( button );

		// setting the focus is needed for mozilla to have a working rangeObject.select()
		if (Aloha.activeEditable && jQuery.browser.mozilla) {
			Aloha.activeEditable.obj.focus();
		}
		
		// triggered for numerated-headers plugin
		if (Aloha.activeEditable) {
			Aloha.trigger( 'aloha-format-block' );
		}
	}

	function makeTextLevelButton(formatPlugin, button) {
		var command = commandsByElement[button];
		var componentName = command;
		if (componentNameByElement.hasOwnProperty(button)) {
			componentName = componentNameByElement[button];
		}
		var component = Ui.adopt(componentName, ToggleButton, {
			tooltip : i18n.t('button.' + button + '.tooltip'),
			icon: 'aloha-icon aloha-icon-' + componentName,
			scope: 'Aloha.continuoustext',
			click: function () { return textLevelButtonClickHandler(formatPlugin, button); }
		});
		return component;
	}

	function makeBlockLevelButton(formatPlugin, button) {
		return {
			name: button,
			tooltip: i18n.t('button.' + button + '.tooltip'),
			iconClass: 'aloha-icon ' + i18n.t('aloha-large-icon-' + button),
			markup: jQuery('<' + button + '>'),
			click: function () { return blockLevelButtonClickHandler(formatPlugin, button); }
		};
	}

	function makeRemoveFormatButton(formatPlugin, button) {
		return {
			name: button,
			text: i18n.t('button.' + button + '.text'),
			tooltip: i18n.t('button.' + button + '.tooltip'),
			wide: true,
			cls: 'aloha-ui-multisplit-fullwidth',
			click: function () {
				formatPlugin.removeFormat();
			}
		};
	}

	function changeMarkup(button) {
		Aloha.Selection.changeMarkupOnSelection(jQuery('<' + button + '>'));
	}

	function updateUiAfterMutation(formatPlugin, rangeObject) {
		// select the modified range
		rangeObject.select();
		// update Button toggle state. We take 'Aloha.Selection.getRangeObject()'
		// because rangeObject is not up-to-date
		onSelectionChanged(formatPlugin, Aloha.Selection.getRangeObject());
	}

	function format(formatPlugin, rangeObject, markup, remove, limit) {
		if (remove) {
			GENTICS.Utils.Dom.removeMarkup(rangeObject, markup, limit);
		} else {
			GENTICS.Utils.Dom.addMarkup(rangeObject, markup);
		}
		updateUiAfterMutation(formatPlugin, rangeObject);
	}

	function addMarkup(button) {
		var formatPlugin = this;
		var markup = jQuery('<'+button+'>');
		var rangeObject = Aloha.Selection.rangeObject;
		var limit = Aloha.activeEditable.obj;

		if ( typeof button === "undefined" || button == "" ) {
			return;
		}

		// check whether the markup is found in the range (at the start of the range)
		var nodeNames = interchangeableNodeNames[markup[0].nodeName] || [markup[0].nodeName];
		var foundMarkup = rangeObject.findMarkup(function() {
			return -1 !== Arrays.indexOf(nodeNames, this.nodeName);
		}, limit);
		if (foundMarkup) {
			markup = jQuery(foundMarkup);
		}

		if (rangeObject.isCollapsed()) {
			GENTICS.Utils.Dom.extendToWord(rangeObject);
			if (rangeObject.isCollapsed()) {
				if (StateOverride.enabled()) {
					StateOverride.setWithRangeObject(
						commandsByElement[button],
						rangeObject,
						function (command, rangeObject) {
							format(formatPlugin, rangeObject, markup, foundMarkup, limit);
						}
					);
					return;
				}
			}
		}

		format(formatPlugin, rangeObject, markup, foundMarkup, limit);
	}

	function onSelectionChanged(formatPlugin, rangeObject) {
		var effectiveMarkup,
		    foundMultiSplit, i, j, multiSplitItem;

		jQuery.each(formatPlugin.buttons, function (index, button) {
			var statusWasSet = false;
			var nodeNames = interchangeableNodeNames[button.markup[0].nodeName] || [button.markup[0].nodeName];
			for (i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[i];
				for (j = 0; j < nodeNames.length; j++) {
					if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, jQuery('<' + nodeNames[j] + '>'))) {
						button.handle.setState(true);
						statusWasSet = true;
					}
				}
			}
			if (!statusWasSet) {
				button.handle.setState(false);
			}
		});

		if (formatPlugin.multiSplitItems.length > 0) {
			foundMultiSplit = false;

			// iterate over the markup elements
			for (i = 0; i < rangeObject.markupEffectiveAtStart.length && !foundMultiSplit; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[i];

				for (j = 0; j < formatPlugin.multiSplitItems.length && !foundMultiSplit; j++) {
					multiSplitItem = formatPlugin.multiSplitItems[j];

					if (!multiSplitItem.markup) {
						continue;
					}

					// now check whether one of the multiSplitItems fits to the effective markup
					if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, multiSplitItem.markup)) {
						formatPlugin.multiSplitButton.setActiveItem(multiSplitItem.name);
						foundMultiSplit = true;
					}
				}
			}

			if (!foundMultiSplit) {
				formatPlugin.multiSplitButton.setActiveItem(null);
			}
		}
	}

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create('format', {
		/**
		 * default button configuration
		 */
		config: [ 'b', 'i', 'sub', 'sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'removeFormat' ],

		/**
		 * available options / buttons
		 * 
		 * @todo new buttons needed for 'code'
		 */
		availableButtons: [ 'u', 'strong', 'del', 'em', 'b', 'i', 's', 'sub', 'sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'removeFormat' ],

		/**
		 * HotKeys used for special actions
		 */
		hotKey: { 
			formatBold: 'ctrl+b',
			formatItalic: 'ctrl+i',
			formatParagraph: 'alt+ctrl+0',
			formatH1: 'alt+ctrl+1',
			formatH2: 'alt+ctrl+2',
			formatH3: 'alt+ctrl+3',
			formatH4: 'alt+ctrl+4',
			formatH5: 'alt+ctrl+5',
			formatH6: 'alt+ctrl+6',
			formatPre: 'ctrl+p',
			formatDel: 'ctrl+d',
			formatSub: 'alt+shift+s',
			formatSup: 'ctrl+shift+s'
		},

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			// Prepare
			var me = this;

			if (typeof this.settings.hotKey !== 'undefined') {
				jQuery.extend(true, this.hotKey, this.settings.hotKey);
			}

			this.initButtons();

			Aloha.bind('aloha-plugins-loaded', function () {
				// @todo add config option for sidebar panel
				me.initSidebar(Aloha.Sidebar.right);
			});

			// apply specific configuration if an editable has been activated
			Aloha.bind('aloha-editable-activated',function (e, params) {
				me.applyButtonConfig(params.editable.obj);

				// handle hotKeys
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatBold, function() { me.addMarkup( 'b' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatItalic, function() { me.addMarkup( 'i' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatParagraph, function() { me.changeMarkup( 'p' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH1, function() { me.changeMarkup( 'h1' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH2, function() { me.changeMarkup( 'h2' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH3, function() { me.changeMarkup( 'h3' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH4, function() { me.changeMarkup( 'h4' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH5, function() { me.changeMarkup( 'h5' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatH6, function() { me.changeMarkup( 'h6' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatPre, function() { me.changeMarkup( 'pre' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatDel, function() { me.addMarkup( 'del' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatSub, function() { me.addMarkup( 'sub' ); return false; });
				params.editable.obj.bind( 'keydown.aloha.format', me.hotKey.formatSup, function() { me.addMarkup( 'sup' ); return false; });
			});

			Aloha.bind('aloha-editable-deactivated',function (e, params) {
				params.editable.obj.unbind('keydown.aloha.format');
			});
		},

		/**
		 * applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function (obj) {
			var config = this.getEditableConfig(obj),
			    button, i, len;

			if ( typeof config === 'object' ) {
				var config_old = [];
				jQuery.each(config, function(j, button) {
					if ( !(typeof j === 'number' && typeof button === 'string') ) {
						config_old.push(j);
					}
				});
				
				if ( config_old.length > 0 ) {
					config = config_old;
				}
			}
			this.formatOptions = config;

			// now iterate all buttons and show/hide them according to the config
			for ( button in this.buttons) {
				if (this.buttons.hasOwnProperty(button)) {
					if (jQuery.inArray(button, config) !== -1) {
						this.buttons[button].handle.show();
					} else {
						this.buttons[button].handle.hide();
					}
				}
			}

			// and the same for multisplit items
			len = this.multiSplitItems.length;
			for (i = 0; i < len; i++) {
				if (jQuery.inArray(this.multiSplitItems[i].name, config) !== -1) {
					this.multiSplitButton.showItem(this.multiSplitItems[i].name);
				} else {
					this.multiSplitButton.hideItem(this.multiSplitItems[i].name);
				}
			}
		},

		/**
		 * initialize the buttons and register them on floating menu
		 * @param event event object
		 * @param editable current editable object
		 */
		initButtons: function () {
			var that = this;

			this.buttons = {};
			this.multiSplitItems = [];

			jQuery.each(this.availableButtons, function(j, button) {
				var button_config = false;

				if (typeof j !== 'number' && typeof button !== 'string') {
					button_config = button;
					button = j;
				}

				if (textLevelSemantics[button]) {
					that.buttons[button] = {
						handle: makeTextLevelButton(that, button),
						markup: jQuery('<'+button+'>', {'class': button_config || ''})
					};
				} else if (blockLevelSemantics[button]) {
					that.multiSplitItems.push(makeBlockLevelButton(that, button));
				} else if ('removeFormat' === button) {
					that.multiSplitItems.push(makeRemoveFormatButton(that, button));
				} else {
					Aloha.log('warn', that, 'Button "' + button + '" is not defined');
				}
			});

			this.multiSplitButton = MultiSplitButton({
				name: 'formatBlock',
				items: this.multiSplitItems,
				hideIfEmpty: true,
				scope: 'Aloha.continuoustext'
			});

			PubSub.sub('aloha.selection.context-change', function(message) {
				onSelectionChanged(that, message.range);
			});
		},

		initSidebar: function ( sidebar ) {
			var pl = this;
			pl.sidebar = sidebar;
			sidebar.addPanel( {

				id       : pl.nsClass( 'sidebar-panel-class' ),
				title    : i18n.t( 'floatingmenu.tab.format' ),
				content  : '',
				expanded : true,
				activeOn : this.formatOptions || false,

				onInit: function () {
				},

				onActivate: function ( effective ) {
					var that = this;
					that.effective = effective;
					
					if ( !effective[0] ) {
						return;
					}
					that.format = effective[0].nodeName.toLowerCase();

					var dom = jQuery('<div>').attr('class', pl.nsClass( 'target-container' ));
					var fieldset = jQuery('<fieldset>');
					fieldset.append(jQuery('<legend>' + that.format + ' ' + i18n.t( 'format.class.legend' )).append(jQuery('<select>')));
					
					dom.append(fieldset);
					
					var html = 
						'<div class="' + pl.nsClass( 'target-container' ) + '"><fieldset><legend>' + i18n.t( 'format.class.legend' ) + '</legend><select name="targetGroup" class="' + pl.nsClass( 'radioTarget' ) + '">' + 
						'<option value="">' + i18n.t( 'format.class.none' ) + '</option>';

					if ( pl.config[that.format] && pl.config[that.format]['class'] ) {
						jQuery.each(pl.config[that.format]['class'], function(i ,v) {
							html += '<option value="' + i + '" >' + v + '</option>';
						});
					}

					html += '</select></fieldset></div>';

					var that = this,
					content = this.setContent(html).content; 

					jQuery( pl.nsSel( 'framename' ) ).live( 'keyup', function () {
						jQuery( that.effective ).attr( 'target', jQuery( this ).val().replace( '\"', '&quot;' ).replace( "'", "&#39;" ) );
					} );
					

					var that = this;
					that.effective = effective;
					jQuery( pl.nsSel( 'linkTitle' ) ).val( jQuery( that.effective ).attr( 'title' ) );
				}

			} );

			sidebar.show();
		},

		// duplicated code from link-plugin
		//Creates string with this component's namepsace prefixed the each classname
		nsClass: function () {
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each( arguments, function () {
				stringBuilder.push( this == '' ? prefix : prefix + '-' + this );
			} );
			return jQuery.trim(stringBuilder.join(' '));
		},

		// duplicated code from link-plugin
		nsSel: function () {
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each( arguments, function () {
				stringBuilder.push( '.' + ( this == '' ? prefix : prefix + '-' + this ) );
			} );
			return jQuery.trim(stringBuilder.join(' '));
		},

		addMarkup: addMarkup,
		changeMarkup: changeMarkup,

		/**
		 * Removes all formatting from the current selection.
		 */
		removeFormat: function() {
			var formats = [ 'u', 'strong', 'em', 'b', 'i', 'q', 'del', 's', 'code', 'sub', 'sup', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'quote', 'blockquote' ],
			    rangeObject = Aloha.Selection.rangeObject,
			    i;

			// formats to be removed by the removeFormat button may now be configured using Aloha.settings.plugins.format.removeFormats = ['b', 'strong', ...]
			if (this.settings.removeFormats) {
				formats = this.settings.removeFormats;
			}

			if (rangeObject.isCollapsed()) {
				return;
			}

			for (i = 0; i < formats.length; i++) {
				GENTICS.Utils.Dom.removeMarkup(rangeObject, jQuery('<' + formats[i] + '>'), Aloha.activeEditable.obj);
			}

			// select the modified range
			rangeObject.select();
			// TODO: trigger event - removed Format
		},

		/**
		 * toString method
		 * @return string
		 */
		toString: function () {
			return 'format';
		}
	});
});
