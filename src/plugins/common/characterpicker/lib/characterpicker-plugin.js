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
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/button',
	'ui/floating',
	'PubSub',
	'i18n!characterpicker/nls/i18n'
], function (
	Aloha,
	$,
	Plugin,
	Ui,
	Button,
	Floating,
	PubSub,
	i18n
) {
	'use strict';

	var $DOCUMENT = $(document);
	var $WINDOW = $(window);

	/**
	 * Tracks the range at the point at which the editor opens the character
	 * picker.
	 *
	 * @type {Range}
	 */
	var rangeAtOpen;

	/**
	 * A cache of all the overlay configurations. If all editables have the same
	 * configuration, only a single overlay will be created that will be used by
	 * all editables.
	 *
	 * @type {object<string, Overlay>}
	 */
	var configs = {};

	/**
	 * Checks whether the character picker overlay.
	 *
	 * @param {Overlay} overlay
	 * @return {boolean} True if the overlay is visible.
	 */
	function isOverlayVisible(overlay) {
		return overlay.$element.css('display') === 'table';
	}

	/**
	 * Prepares the overlay to close when a click event is triggered on the body
	 * document.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnBodyClick(overlay) {
		overlay.$element.click(function ($event) {
			$event.stopPropagation();
		});

		$('body').click(function ($event) {
			// Because we click events on the overlay ui should not cause it to
			// hide itself.
			if (!overlay._overlayActive
					|| ($event.target === overlay.$element[0])
					|| $(event.target).is('.aloha-icon-characterpicker')
					|| $(event.target).find('.aloha-icon-characterpicker').length) {
				return;
			}
			overlay.hide();
		});
	}

	/**
	 * Prepares the given overlay to close when the ESC button is clicked.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnEsc(overlay) {
		$DOCUMENT.keyup(function ($event) {
			if ((27 === $event.keyCode) && isOverlayVisible(overlay)) {
				overlay.hide();
			}
		});
	}

	/**
	 * Helper function that takes the computed style-property of one element and
	 * applies it to another one, depending on the browser implementation.
	 *
	 * @param {HTMLElement} source The element of which the style element is
	 *                             taken.
	 * @param {HTMLElement} target Where the style will be applied.
	 * @param {string} styleProp The css property which shall be copied.
	 * @return {jQuery.<HTMLElement>}
	 */
	function copyStyle(source, target, styleProp) {
		// Move to strings.js
		var camelize = function (str) {
			return str.replace(/\-(\w)/g, function (str, letter) {
				return letter.toUpperCase();
			});
		};

		var style;

		if (source.currentStyle) {
			style = source.currentStyle[camelize(styleProp)];
		} else if (document.defaultView
		        && document.defaultView.getComputedStyle) {
			style = document.defaultView
			                .getComputedStyle(source, null)
			                .getPropertyValue(styleProp);
		} else {
			style = source.style[camelize(styleProp)];
		}

		return style ? target.css(styleProp, style) : null;
	}

	/**
	 * Enables navigation through the character table with the arrow keys and
	 * select one with the enter key.
	 *
	 * @param {Overlay} overlay
	 * @param {function} onSelect Function to invoke when Enter is pressed.
	 */
	function cursorMovements(overlay, onSelect) {
		var movements = {
			// ←┘
			13: function select($current) {
				overlay.hide();
				onSelect($current.text());
			},
			// ←
			37: function left($current) {
				var $prev = $current.prev();
				if ($prev.length) {
					$prev.addClass('focused');
					$current.removeClass('focused');
				}
			},
			// ↑
			38: function up($current) {
				var $prevRow = $current.parent().prev();
				if ($prevRow.length) {
					var $prev = $(
						$prevRow.children()[$current.index()]
					).addClass('focused');
					if ($prev.length) {
						$current.removeClass('focused');
					}
				}
			},
			// →
			39: function right($current) {
				var $next = $current.next().addClass('focused');
				if ($next.length) {
					$current.removeClass('focused');
				}
			},
			// ↓
			40: function down($current) {
				var $nextRow = $current.parent().next();
				if ($nextRow.length) {
					var $next = $(
						$nextRow.children()[$current.index()]
					).addClass('focused');
					if ($next.length) {
						$current.removeClass('focused');
					}
				}
			}
		};

		$DOCUMENT.keydown(function ($event) {
			$event.stopPropagation();
			if (movements[$event.keyCode] && isOverlayVisible(overlay)) {
				movements[$event.keyCode](overlay.$element.find('.focused'));
				return false;
			}
		});
	}

	/**
	 * Generates a map of the given list character on the overlay.
	 *
	 * @param {Overlay} overlay
	 * @param {String} characters
	 */
	function generateCharacterTable(overlay, characters) {
		var textarea = document.createElement('textarea');
		textarea.innerHTML = characters;

		var list = $.grep(textarea.value.split(' '), function (chr) {
			return '' !== chr;
		});

		var table = ['<tr>'];
		var i = 0;
		var chr;
		while ((chr = list[i])) {
			// New row every 15 characters
			if (0 !== i && (0 === (i % 15))) {
				table.push('</tr><tr>');
			}
			table.push('<td unselectable="on">' + chr + '</td>');
			i++;
		}
		table.push('</tr>');

		overlay.$tbody.empty().append(table.join(''));

		overlay.$element.delegate('td', 'mouseover', function () {
			overlay.$element.find('.focused').removeClass('focused');
			$(this).addClass('focused');
		}).delegate('td', 'mouseout', function () {
			$(this).removeClass('focused');
		}).delegate('td', 'click', function () {
			overlay.$element.hide();
			overlay.onSelect($(this).text());
		});
	}

	/**
	 * @param {Overlay} overlay
	 * @param {jQuery.<HTMLElement>} $element A DOM element around which to
	 *                                        calculate the offset.
	 */
	function calculateOffset(overlay, $element) {
		var offset = $element.offset();
		if ('fixed' === Floating.POSITION_STYLE) {
			offset.top -= $WINDOW.scrollTop();
			offset.left -= $WINDOW.scrollLeft();
		}
		return {
			top: overlay.offset.top + (offset.top - overlay.offset.top),
			left: overlay.offset.left + (offset.left - overlay.offset.left)
		};
	}

	/**
	 * Insert the selected character, at the editor's selection.
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

	/**
	 * The Character Picker Overlay.
	 *
	 * @param {function} onSelect
	 * @type {Overlay}
	 */
	function Overlay(onSelect) {
		var overlay = this;

		overlay.$element = $('<table class="aloha-character-picker-overlay" ' +
			'unselectable="on" role="dialog"><tbody></tbody></table>');

		// Because if mousedown bubbles up, there won't be an activeEditable.
		// FIXME: The above needs to be better explained.
		overlay.$element.mousedown(function ($event) {
			return false;
		});

		overlay.onSelect = onSelect;
		overlay.$tbody = overlay.$element.find('tbody');
		overlay.$element.appendTo($('body'));

		hideOnBodyClick(overlay);
		hideOnEsc(overlay);
		cursorMovements(overlay, onSelect);

		Aloha.bind('aloha-editable-deactivated', function () {
			overlay.hide();
		});
	}

	Overlay.prototype = {
		offset: {
			top: 0,
			left: 0
		},

		/**
		 * Show the character overlay at the insert button's position.
		 *
		 * @param {jQuery.<HTMLElement>} $insert Insert button.
		 */
		show: function ($insert) {
			var overlay = this;

			// Because the overlay needs to be reposition relative its button.
			overlay.$element
			       .css(calculateOffset(overlay, $insert))
			       .css('position', Floating.POSITION_STYLE)
			       .show()
			       .find('.focused')
			       .removeClass('focused');

			overlay.$element
			       .find('td')
			       .eq(0)
			       .addClass('focused');

			overlay._overlayActive = true;
		},

		hide: function () {
			this.$element.hide();
			this._overlayActive = false;
		}
	};

	/**
	 * Generate an character picker overlay for the given editable.
	 *
	 * Because each editable may have its own configuration and therefore may
	 * have its own overlay.
	 *
	 * @param {CharacterPicker} characterpicker
	 * @param {Aloha.Editable} editable
	 * @return {Overlay|null} The generated character picker overlay, or null
	 *                        of the editable is not configured for the
	 *                        character picker.
	 */
	function generateOverlay(characterpicker, editable) {
		var config = characterpicker.getEditableConfig(editable);
		if (!config) {
			return null;
		}
		var characters = $.isArray(config) ? config.join(' ') : config;
		var overlay = configs[characters];
		if (!overlay) {
			overlay = new Overlay(onSelectCharacter);
			generateCharacterTable(overlay, characters);
			configs[characters] = overlay;
		}
		return overlay;
	}

	/**
	 * @type {Plugin}
	 */
	var CharacterPicker =  Plugin.create('characterpicker', {

		settings: {},

		config: '&#38; &#34; &#162; &#8364; &#163; &#165; &#169; &#174; &#8482; &#8240; &#181; &#183; &#8226; &#8230; &#8242; &#8243; &#167; &#182; &#223; &#8249; &#8250; &#171; &#187; &#8216; &#8217; &#8220; &#8221; &#8218; &#8222; &#60; &#62; &#8804; &#8805; &#8211; &#8212; &#175; &#8254; &#164; &#166; &#168; &#161; &#191; &#710; &#732; &#176; &#8722; &#177; &#247; &#8260; &#215; &#185; &#178; &#179; &#188; &#189; &#190; &#402; &#8747; &#8721; &#8734; &#8730; &#8764; &#8773; &#8776; &#8800; &#8801; &#8712; &#8713; &#8715; &#8719; &#8743; &#8744; &#172; &#8745; &#8746; &#8706; &#8704; &#8707; &#8709; &#8711; &#8727; &#8733; &#8736; &#180; &#184; &#170; &#186; &#8224; &#8225; &#192; &#193; &#194; &#195; &#196; &#197; &#198; &#199; &#200; &#201; &#202; &#203; &#204; &#205; &#206; &#207; &#208; &#209; &#210; &#211; &#212; &#213; &#214; &#216; &#338; &#352; &#217; &#218; &#219; &#220; &#221; &#376; &#222; &#224; &#225; &#226; &#227; &#228; &#229; &#230; &#231; &#232; &#233; &#234; &#235; &#236; &#237; &#238; &#239; &#240; &#241; &#242; &#243; &#244; &#245; &#246; &#248; &#339; &#353; &#249; &#250; &#251; &#252; &#253; &#254; &#255; &#913; &#914; &#915; &#916; &#917; &#918; &#919; &#920; &#921; &#922; &#923; &#924; &#925; &#926; &#927; &#928; &#929; &#931; &#932; &#933; &#934; &#935; &#936; &#937; &#945; &#946; &#947; &#948; &#949; &#950; &#951; &#952; &#953; &#954; &#955; &#956; &#957; &#958; &#959; &#960; &#961; &#962; &#963; &#964; &#965; &#966; &#967; &#968; &#969; &#8501; &#982; &#8476; &#977; &#978; &#8472; &#8465; &#8592; &#8593; &#8594; &#8595; &#8596; &#8629; &#8656; &#8657; &#8658; &#8659; &#8660; &#8756; &#8834; &#8835; &#8836; &#8838; &#8839; &#8853; &#8855; &#8869; &#8901; &#8968; &#8969; &#8970; &#8971; &#9001; &#9002; &#9674; &#9824; &#9827; &#9829; &#9830;',

		_constructor: function () {
			this._super('characterpicker');
		},

		init: function () {
			var characterpicker = this;

			if (Aloha.settings.plugins
					&& Aloha.settings.plugins.characterpicker) {
				characterpicker.settings
						= Aloha.settings.plugins.characterpicker;
			}

			var button = Ui.adopt('characterPicker', Button, {
				tooltip: i18n.t('button.addcharacter.tooltip'),
				icon: 'aloha-icon-characterpicker',
				scope: 'Aloha.continuoustext',
				click: function () {
					if (characterpicker.overlay) {
						rangeAtOpen = Aloha.Selection.rangeObject;

						var from = rangeAtOpen.startContainer.parentNode;
						var to = characterpicker.overlay.$element;

						copyStyle(from, to, 'font-family');
						copyStyle(from, to, 'font-weight');
						copyStyle(from, to, 'font-style');

						characterpicker.overlay.show(this.element);
					}
				}
			});

			/**
			 * Pre-generate overlays to so that they will be ready when the
			 * editor click on an editable.
			 *
			 * @param {number} editableIndex
			 */
			function pregenerateOverlays(editableIndex) {
				if (editableIndex < Aloha.editables.length) {
					generateOverlay(characterpicker,
							Aloha.editables[editableIndex]);
					setTimeout(function () {
						pregenerateOverlays(editableIndex + 1);
					}, 100);
				}
			}

			// FIXME: ... but why?
			setTimeout(function () {
				pregenerateOverlays(0);
			}, 100);

			Aloha.bind('aloha-editable-activated', function ($event, data) {
				characterpicker.overlay =
						generateOverlay(characterpicker, data.editable);
				if (characterpicker.overlay) {
					button.show();
				} else {
					button.hide();
				}
			});

			PubSub.sub('aloha.floating.changed', function (message) {
				if (characterpicker.overlay) {
					characterpicker.overlay.offset = message.position.offset;
					characterpicker.overlay.$element.css(
						calculateOffset(characterpicker.overlay, button.element)
					);
				}
			});
		}

	});

	return CharacterPicker;
});
