/* characterpicker-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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
	'ui/ui',
	'ui/contextButton',
	'ui/dynamicForm',
	'characterpicker/symbol-grid',
	'i18n!characterpicker/nls/i18n'
], function (
	Aloha,
	Plugin,
	Ui,
	ContextButton,
	DynamicForm,
	SymbolGrid,
	i18n
) {
	'use strict';

	/**
	 * Tracks the range at the point at which the editor opens the character
	 * picker.
	 *
	 * @type {Range}
	 */
	var rangeAtOpen;

	/**
	 * Inserts the selected character, at the editor's selection.
	 *
	 * @param {String} character
	 */
	function onSelectCharacter(character) {
		if (Aloha.activeEditable) {
			rangeAtOpen.select();
			Aloha.execCommand('insertHTML', false, character);

			// Because after the character was inserted, move the selection
			// forward.
			rangeAtOpen.endContainer = rangeAtOpen.startContainer;
			rangeAtOpen.endOffset = ++rangeAtOpen.startOffset;
			rangeAtOpen.select();
		}
	}

	function createSymbolGridFromConfig(
		config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, SymbolGrid, {
			symbols: tmpOptions.symbols,

			changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
		});
		return component;
	}

	/**
	 * @type {Plugin}
	 */
	var CharacterPickerPlugin = Plugin.create('characterpicker', {

		settings: {},

		config: '&#38; &#34; &#162; &#8364; &#163; &#165; &#169; &#174; &#8482; &#8240; &#181; &#183; &#8226; &#8230; &#8242; &#8243; &#167; &#182; &#223; &#8249; &#8250; &#171; &#187; &#8216; &#8217; &#8220; &#8221; &#8218; &#8222; &#60; &#62; &#8804; &#8805; &#8211; &#8212; &#175; &#8254; &#164; &#166; &#168; &#161; &#191; &#710; &#732; &#176; &#8722; &#177; &#247; &#8260; &#215; &#185; &#178; &#179; &#188; &#189; &#190; &#402; &#8747; &#8721; &#8734; &#8730; &#8764; &#8773; &#8776; &#8800; &#8801; &#8712; &#8713; &#8715; &#8719; &#8743; &#8744; &#172; &#8745; &#8746; &#8706; &#8704; &#8707; &#8709; &#8711; &#8727; &#8733; &#8736; &#180; &#184; &#170; &#186; &#8224; &#8225; &#192; &#193; &#194; &#195; &#196; &#197; &#198; &#199; &#200; &#201; &#202; &#203; &#204; &#205; &#206; &#207; &#208; &#209; &#210; &#211; &#212; &#213; &#214; &#216; &#338; &#352; &#217; &#218; &#219; &#220; &#221; &#376; &#222; &#224; &#225; &#226; &#227; &#228; &#229; &#230; &#231; &#232; &#233; &#234; &#235; &#236; &#237; &#238; &#239; &#240; &#241; &#242; &#243; &#244; &#245; &#246; &#248; &#339; &#353; &#249; &#250; &#251; &#252; &#253; &#254; &#255; &#913; &#914; &#915; &#916; &#917; &#918; &#919; &#920; &#921; &#922; &#923; &#924; &#925; &#926; &#927; &#928; &#929; &#931; &#932; &#933; &#934; &#935; &#936; &#937; &#945; &#946; &#947; &#948; &#949; &#950; &#951; &#952; &#953; &#954; &#955; &#956; &#957; &#958; &#959; &#960; &#961; &#962; &#963; &#964; &#965; &#966; &#967; &#968; &#969; &#8501; &#982; &#8476; &#977; &#978; &#8472; &#8465; &#8592; &#8593; &#8594; &#8595; &#8596; &#8629; &#8656; &#8657; &#8658; &#8659; &#8660; &#8756; &#8834; &#8835; &#8836; &#8838; &#8839; &#8853; &#8855; &#8869; &#8901; &#8968; &#8969; &#8970; &#8971; &#9001; &#9002; &#9674; &#9824; &#9827; &#9829; &#9830;',

		_constructor: function () {
			this._super('characterpicker');
		},

		init: function () {
			DynamicForm.componentFactoryRegistry['symbol-grid'] = createSymbolGridFromConfig;
			
			if (
				Aloha.settings.plugins &&
				Aloha.settings.plugins.characterpicker
			) {
				this.settings = Aloha.settings.plugins.characterpicker;
			}

			var _this = this;
				
			Ui.adopt('characterPicker', ContextButton, {
				tooltip: i18n.t('button.addcharacter.tooltip'),
				icon: 'aloha-icon-characterpicker',

				contextType: 'dropdown',
				context: function() {
					rangeAtOpen = Aloha.Selection.rangeObject;

					return {
						type: 'symbol-grid',
						options: {
							symbols: _this.getNormalizedSymbols(),
						},
					}
				},

				contextResolve: function(symbol) {
					onSelectCharacter(symbol);
				},
			});
		},

		getNormalizedSymbols: function() {
			var symbols = [];

			if (!Array.isArray(this.config)) {
				if (typeof this.config === 'string') {
					symbols = this.config.split(' ');
				} else {
					// ... ?
				}
			} else {
				symbols = this.config;
			}

			// TODO: Add labels?
			return symbols;
		},

	});

	return CharacterPickerPlugin;
});
