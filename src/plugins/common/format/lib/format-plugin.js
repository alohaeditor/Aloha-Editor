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
	'aloha/keybinds',
	'util/arrays',
	'util/html',
	'util/dom',
	'util/browser',
	'util/strings',
	'util/range-context',
	'ui/ui',
	'ui/button',
	'ui/toggleButton',
	'ui/splitButton',
	'ui/icons',
	'ui/dropdown',
	'ui/utils',
	'i18n!format/nls/i18n'
], function (
	jQuery,
	Aloha,
	PubSub,
	Plugin,
	StateOverride,
	ContentRules,
	Ephemera,
	Selection,
	Keybinds,
	Arrays,
	Html,
	Dom,
	Browser,
	Strings,
	RangeContext,
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

	var $ = jQuery;
	var pluginNamespace = 'aloha-format';

	/** Class which needs to be set on headers when the IDs are manually set. */
	var CLASS_CUSTOMIZED = 'aloha-customized';

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
	 * Expands the (invisible) range to encompass the whole node
	 * that was selected by the user
	 * @param Range range
	 * @return void
	 */
	function expandRange(range) {
		var cac = range.commonAncestorContainer;

		if (Html.isInlineFormattable(cac) && cac.parentNode) {
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
		return jQuery.inArray(markup, this.headerNodeNames) >= 0;
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

		var selectedNodes = jQuery(range.startContainer.parentNode).nextUntil(jQuery(range.endContainer.parentNode).next()).addBack();
		var prevNodes = jQuery(range.startContainer.parentNode).prevAll();
		var nextNodes = jQuery(range.endContainer.parentNode).nextAll();
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
				jQuery('<' + listName.toLowerCase() + '>').append(nextNodes).insertAfter(selectedNodes);
			}
		}
		// multiple list items up to whole list
		else {
			selectedNodes.addClass('_moved').remove().insertAfter(cac);
			if (nextNodes.length > 0) {
				jQuery('<' + listName.toLowerCase() + '>').append(nextNodes).insertAfter(selectedNodes.last());
			}
		}

		// unwrap moved list elements
		jQuery('._moved').each(function () {
			var $p = jQuery('<p>');
			var $this = jQuery(this);

			$this.after($p);
			$this.contents().unwrap().appendTo($p);
		});

		// If we are at the first list element, get rid of original (now empty) list
		if (prevNodes.length === 0) {
			cac.remove();
		}
	}

	function formatInsideTableWorkaround(nodeType) {
		var selectedCells = jQuery('.aloha-cell-selected');
		if (selectedCells.length < 1) {
			return false;
		}

		var cellMarkupCounter = 0;
		selectedCells.each(function () {
			var cellContent = jQuery(this).find('div'),
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
		addMarkup(nodeType, commandName);
		return false;
	}

	function makeRemoveFormatButton() {
		return Ui.adopt(REMOVE_FORMAT_ID, Button, {
			tooltip: i18n.t('button.removeFormat.tooltip'),
			icon: Icons.CLEAR,
			click: function () {
				FormatPlugin.removeFormat();
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
			$(this).removeClass("aloha-heading-hierarchy-violated");
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
					$(this).addClass("aloha-heading-hierarchy-violated");
				} else {
					//heading hierarchy is violated if a heading is more
					//than one hierarchy lower than the last correct heading
					if (currentHeading > (lastCorrectHeading + 1)) {
						$(this).addClass("aloha-heading-hierarchy-violated");
					} else {
						//only set the last heading if the hierarchy is not violated
						lastCorrectHeading = currentHeading;
						$(this).removeClass("aloha-heading-hierarchy-violated");
					}
				}
			} else {
				//first heading! see if it starts with correct heading
				if (currentHeading === startHeading) {
					lastCorrectHeading = currentHeading;
					$(this).removeClass("aloha-heading-hierarchy-violated");
				} else {
					$(this).addClass("aloha-heading-hierarchy-violated");
				}
			}
		});
	}

	function changeMarkup(nodeType) {
		if (!isFormatAllowed(nodeType, FormatPlugin, Aloha.activeEditable)) {
			return false;
		}

		Selection.changeMarkupOnSelection(jQuery('<' + nodeType + '>'));
		if (Strings.parseBoolean(FormatPlugin.settings.checkHeadingHierarchy)) {
			checkHeadingHierarchy(FormatPlugin.formatOptions);
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
			mergeable: /** @param {HTMLElement} node */function (node) {
				return 'Q' === node.nodeName
					&& node.nextSibling != null
					&& 'Q' === node.nextSibling.nodeName;
			}
		}, rangeObject);
		updateUiAfterMutation(rangeObject);
	}

	function isFormatAllowed(tagname, plugin, editable) {
		if (
			editable == null
			|| editable.obj == null
			|| editable.obj[0] == null
			|| !ContentRules.isAllowed(editable.obj[0], tagname)
		) {
			return false;
		}
		var config = plugin.getEditableConfig(editable.obj);
		return config ? $.inArray(tagname, config) > -1 : false;
	}

	function addMarkup(nodeType, command) {
		var markup = jQuery('<' + nodeType + '>'),
			rangeObject = Selection.rangeObject;

		if (nodeType == null || !nodeType || Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
			return;
		}

		// If the node-type isn't allowed, skip
		if (!isFormatAllowed(nodeType, FormatPlugin, Aloha.activeEditable)) {
			return;
		}

		// check whether the markup is found in the range (at the start of the range)
		var nodeNames = [markup[0].nodeName];
		if (FormatPlugin.conversionNames[markup[0].nodeName] && !FormatPlugin.settings.config.includes(markup[0].nodeName)) {
			nodeNames.push(FormatPlugin.conversionNames[markup[0].nodeName]);
		}

		var foundMarkup = rangeObject.findMarkup(function (nodeElement) {
			return -1 !== Arrays.indexOf(nodeNames, nodeElement.nodeName);
		}, Aloha.activeEditable.obj);

		if (foundMarkup) {
			// remove the markup
			if (rangeObject.isCollapsed()) {
				// when the range is collapsed, we remove exactly the one DOM element
				Dom.removeFromDOM(foundMarkup, rangeObject, true);
			} else {
				// the range is not collapsed, so we remove the markup from the range
				Dom.removeMarkup(rangeObject, jQuery(foundMarkup), Aloha.activeEditable.obj);
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
		jQuery.each(FormatPlugin.buttons, function (index, button) {
			// If the button is not a toggle-button (or an instance of it), then skip it.
			// Can't set the state of it or do anything.
			if (typeof button.handle.setActive !== 'function') {
				return;
			}

			var statusWasSet = false;
			var nodeNames = [button.markup[0].nodeName];
			if (FormatPlugin.conversionNames[button.markup[0].nodeName] && !FormatPlugin.settings.config.includes(button.markup[0].nodeName)) {
				nodeNames.push(FormatPlugin.conversionNames[button.markup[0].nodeName]);
			}

			for (i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[i];
				for (j = 0; j < nodeNames.length; j++) {
					if (Selection.standardTagNameComparator(effectiveMarkup, jQuery('<' + nodeNames[j] + '>'))) {
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
		if (FormatPlugin.typographyButton) {
			var typographyElements = Object.entries(FormatPlugin.buttonConfig).filter(function (entry) {
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
					if (Selection.standardTagNameComparator(effectiveMarkup, jQuery('<' + typo + '>'))) {
						effectiveTypo = typo;
						typoElement = effectiveMarkup;
						break;
					}
				}
			}

			/** @type {FormattingOption|null} */
			var settings = FormatPlugin.config[effectiveTypo];
			if (!settings) {
				settings = Object.assign({}, DEFAULT_BUTTON_CONFIG[effectiveTypo], settings);
			}

			FormatPlugin.activeTypography = effectiveTypo;
			FormatPlugin.typographyElement$ = typoElement ? $(typoElement) : null;
			FormatPlugin.typographyButton.setIcon(settings.icon || Icons.TYPOGRAPHY);
			FormatPlugin.typographyButton.setText(settings.label || i18n.t('button.typography.tooltip'));
			FormatPlugin.typographyButton.setSecondaryVisible(settings != null && settings.typography && settings.header);
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
		var $element = jQuery(element);

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
	 * Helper function to create the placeholder jQuery element
	 *
	 * @private
	 * @returns {Object} the landing jQuery element
	 */
	function createLanding() {
		//IE: add a "word joiner" character instead of a <br>
		var landing = Browser.ie
			? '<p class="aloha-editing-p aloha-placeholder">&#x2060;</p>'
			: '<p class="aloha-editing-p aloha-placeholder"><br class="aloha-end-br"></p>';
		return jQuery(landing);
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
		'abbr': {
			icon: Icons.ABBREVIATION,
			label: i18n.t('button.abbr.tooltip'),
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
		'strong': {
			name: 'strong',
			icon: Icons.STRONG,
			label: i18n.t('button.strong.tooltip'),
			typography: false,
			header: false,
		},
		'em': {
			name: 'emphasize',
			icon: Icons.EMPHASIS,
			label: i18n.t('button.em.tooltip'),
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
	var FormatPlugin = {

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
		// TODO: Move the keybinds into the formatting options
		hotKey: {
			formatBold: 'ControlOrMeta+b',
			formatItalic: 'ControlOrMeta+i',
			formatUnderline: 'ControlOrMeta+u',
			formatParagraph: 'ControlOrMeta+Alt+0',
			formatH1: 'ControlOrMeta+Alt+1',
			formatH2: 'ControlOrMeta+Alt+2',
			formatH3: 'ControlOrMeta+Alt+3',
			formatH4: 'ControlOrMeta+Alt+4',
			formatH5: 'ControlOrMeta+Alt+5',
			formatH6: 'ControlOrMeta+Alt+6',
			formatPre: 'ControlOrMeta+p',
			formatDel: 'ControlOrMeta+d',
			formatSub: 'Alt+Shift+s',
			formatSup: 'Control+Shift+s',
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
			Ephemera.classes('aloha-heading-hierarchy-violated');

			if (typeof this.settings.hotKey !== 'undefined') {
				jQuery.extend(true, this.hotKey, this.settings.hotKey);
			}

			if (typeof this.settings.config !== 'undefined') {
				this.config = this.settings.config;
			}

			this.initButtons();

			var shouldCheckHeadingHierarchy = Strings.parseBoolean(this.settings.checkHeadingHierarchy);

			var checkHeadings = function () {
				checkHeadingHierarchy(FormatPlugin.formatOptions);
			};

			if (shouldCheckHeadingHierarchy) {
				Aloha.bind('aloha-smart-content-changed', checkHeadings);
				Aloha.bind('aloha-markup-change', checkHeadings);
			}

			// apply specific configuration if an editable has been activated
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				FormatPlugin.applyButtonConfig(editable.obj);

				if (shouldCheckHeadingHierarchy) {
					checkHeadings();
				}
			});

			Aloha.bind('aloha-editable-created', function (e, editable) {
				const $element = editable.obj;

				Keybinds.bind($element, 'format.bold', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatBold), function(){ addMarkup('b'); });
				Keybinds.bind($element, 'format.italic', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatItalic), function(){ addMarkup('i'); });
				Keybinds.bind($element, 'format.underline', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatUnderline), function(){ addMarkup('u'); });
				Keybinds.bind($element, 'format.del', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatDel), function(){ addMarkup('del'); });
				Keybinds.bind($element, 'format.sub', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatSub), function(){ addMarkup('sub'); });
				Keybinds.bind($element, 'format.sup', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatSup), function(){ addMarkup('sup'); });
				Keybinds.bind($element, 'format.paragraph', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatParagraph), function(){ changeMarkup('p'); });
				Keybinds.bind($element, 'format.h1', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH1), function(){ changeMarkup('h1'); });
				Keybinds.bind($element, 'format.h2', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH2), function(){ changeMarkup('h2'); });
				Keybinds.bind($element, 'format.h3', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH3), function(){ changeMarkup('h3'); });
				Keybinds.bind($element, 'format.h4', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH4), function(){ changeMarkup('h4'); });
				Keybinds.bind($element, 'format.h5', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH5), function(){ changeMarkup('h5'); });
				Keybinds.bind($element, 'format.h6', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatH6), function(){ changeMarkup('h6'); });
				Keybinds.bind($element, 'format.pre', Keybinds.parseKeybinds(FormatPlugin.hotKey.formatPre), function(){ changeMarkup('pre'); });
			});

			PubSub.sub('aloha.selection.context-change', function (message) {
				onSelectionChanged(message.range);
			});

			PubSub.sub('aloha.editable.deactivated', function () {
				// Set all buttons to inactive if we leave the editable, and hide them
				if (FormatPlugin.buttons) {
					Object.values(FormatPlugin.buttons).forEach(function (button) {
						if (typeof button.handle.setActive === 'function') {
							button.handle.setActive(false);
						}
						button.handle.hide();
					});
				}

				FormatPlugin.typographyButton.hide();
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
				config = FormatPlugin.getEditableConfig($editable);
			}

			if (config != null && typeof config === 'object' && !Array.isArray(config)) {
				config = Object.entries(config).reduce(function (acc, entry) {
					if (entry[1]) {
						acc.push(entry[0]);
					}
					return acc;
				}, []);
			}

			FormatPlugin.formatOptions = config;

			// now iterate all buttons and show/hide them according to the config
			Object.entries(FormatPlugin.buttons).forEach(function (entry) {
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

			FormatPlugin.typographyOptions = Object.entries(FormatPlugin.buttonConfig).map(function (entry) {
				var name = entry[0];
				var elemConfig = entry[1];

				// Ignore non-typography elements
				if (!elemConfig.typography) {
					return null;
				}

				// Skip elements which aren't allowed
				if (
					$editable == null
					|| !ContentRules.isAllowed($editable[0], name)
					|| !config.includes(name)
				) {
					return null;
				}

				return name;
			}).filter(function (value) {
				return value != null;
			});

			// We need at least two options, otherwise the button/selection wouldn't make sense
			if (FormatPlugin.typographyOptions.length <= 1) {
				FormatPlugin.typographyButton.hide();
			} else {
				FormatPlugin.typographyButton.show();
			}
		},

		/**
		 * initialize the buttons and register them on floating menu
		 * @param event event object
		 * @param editable current editable object
		 */
		initButtons: function () {
			FormatPlugin.buttons = {};

			// First create all the regular formatting buttons
			(this.config || []).forEach(function (nodeName) {
				var settings = FormatPlugin.buttonConfig[nodeName];

				// If there's no settings, we have to ignore it
				if (!settings) {
					return;
				}

				// Ignore typography buttons for now
				if (settings.typography) {
					return;
				}

				FormatPlugin.buttons[nodeName] = {
					handle: FormatPlugin.makeTextLevelButton(nodeName, settings),
					markup: jQuery('<' + nodeName + '>'),
				};
			});

			FormatPlugin.buttons[REMOVE_FORMAT_ID] = {
				handle: makeRemoveFormatButton(),
				markup: null,
			};

			FormatPlugin.typographyButton = Ui.adopt('typographyMenu', SplitButton, {
				icon: Icons.TYPOGRAPHY,
				text: i18n.t('button.typography.tooltip'),
				iconOnly: false,

				click: function () {
					var context = FormatPlugin._createTypographyContext();
					if (context == null) {
						return;
					}

					var data = Dropdown.openDynamicDropdown(FormatPlugin.typographyButton.name, context);
					if (!data) {
						return;
					}

					data.then(function (ctl) {
						return ctl.value;
					}).then(function (result) {
						FormatPlugin._applyTypography(result.id);
					}).catch(function (error) {
						if (!Utils.isUserCloseError(error)) {
							console.error(error);
						}
					});
				},

				secondaryClick: function () {
					/** @type {FormattingOption} */
					var settings = FormatPlugin.config[FormatPlugin.activeTypography];
					if (!settings) {
						settings = DEFAULT_BUTTON_CONFIG[FormatPlugin.activeTypography];
					}

					var data = Dropdown.openDynamicDropdown(FormatPlugin.typographyButton.name, FormatPlugin._createHeaderIdContext(settings));
					if (!data) {
						return;
					}

					data.then(function (ctl) {
						return ctl.value;
					}).then(function (value) {
						FormatPlugin._applyHeaderId((value || '').trim());
					}).catch(function (error) {
						if (!Utils.isUserCloseError(error)) {
							console.error(error);
						}
					});
				},
			});

			if (Aloha.activeEditable) {
				FormatPlugin.applyButtonConfig(Aloha.activeEditable.obj);
			} else {
				FormatPlugin.applyButtonConfig(null);
			}
		},

		_createTypographyContext: function () {
			var latestOptions = (FormatPlugin.typographyOptions || []).map(function (nodeName) {
				var settings = FormatPlugin.buttonConfig[nodeName];

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
			if (latestOptions.length === 1 && latestOptions[0].id === FormatPlugin.activeTypography) {
				return null;
			}

			return {
				type: 'select-menu',
				options: {
					iconsOnly: false,
					options: latestOptions,
				},
				initialValue: FormatPlugin.activeTypography,
			};
		},

		/**
		 * @param {string} typography
		 */
		_applyTypography: function (typography) {
			var oldTypography = this.activeTypography;
			this.activeTypography = typography;

			PubSub.pub('aloha.format.pre_change', {
				level: 'block',
				oldFormat: oldTypography,
				newFormat: this.activeTypography,
			});

			changeMarkup(this.activeTypography);

			PubSub.pub('aloha.format.changed', {
				level: 'block',
				oldFormat: oldTypography,
				newFormat: this.activeTypography,
			});
		},

		/**
		 * 
		 * @param {FormattingOption} settings
		 */
		_createHeaderIdContext: function (settings) {
			var headerId = null;
			if (this.typographyElement$) {
				headerId = this.typographyElement$.attr(ATTR_HEADER_ID);
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
			if (!this.typographyElement$) {
				return;
			}

			$(this.typographyElement$).attr(ATTR_HEADER_ID, value);

			// Add the customized class if a ID has been set. Otherwise remove it, so the headerids plugin
			// could automatically add it again if needed/enabled.
			if (value) {
				$(this.typographyElement$).addClass(CLASS_CUSTOMIZED);
			} else {
				$(this.typographyElement$).removeClass(CLASS_CUSTOMIZED);
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
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each(arguments, function () {
				stringBuilder.push(this == '' ? prefix : prefix + '-' + this);
			});
			return jQuery.trim(stringBuilder.join(' '));
		},

		// duplicated code from link-plugin
		nsSel: function () {
			var stringBuilder = [], prefix = pluginNamespace;
			jQuery.each(arguments, function () {
				stringBuilder.push('.' + (this == '' ? prefix : prefix + '-' + this));
			});
			return jQuery.trim(stringBuilder.join(' '));
		},

		addMarkup: addMarkup,
		changeMarkup: changeMarkup,

		/**
		 * Removes all formatting from the current selection.
		 * And deconstructs lists via unformatList method.
		 */
		removeFormat: function () {
			var formats = [
				'abbr', 'b', 'cite', 'code', 'del', 'dfn', 'em', 'font', 'i', 'ins',
				'kbd', 'mark', 'output', 'q', 's', 'samp', 'strike', 'strong',
				'sub', 'sup', 'time', 'u', 'var',
			];
			var styles = [
				'color',
				'background-color',
				'text-align',
			];
			var rangeObject = Selection.rangeObject;

			// formats to be removed by the removeFormat button may now be configured using Aloha.settings.plugins.format.removeFormats = ['b', 'strong', ...]
			if (this.settings.removeFormats) {
				formats = this.settings.removeFormats;
			}

			if (rangeObject.isCollapsed()) {
				var rangeEditingHost = Dom.getEditingHostOf(rangeObject.startContainer);
				var limit = rangeEditingHost ? jQuery(rangeEditingHost) : Aloha.activeEditable.obj;

				for (var i = 0; i < formats.length; i++) {
					var format = formats[i].toUpperCase();

					// check whether the markup is found in the range (at the start of the range)
					var nodeNames = [format];
					if (this.conversionNames[format]) {
						nodeNames.push(this.conversionNames[format]);
					}

					var foundMarkup = rangeObject.findMarkup(function (nodeElement) {
						return -1 !== Arrays.indexOf(nodeNames, nodeElement.nodeName);
					}, limit);

					if (foundMarkup) {
						Dom.removeFromDOM(foundMarkup, rangeObject, true);
					}
				}
			} else {
				var rangeEditingHost = Dom.getEditingHostOf(rangeObject.startContainer);
				var limit = rangeEditingHost ? jQuery(rangeEditingHost) : Aloha.activeEditable.obj;
				for (var i = 0; i < formats.length; i++) {
					Dom.removeMarkup(
						rangeObject,
						jQuery('<' + formats[i] + '>'),
						limit,
						false);
				}
				unformatList(rangeObject);
			}

			// Remove the styles from the range
			for (var i = 0; i < styles.length; i++) {
				RangeContext.formatStyle(Aloha.getSelection().getRangeAt(0), styles[i], null, null, function (a, b) {
					return false;
				});
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

	FormatPlugin = Plugin.create('format', FormatPlugin);

	return FormatPlugin;
});
