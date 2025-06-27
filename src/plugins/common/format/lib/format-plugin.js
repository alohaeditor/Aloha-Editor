/** @typedef {import('../../ui/lib/toggleButton').ToggleButton} ToggleButton */
/** @typedef {import('../../ui/lib/splitButton').SplitButton} SplitButton */
/**
 * @typedef {object} FormattingOption
 * @property {string=} name (Component/Slot) Name of the element
 * @property {string} icon Icon to use for the Button/Select entry
 * @property {string} label The display name/label for the user
 * @property {boolean} typography If this is a typography format (i.E. paragraph, header, ...)
 * @property {boolean} header If this is a header typography (h1-h6)
 */

/* format-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define('format/format-plugin', [
	'jquery',
	'aloha',
	'PubSub',
	'aloha/plugin',
	'aloha/state-override',
	'aloha/content-rules',
	'aloha/ephemera',
	'aloha/selection',
	'util/html',
	'util/dom',
	'util/browser',
	'util/strings',
	'ui/ui',
	'ui/button',
	'ui/toggleButton',
	'ui/splitButton',
	'ui/icons',
	'ui/dropdown',
	'ui/utils',
	'i18n!format/nls/i18n'
], function (
	$,
	Aloha,
	PubSub,
	Plugin,
	StateOverride,
	ContentRules,
	Ephemera,
	Selection,
	Html,
	Dom,
	Browser,
	Strings,
	Ui,
	Button,
	ToggleButton,
	SplitButton,
	Icons,
	Dropdown,
	Utils,
	i18n
) {
	'use strict';

	var pluginNamespace = 'aloha-format';

	/** Class which needs to be set on headers when the IDs are manually set. */
	var CLASS_CUSTOMIZED = 'aloha-customized';

	var CLASS_HIERACHY_VIOLATION = 'aloha-heading-hierarchy-violated';

	var ATTR_HEADER_ID = 'id';

	/**
	 * Checks if the selection spans a whole node (HTML element)
	 * @param Range range
	 * @return {boolean}
	 */
	function isEntireNodeInRange(range) {
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		return (sc === ec && so === 0 && eo === ec.length);
	}

	/**
	 * Alias for isInlineFormatable function from Html lib
	 */
	var isInlineNode = Html.isInlineFormattable;

	/**
	 * Expands the (invisible) range to encompass the whole node
	 * that was selected by the user
	 * @param Range range
	 * @return void
	 */
	function expandRange(range) {
		var cac = range.commonAncestorContainer;

		if (isInlineNode(cac) && cac.parentNode) {
			var parent = cac.parentNode;
			range.startContainer = parent;
			range.endContainer = parent;
			range.commonAncestorContainer = parent;
			range.startOffset = 0;
			range.endOffset = 1;
			expandRange(range);
			return;
		}

		// Because at this point there will be no further recursion, we should
		// finally update the state of `range`
		range.update();
	}

	/**
	 * Collision map to determine if we are
	 * working on a list related node.
	 */
	var LIST_ELEMENT = {
		'OL': true,
		'UL': true,
		'LI': true,
		'DL': true,
		'DT': true,
		'DD': true
	};

	/**
	 * Determine if we are working on a list element
	 * using the previous LIST_ELEMENT hash map.
	 * @param DOM node
	 * @return {boolean}
	 */
	function isListElement(node) {
		return LIST_ELEMENT[node.nodeName];
	}

	/**
	 * Determines if a markup is a heading
	 * @param string markup
	 * @returns {boolean}
	 */
	function isHeading(markup) {
		return plugin.headerNodeNames.includes(markup);
	}

	/**
	 * Checks whether range spans multiple lists
	 * @param Range range
	 * @return {boolean}
	 */
	function spansMultipleLists(range) {
		return range.startContainer !== range.endContainer;
	}

	/**
	 * Take list items out of their encompassing list element.
	 * Wrap items in <p> and delete any remaining empty lists.
	 * @param Range range
	 * @return void
	 */
	function unformatList(range) {
		expandRange(range);

		var cac = range.commonAncestorContainer;

		if (!isListElement(cac)) {
			return;
		}

		if (!isEntireNodeInRange(range) && !spansMultipleLists(range)) {
			return;
		}

		var selectedNodes = $(range.startContainer.parentNode).nextUntil($(range.endContainer.parentNode).next()).addBack();
		var prevNodes = $(range.startContainer.parentNode).prevAll();
		var nextNodes = $(range.endContainer.parentNode).nextAll();
		var listName = range.startContainer.parentNode.parentNode.nodeName;

		// Only one item selected
		if (selectedNodes.length == 1) {
			// Last item in list
			if (prevNodes.length == 0 && nextNodes.length == 0) {
				// The first unwrap removes the parent list tag,
				// the second one the list item tag.
				selectedNodes.unwrap().contents().unwrap().wrap('<p>');
			}
			// first list item
			else if (prevNodes.length === 0) {
				selectedNodes.addClass('_moved').remove().insertBefore(nextNodes.parent());
			}
			// last list item
			else if (nextNodes.length === 0) {
				selectedNodes.addClass('_moved').remove().insertAfter(prevNodes.parent());
			}
			// one list item in middle
			else {
				selectedNodes.addClass('_moved').remove().insertAfter(prevNodes.parent());
				$('<' + listName.toLowerCase() + '>').append(nextNodes).insertAfter(selectedNodes);
			}
		}
		// multiple list items up to whole list
		else {
			selectedNodes.addClass('_moved').remove().insertAfter(cac);
			if (nextNodes.length > 0) {
				$('<' + listName.toLowerCase() + '>').append(nextNodes).insertAfter(selectedNodes.last());
			}
		}

		// unwrap moved list elements
		$('._moved').each(function () {
			var $p = $('<p>');
			var $this = $(this);

			$this.after($p);
			$this.contents().unwrap().appendTo($p);
		});

		// If we are at the first list element, get rid of original (now empty) list
		if (prevNodes.length === 0) {
			cac.remove();
		}
	}

	function formatInsideTableWorkaround(nodeType) {
		var selectedCells = $('.aloha-cell-selected');
		if (selectedCells.length < 1) {
			return false;
		}

		var cellMarkupCounter = 0;
		selectedCells.each(function () {
			var cellContent = $(this).find('div'),
				cellMarkup = cellContent.find(nodeType);
			if (cellMarkup.length > 0) {
				// unwrap all found markup text
				// <td><b>text</b> foo <b>bar</b></td>
				// and wrap the whole contents of the <td> into <b> tags
				// <td><b>text foo bar</b></td>
				cellMarkup.contents().unwrap();
				cellMarkupCounter++;
			}
			cellContent.contents().wrap('<' + nodeType + '></' + nodeType + '>');
		});

		// remove all markup if all cells have markup
		if (cellMarkupCounter === selectedCells.length) {
			selectedCells.find(nodeType).contents().unwrap();
		}

		return true;
	}

	function textLevelButtonClickHandler(nodeType, commandName) {
		if (formatInsideTableWorkaround(nodeType)) {
			return false;
		}
		plugin.addMarkup(nodeType, commandName);
		return false;
	}

	function makeRemoveFormatButton() {
		return Ui.adopt(REMOVE_FORMAT_ID, Button, {
			tooltip: i18n.t('button.removeFormat.tooltip'),
			icon: Icons.CLEAR,
			click: function () {
				plugin.removeFormat();
			}
		});
	}

	/**
	 * Checks the hierarchy of headings (h1, h2, ..., h6) and adds a class
	 * "aloha-heading-hierarchy-violated" if the hierarchy is violated.
	 * The hierarchy is violated if a heading is more than one hierarchy lower
	 * than the previous heading.
	 * It is also checked, if the hierarchy is higher than the highest hierarchy
	 * found in the plugin configuration.
	 * For example if the plugin configuration contains the possible headings:
	 * 'h2', 'h3', 'h4', 'h5', 'h6', then all occurrences of 'h1' will be marked.
	 * @param {config} the plugin config
	 * @returns {undefined}
	 */
	function checkHeadingHierarchy(config) {
		if (!Aloha.activeEditable || config.length === 0) {
			return;
		}

		var parent = Aloha.activeEditable.obj,
			startHeading,
			lastCorrectHeading,
			currentHeading;

		// The warning class should only be used with header tags, but the
		// insertparagraph command for example, copies all attributes, to
		// the new element, so the plugin has to remove them again.
		parent.find(":not(h1,h2,h3,h4,h5,h6)").each(function () {
			$(this).removeClass(CLASS_HIERACHY_VIOLATION);
		});

		//set startheading to heading with smallest number available in the config
		for (var i = 0; i < config.length; i++) {
			if (isHeading(config[i])) {
				if (startHeading != null) {
					if (parseInt(config[i].charAt(1), 10) < startHeading) {
						startHeading = parseInt(config[i].charAt(1), 10);
					}
				} else {
					//first heading found in config
					startHeading = parseInt(config[i].charAt(1), 10);
				}
			}
		}

		//check the heading hierarchy of every heading
		if (startHeading == null) {
			return;
		}

		//this find() returns all headings in tree order
		parent.find("h1,h2,h3,h4,h5,h6").each(function () {
			currentHeading = parseInt(this.nodeName.charAt(1), 10);
			if (typeof lastCorrectHeading !== 'undefined') {
				//the current heading hierarchy must be lower than the startHeading hierarchy
				if (currentHeading < startHeading) {
					$(this).addClass(CLASS_HIERACHY_VIOLATION);
				} else {
					//heading hierarchy is violated if a heading is more
					//than one hierarchy lower than the last correct heading
					if (currentHeading > (lastCorrectHeading + 1)) {
						$(this).addClass(CLASS_HIERACHY_VIOLATION);
					} else {
						//only set the last heading if the hierarchy is not violated
						lastCorrectHeading = currentHeading;
						$(this).removeClass(CLASS_HIERACHY_VIOLATION);
					}
				}
			} else {
				//first heading! see if it starts with correct heading
				if (currentHeading === startHeading) {
					lastCorrectHeading = currentHeading;
					$(this).removeClass(CLASS_HIERACHY_VIOLATION);
				} else {
					$(this).addClass(CLASS_HIERACHY_VIOLATION);
				}
			}
		});
	}

	function changeMarkup(nodeType) {
		Selection.changeMarkupOnSelection($('<' + nodeType + '>'));
		if (Strings.parseBoolean(plugin.settings.checkHeadingHierarchy)) {
			checkHeadingHierarchy(plugin.formatOptions);
		}
	}

	function updateUiAfterMutation(rangeObject) {
		if (Aloha.activeEditable) {
			Aloha.activeEditable.smartContentChange({ type: 'block-change' });
		}
		// select the modified range
		rangeObject.select();
		// update Button toggle state. We take Selection.getRangeObject()
		// because rangeObject is not up-to-date
		onSelectionChanged(Selection.getRangeObject());
	}

	function format(rangeObject, markup) {
		Dom.addMarkup(rangeObject, markup);
		Dom.doCleanup({
			merge: true,
			mergeable: function (node) {
				return 'Q' === node.nodeName && 'Q' === node.nextSibling.nodeName;
			}
		}, rangeObject);
		updateUiAfterMutation(rangeObject);
	}

	function isFormatAllowed(tagname, plugin, editable) {
		if (!ContentRules.isAllowed(editable.obj[0], tagname)) {
			return false;
		}
		var config = plugin.getEditableConfig(editable.obj);
		return config ? $.inArray(tagname, config) > -1 : false;
	}

	function addMarkup(nodeType, command) {
		var markup = $('<' + nodeType + '>'),
			rangeObject = Selection.rangeObject;

		if (nodeType == null || !nodeType || Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
			return;
		}

		// check whether the markup is found in the range (at the start of the range)
		var nodeNames = [markup[0].nodeName];
		if (plugin.conversionNames[markup[0].nodeName]) {
			nodeNames.push(plugin.conversionNames[markup[0].nodeName]);
		}

		var foundMarkup = rangeObject.findMarkup(function (nodeElement) {
			return nodeNames.includes(nodeElement.nodeName);
		}, Aloha.activeEditable.obj);

		if (foundMarkup) {
			// remove the markup
			if (rangeObject.isCollapsed()) {
				// when the range is collapsed, we remove exactly the one DOM element
				Dom.removeFromDOM(foundMarkup, rangeObject, true);
			} else {
				// the range is not collapsed, so we remove the markup from the range
				Dom.removeMarkup(rangeObject, $(foundMarkup), Aloha.activeEditable.obj);
			}
			PubSub.pub('aloha.format.removed', { level: 'text', format: nodeType })
			updateUiAfterMutation(rangeObject);
		} else {
			// when the range is collapsed, extend it to a word
			if (rangeObject.isCollapsed()) {
				Dom.extendToWord(rangeObject);
				if (rangeObject.isCollapsed()) {
					if (StateOverride.enabled()) {
						StateOverride.setWithRangeObject(
							command || nodeType,
							rangeObject,
							function (command, rangeObject) {
								format(rangeObject, markup);
								PubSub.pub('aloha.format.added', { level: 'text', format: nodeType })
							}
						);
						return;
					}
				}
			}
			PubSub.pub('aloha.format.added', { level: 'text', format: nodeType })
			format(rangeObject, markup);
		}
	}

	function onSelectionChanged(rangeObject) {
		var effectiveMarkup,
			i, j;

		// Normal format buttons like bold
		Object.values(plugin.buttons || {}).forEach(function (button) {
			// If the button is not a toggle-button (or an instance of it), then skip it.
			// Can't set the state of it or do anything.
			if (typeof button.handle.setActive !== 'function') {
				return;
			}

			var statusWasSet = false;
			var nodeNames = [button.markup[0].nodeName];
			if (plugin.conversionNames[button.markup[0].nodeName]) {
				nodeNames.push(plugin.conversionNames[markup[0].nodeName]);
			}

			for (i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[i];
				for (j = 0; j < nodeNames.length; j++) {
					if (Selection.standardTagNameComparator(effectiveMarkup, $('<' + nodeNames[j] + '>'))) {
						button.handle.setActive(true);
						statusWasSet = true;
						break;
					}
				}
				if (statusWasSet) {
					break;
				}
			}

			if (!statusWasSet) {
				button.handle.setActive(false);
			}
		});

		// Typography/Blocklevel formats like h1
		if (plugin.typographyButton) {
			var typographyElements = Object.entries(plugin.buttonConfig).filter(function (entry) {
				return entry[1].typography;
			}).map(function (entry) {
				return entry[0];
			});
			var effectiveTypo = null;
			var typoElement = null;

			for (i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				if (effectiveTypo) {
					break;
				}
				effectiveMarkup = rangeObject.markupEffectiveAtStart[i];
				for (var j = 0; j < typographyElements.length; j++) {
					var typo = typographyElements[j];
					if (Selection.standardTagNameComparator(effectiveMarkup, $('<' + typo + '>'))) {
						effectiveTypo = typo;
						typoElement = effectiveMarkup;
						break;
					}
				}
			}

			/** @type {FormattingOption|null} */
			var settings = plugin.config[effectiveTypo];
			if (!settings) {
				settings = Object.assign({}, DEFAULT_BUTTON_CONFIG[effectiveTypo], settings);
			}

			plugin.activeTypography = effectiveTypo;
			plugin.typographyElement$ = typoElement ? $(typoElement) : null;
			plugin.typographyButton.setIcon(settings.icon || Icons.TYPOGRAPHY);
			plugin.typographyButton.setText(settings.label || i18n.t('button.typography.tooltip'));
			plugin.typographyButton.setSecondaryVisible(settings != null && settings.typography && settings.header);
		}

		handlePreformattedText(rangeObject.commonAncestorContainer);
	}

	/**
	 * Handles preformatted text.
	 * Adds empty paragraphs as landing stripes before and after a preformatted text.
	 *
	 * @private
	 * @param {Element} element a Dom element
	 */
	function handlePreformattedText(element) {
		var $element = $(element);

		if ($element.is('.aloha-editing-p.aloha-placeholder')) {
			//remove all other placeholders
			$element[0].className = '';
			removePlaceholders();
			$element[0].className = 'aloha-editing-p aloha-placeholder';
			return;
		}

		removePlaceholders();

		if (!$element.is('pre')) {
			return;
		}

		//add placeholder before and after the preformatted text element
		var nextSibling = $element[0].nextSibling;
		var previousSibling = $element[0].previousSibling;
		if (!previousSibling || !nextSibling) {
			if (!previousSibling) {
				$element.before(createLanding());
			}
			if (!nextSibling) {
				$element.after(createLanding());
			}
		}
	}

	/**
	 * Helper function to create the placeholder $ element
	 *
	 * @private
	 * @returns {Object} the landing $ element
	 */
	function createLanding() {
		//IE: add a "word joiner" character instead of a <br>
		var landing = Browser.ie
			? '<p class="aloha-editing-p aloha-placeholder">&#x2060;</p>'
			: '<p class="aloha-editing-p aloha-placeholder"><br class="aloha-end-br"></p>';
		return $(landing);
	}

	/**
	 * Remove editing placeholders
	 *
	 * @private
	 */
	function removePlaceholders() {
		if (Aloha.activeEditable) {
			Aloha.activeEditable.removePlaceholder(Aloha.activeEditable.obj);
		}
	}

	/** @type {object.<string,FormattingOption>} */
	var DEFAULT_BUTTON_CONFIG = {
		// Text Level
		'u': {
			name: 'underline',
			icon: Icons.UNDERLINE,
			label: i18n.t('button.u.tooltip'),
			typography: false,
			header: false,
		},
		'b': {
			name: 'bold',
			icon: Icons.BOLD,
			label: i18n.t('button.b.tooltip'),
			typography: false,
			header: false,
		},
		'i': {
			name: 'italic',
			icon: Icons.ITALIC,
			label: i18n.t('button.i.tooltip'),
			typography: false,
			header: false,
		},
		'cite': {
			icon: Icons.CITATION,
			label: i18n.t('button.cite.tooltip'),
			typography: false,
			header: false,
		},
		'q': {
			name: 'quote',
			icon: Icons.QUOTE,
			label: i18n.t('button.q.tooltip'),
			typography: false,
			header: false,
		},
		'code': {
			icon: Icons.CODE,
			label: i18n.t('button.code.tooltip'),
			typography: false,
			header: false,
		},
		'del': {
			icon: Icons.DELETED,
			label: i18n.t('button.del.tooltip'),
			typography: false,
			header: false,
		},
		'ins': {
			icon: Icons.INSERTED,
			label: i18n.t('button.ins.tooltip'),
			typography: false,
			header: false,
		},
		's': {
			name: 'strikethrough',
			icon: Icons.STRIKE_THROUGH,
			label: i18n.t('button.s.tooltip'),
			typography: false,
			header: false,
		},
		'sub': {
			name: 'subscript',
			icon: Icons.SUB_SCRIPT,
			label: i18n.t('button.sub.tooltip'),
			typography: false,
			header: false,
		},
		'sup': {
			name: 'superscript',
			icon: Icons.SUPER_SCRIPT,
			label: i18n.t('button.sup.tooltip'),
			typography: false,
			header: false,
		},

		// Typography / Block level
		'p': {
			icon: Icons.PARAGRAPH,
			label: i18n.t('button.p.tooltip'),
			typography: true,
			header: false,
		},
		'pre': {
			icon: Icons.PRE_FORMATTED,
			label: i18n.t('button.pre.tooltip'),
			typography: true,
			header: false,
		},
		'h1': {
			icon: Icons.HEADER_1,
			label: i18n.t('button.h1.tooltip'),
			typography: true,
			header: true,
		},
		'h2': {
			icon: Icons.HEADER_2,
			label: i18n.t('button.h2.tooltip'),
			typography: true,
			header: true,
		},
		'h3': {
			icon: Icons.HEADER_3,
			label: i18n.t('button.h3.tooltip'),
			typography: true,
			header: true,
		},
		'h4': {
			icon: Icons.HEADER_4,
			label: i18n.t('button.h4.tooltip'),
			typography: true,
			header: true,
		},
		'h5': {
			icon: Icons.HEADER_5,
			label: i18n.t('button.h5.tooltip'),
			typography: true,
			header: true,
		},
		'h6': {
			icon: Icons.HEADER_6,
			label: i18n.t('button.h6.tooltip'),
			typography: true,
			header: true,
		},
	};

	var REMOVE_FORMAT_ID = 'removeFormat';

	/**
	 * register the plugin with unique name
	 */
	var plugin = {

		// These are old/deprecated nodes and will be converted to the modern equivalent
		conversionNames: {
			'strong': 'b',
			'em': 'i',
		},

		headerNodeNames: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

		/**
		 * General button configuration for the plugin
		 */
		buttonConfig: structuredClone(DEFAULT_BUTTON_CONFIG),

		/**
		 * Array of which buttons are available/visible/enabled for the user
		 */
		config: Object.keys(DEFAULT_BUTTON_CONFIG).concat(REMOVE_FORMAT_ID),

		/**
		 * Map for the currently created/managed buttons
		 * @type {Object<string, { markup: string, handle: ToggleButton }>}
		 */
		buttons: {},

		/**
		 * HotKeys used for special actions
		 */
		hotKey: {
			formatBold: 'ctrl+b meta+b',
			formatItalic: 'ctrl+i meta+i',
			formatUnderline: 'ctrl+u meta+u',
			formatParagraph: 'alt+ctrl+0 alt+meta+0',
			formatH1: 'alt+ctrl+1 alt+meta+1',
			formatH2: 'alt+ctrl+2 alt+meta+2',
			formatH3: 'alt+ctrl+3 alt+meta+3',
			formatH4: 'alt+ctrl+4 alt+meta+4',
			formatH5: 'alt+ctrl+5 alt+meta+5',
			formatH6: 'alt+ctrl+6 alt+meta+6',
			formatPre: 'ctrl+p meta+p',
			formatDel: 'ctrl+d meta+d',
			formatSub: 'alt+shift+s',
			formatSup: 'ctrl+shift+s'
		},

		activeTypography: null,
		formatOptions: [],
		typographyOptions: [],

		/** @type {SplitButton} */
		typographyButton: null,

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			Ephemera.classes(CLASS_HIERACHY_VIOLATION);

			Ephemera.classes('aloha-heading-hierarchy-violated');

			if (typeof plugin.settings.hotKey !== 'undefined') {
				$.extend(true, plugin.hotKey, plugin.settings.hotKey);
			}

			if (typeof plugin.settings.config !== 'undefined') {
				plugin.config = plugin.settings.config;
			}

			plugin.initButtons();

			var shouldCheckHeadingHierarchy = Strings.parseBoolean(plugin.settings.checkHeadingHierarchy);

			var checkHeadings = function () {
				checkHeadingHierarchy(plugin.formatOptions);
			};

			if (shouldCheckHeadingHierarchy) {
				Aloha.bind('aloha-smart-content-changed', checkHeadings);
				Aloha.bind('aloha-markup-change', checkHeadings);
			}

			// apply specific configuration if an editable has been activated
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				plugin.applyButtonConfig(editable.obj);

				if (shouldCheckHeadingHierarchy) {
					checkHeadings();
				}

				var createAdder = function (tagname) {
					if (isFormatAllowed(tagname, plugin, editable)) {
						return function addFormat() {
							plugin.addMarkup(tagname);
							return false;
						};
					}
					return function () {
						return false;
					};
				};

				var createChanger = function (tagname) {
					if (isFormatAllowed(tagname, plugin, editable)) {
						return function changeFormat() {
							plugin.changeMarkup(tagname);
							return false;
						};
					}
					return function () {
						return false;
					};
				};

				var $editable = editable.obj;
				$editable.on('keydown.aloha.format', plugin.hotKey.formatBold, createAdder('b'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatItalic, createAdder('i'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatUnderline, createAdder('u'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatDel, createAdder('del'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatSub, createAdder('sub'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatSup, createAdder('sup'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatParagraph, createChanger('p'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH1, createChanger('h1'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH2, createChanger('h2'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH3, createChanger('h3'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH4, createChanger('h4'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH5, createChanger('h5'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatH6, createChanger('h6'));
				$editable.on('keydown.aloha.format', plugin.hotKey.formatPre, createChanger('pre'));
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				onSelectionChanged(message.range);
			});

			PubSub.sub('aloha.editable.deactivated', function (message) {
				message.editable.obj.unbind('keydown.aloha.format');

				// Set all buttons to inactive if we leave the editable, and hide them
				if (plugin.buttons) {
					Object.values(plugin.buttons).forEach(function (button) {
						if (typeof button.handle.setActive === 'function') {
							button.handle.setActive(false);
						}
						button.handle.hide();
					});
				}

				plugin.typographyButton.hide();
			});
		},

		/**
		 * applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {jQuery} $editable The editable object
		 * @return void
		 */
		applyButtonConfig: function ($editable) {
			var config = [];
			
			if ($editable != null) {
				config = plugin.getEditableConfig($editable);
			}

			if (config != null && typeof config === 'object' && !Array.isArray(config)) {
				config = Object.entries(config).reduce(function(acc, entry) {
					if (entry[1]) {
						acc.push(entry[0]);
					}
					return acc;
				}, []);
			}

			plugin.formatOptions = config;

			// now iterate all buttons and show/hide them according to the config
			Object.entries(plugin.buttons).forEach(function(entry) {
				var buttonName = entry[0];
				var button = entry[1];

				if (
					$editable == null
					|| !ContentRules.isAllowed($editable[0], buttonName)
					|| !config.includes(buttonName)
				) {
					button.handle.hide();
				} else {
					button.handle.show();
				}
			});

			plugin.typographyOptions = Object.entries(plugin.buttonConfig).map(function(entry) {
				var name = entry[0];
				var elemConfig = entry[1];

				// Ignore non-typography elements
				if (!elemConfig.typography) {
					return null;
				}

				// Skip elements which aren't allowed
				if (
					$editable == null
					||!ContentRules.isAllowed($editable[0], name)
					|| !config.includes(name)
				) {
					return null;
				}

				return name;
			}).filter(function(value) {
				return value != null;
			});

			// We need at least two options, otherwise the button/selection wouldn't make sense
			if (plugin.typographyOptions.length <= 1) {
				plugin.typographyButton.hide();
			} else {
				plugin.typographyButton.show();
			}
		},

		/**
		 * initialize the buttons and register them on floating menu
		 * @param event event object
		 * @param editable current editable object
		 */
		initButtons: function () {
			plugin.buttons = {};

			// First create all the regular formatting buttons
			(plugin.config || []).forEach(function (nodeName) {
				var settings = plugin.buttonConfig[nodeName];

				// If there's no settings, we have to ignore it
				if (!settings) {
					return;
				}

				// Ignore typography buttons for now
				if (settings.typography) {
					return;
				}

				plugin.buttons[nodeName] = {
					handle: plugin.makeTextLevelButton(nodeName, settings),
					markup: $('<' + nodeName + '>'),
				};
			});

			plugin.buttons[REMOVE_FORMAT_ID] = {
				handle: makeRemoveFormatButton(),
				markup: null,
			};

			plugin.typographyButton = Ui.adopt('typographyMenu', SplitButton, {
				icon: Icons.TYPOGRAPHY,
				text: i18n.t('button.typography.tooltip'),
				iconOnly: false,

				click: function () {
					var context = plugin._createTypographyContext();
					if (context == null) {
						return;
					}

					var data = Dropdown.openDynamicDropdown(plugin.typographyButton.name, context);
					if (!data) {
						return;
					}

					data.then(function (ctl) {
						return ctl.value;
					}).then(function (result) {
						plugin._applyTypography(result.id);
					}).catch(function (error) {
						if (!Utils.isUserCloseError(error)) {
							console.error(error);
						}
					});
				},

				secondaryClick: function () {
					/** @type {FormattingOption} */
					var settings = plugin.config[plugin.activeTypography];
					if (!settings) {
						settings = DEFAULT_BUTTON_CONFIG[plugin.activeTypography];
					}

					var data = Dropdown.openDynamicDropdown(plugin.typographyButton.name, plugin._createHeaderIdContext(settings));
					if (!data) {
						return;
					}

					data.then(function (ctl) {
						return ctl.value;
					}).then(function (value) {
						plugin._applyHeaderId((value || '').trim());
					}).catch(function (error) {
						if (!Utils.isUserCloseError(error)) {
							console.error(error);
						}
					});
				},
			});

			if (Aloha.activeEditable) {
				plugin.applyButtonConfig(Aloha.activeEditable.obj);
			} else {
				plugin.applyButtonConfig(null);
			}
		},

		_createTypographyContext: function () {
			var latestOptions = (plugin.typographyOptions || []).map(function (nodeName) {
				var settings = plugin.buttonConfig[nodeName];

				// If there's no settings, we have to ignore it
				if (!settings) {
					return null;
				}

				// Only check for typography buttons
				if (!settings.typography) {
					return null;
				}

				var out = {
					id: nodeName,
					label: settings.label,
					icon: settings.icon,
				};

				return out;
			}).filter(function (option) {
				return option != null;
			});

			// In case there's only one option, and we already have it selected,
			// then we can skip opening the context all together, as the user can't
			// change it to something else anyways.
			if (latestOptions.length === 1 && latestOptions[0].id === plugin.activeTypography) {
				return null;
			}

			return {
				type: 'select-menu',
				options: {
					iconsOnly: false,
					options: latestOptions,
				},
				initialValue: plugin.activeTypography,
			};
		},

		/**
		 * @param {string} typography
		 */
		_applyTypography: function (typography) {
			var oldTypography = plugin.activeTypography;
			plugin.activeTypography = typography;

			PubSub.pub('aloha.format.pre_change', {
				level: 'block',
				oldFormat: oldTypography,
				newFormat: plugin.activeTypography,
			});

			changeMarkup(plugin.activeTypography);

			PubSub.pub('aloha.format.changed', {
				level: 'block',
				oldFormat: oldTypography,
				newFormat: plugin.activeTypography,
			});
		},

		/**
		 * 
		 * @param {FormattingOption} settings
		 */
		_createHeaderIdContext: function (settings) {
			var headerId = null;
			if (plugin.typographyElement$) {
				headerId = plugin.typographyElement$.attr(ATTR_HEADER_ID);
			}

			return {
				type: 'input',
				options: {
					label: i18n.t('button.header_id.input'),
				},
				initialValue: headerId,
			};
		},

		_applyHeaderId: function (value) {
			if (!plugin.typographyElement$) {
				return;
			}

			$(plugin.typographyElement$).attr(ATTR_HEADER_ID, value);

			// Add the customized class if a ID has been set. Otherwise remove it, so the headerids plugin
			// could automatically add it again if needed/enabled.
			if (value) {
				$(plugin.typographyElement$).addClass(CLASS_CUSTOMIZED);
			} else {
				$(plugin.typographyElement$).removeClass(CLASS_CUSTOMIZED);
			}
		},

		makeTextLevelButton: function (nodeType, settings) {
			var name = settings.name || nodeType;
			var component = Ui.adopt(name, ToggleButton, {
				tooltip: settings.label,
				icon: settings.icon,
				pure: true,
				click: function () {
					return textLevelButtonClickHandler(nodeType, name);
				}
			});

			return component;
		},

		// duplicated code from link-plugin
		//Creates string with this component's namepsace prefixed the each classname
		nsClass: function () {
			return Array.from(arguments).map(function(className) {
				return pluginNamespace + (className == '' ? '' : '-' + className);
			}).join(' ').trim();
		},

		// duplicated code from link-plugin
		nsSel: function () {
			return Array.from(arguments).map(function(selector) {
				return '.' + pluginNamespace + (selector == '' ? '' : '-' + selector);
			}).join(' ').trim();
		},

		addMarkup: addMarkup,
		changeMarkup: changeMarkup,

		/**
		 * Removes all formatting from the current selection.
		 * And deconstructs lists via unformatList method.
		 */
		removeFormat: function () {
			var formats = [
				'u', 'strong', 'em', 'b', 'i', 'q', 'del', 's', 'code', 'sub', 'sup',
				'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'quote', 'blockquote',
				'address', 'small', 'cite', 'dfn',
				'abbr', 'time', 'var', 'samp', 'kbd', 'mark', 'span', 'ins'
			],
				rangeObject = Selection.rangeObject,
				i;

			// formats to be removed by the removeFormat button may now be configured using Aloha.settings.plugins.format.removeFormats = ['b', 'strong', ...]
			if (plugin.settings.removeFormats) {
				formats = plugin.settings.removeFormats;
			}

			if (rangeObject.isCollapsed()) {
				var rangeEditingHost = Dom.getEditingHostOf(rangeObject.startContainer);
				var limit = rangeEditingHost ? $(rangeEditingHost) : Aloha.activeEditable.obj;

				for (i = 0; i < formats.length; i++) {
					var format = formats[i].toUpperCase();

					// check whether the markup is found in the range (at the start of the range)
					var nodeNames = [format];
					if (plugin.conversionNames[format]) {
						nodeNames.push(plugin.conversionNames[format]);
					}

					var foundMarkup = rangeObject.findMarkup(function (nodeElement) {
						return nodeNames.includes(nodeElement.nodeName);
					}, limit);

					if (foundMarkup) {
						Dom.removeFromDOM(foundMarkup, rangeObject, true);
					}
				}
			} else {
				var rangeEditingHost = Dom.getEditingHostOf(rangeObject.startContainer);
				var limit = rangeEditingHost ? $(rangeEditingHost) : Aloha.activeEditable.obj;
				for (i = 0; i < formats.length; i++) {
					Dom.removeMarkup(
						rangeObject,
						$('<' + formats[i] + '>'),
						limit,
						false);
				}
				unformatList(rangeObject);
			}

			updateUiAfterMutation(rangeObject);
			if (Aloha.activeEditable) {
				Aloha.activeEditable.smartContentChange({ type: 'block-change' });
			}
		},

		/**
		 * toString method
		 * @return string
		 */
		toString: function () {
			return 'format';
		}
	};

	plugin = Plugin.create('format', plugin);

	return plugin;
});
