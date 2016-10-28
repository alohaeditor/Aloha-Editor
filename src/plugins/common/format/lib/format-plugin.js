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
	'util/arrays',
	'util/html',
	'util/dom',
	'util/browser',
	'util/maps',
	'util/strings',
	'ui/ui',
	'ui/toggleButton',
	'ui/port-helper-multi-split',
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
	Arrays,
	Html,
	Dom,
	Browser,
	Maps,
	Strings,
	Ui,
	ToggleButton,
	MultiSplitButton,
	i18n
) {
	'use strict';

	var $ = jQuery;
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

	/**
	 * Checks if the selection spans a whole node (HTML element)
	 * @param Range range
	 * @return {boolean}
	 */
	function isEntireNodeInRange(range) {
		var sc = range.startContainer;
		var	so = range.startOffset;
		var	ec = range.endContainer;
		var	eo = range.endOffset;
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
	function isListElement(node){
		return LIST_ELEMENT[node.nodeName];
	}

	/**
	 * Determines if a markup is a heading
	 * @param string markup
	 * @returns {boolean}
	 */
	function isHeading(markup){
		return jQuery.inArray(markup,['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) >= 0;
	}

	/**
	 * Checks whether range spans multiple lists
	 * @param Range range
	 * @return {boolean}
	 */
	function spansMultipleLists(range){
		return range.startContainer !== range.endContainer;
	}

	/**
	 * Take list items out of their encompassing list element.
	 * Wrap items in <p> and delete any remaining empty lists.
	 * @param Range range
	 * @return void
	 */
	function unformatList(range){
		expandRange(range);

		var cac = range.commonAncestorContainer;

		if (!isListElement(cac)){
			return;
		}

		if (!isEntireNodeInRange(range) && !spansMultipleLists(range)) {
			return;
		}

		var selectedNodes = jQuery(range.startContainer.parentNode).nextUntil(jQuery(range.endContainer.parentNode).next()).andSelf();
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
		jQuery('._moved').each(function() {
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
		if (Aloha.activeEditable && jQuery.browser.mozilla && document.activeElement !== Aloha.activeEditable.obj[0]) {
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
			click: function () {
				return textLevelButtonClickHandler(formatPlugin, button); 
			}
		});
		return component;
	}

	function makeBlockLevelButton(formatPlugin, button) {
		return {
			name: button,
			tooltip: i18n.t('button.' + button + '.tooltip'),
			iconClass: 'aloha-icon ' + i18n.t('aloha-large-icon-' + button),
			markup: jQuery('<' + button + '>'),
			click: function () { 
				return blockLevelButtonClickHandler(formatPlugin, button); 
			}
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
		parent.find(":not(h1,h2,h3,h4,h5,h6)").each(function() {
			$(this).removeClass("aloha-heading-hierarchy-violated");
		});

		//set startheading to heading with smallest number available in the config
		for (var i = 0; i < config.length; i++){
			if (isHeading(config[i])) {
				if (typeof startHeading !== 'undefined') {
					if (parseInt(config[i].charAt(1),10) < startHeading) {
						startHeading = parseInt(config[i].charAt(1),10);
					}
				} else {
					//first heading found in config
					startHeading = parseInt(config[i].charAt(1),10);
				}
			}
		}

		//check the heading hierarchy of every heading
		if (typeof startHeading !== 'undefined') {
			//this find() returns all headings in tree order
			parent.find("h1,h2,h3,h4,h5,h6").each(function (){
				currentHeading = parseInt(this.nodeName.charAt(1),10);
				if (typeof lastCorrectHeading !== 'undefined') {
					//the current heading hierarchy must be lower than the startHeading hierarchy
					if (currentHeading < startHeading) {
						$(this).addClass("aloha-heading-hierarchy-violated");
					} else {
						//heading hierarchy is violated if a heading is more
						//than one hierarchy lower than the last correct heading
						if (currentHeading > (lastCorrectHeading+1)) {
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
	}

	function changeMarkup(button) {
		Selection.changeMarkupOnSelection(jQuery('<' + button + '>'));
		if (Aloha.settings.plugins.format && Aloha.settings.plugins.format.checkHeadingHierarchy) {
			checkHeadingHierarchy(this.formatOptions);
		}
	}

	function updateUiAfterMutation(formatPlugin, rangeObject) {
		// select the modified range
		rangeObject.select();
		// update Button toggle state. We take Selection.getRangeObject()
		// because rangeObject is not up-to-date
		onSelectionChanged(formatPlugin, Selection.getRangeObject());
	}

	function format(formatPlugin, rangeObject, markup) {
		Dom.addMarkup(rangeObject, markup);
		updateUiAfterMutation(formatPlugin, rangeObject);
	}

	function isFormatAllowed(tagname, plugin, editable) {
		if (!ContentRules.isAllowed(editable.obj[0], tagname)) {
			return false;
		}
		var config = plugin.getEditableConfig(editable.obj);
		return config ? $.inArray(tagname, config) > -1 : false;
	}

	function addMarkup(button) {
		var formatPlugin = this,
			markup = jQuery('<'+button+'>'),
			rangeObject = Selection.rangeObject;

		if ( typeof button === "undefined" || button == "" ) {
			return;
		}

		// check whether the markup is found in the range (at the start of the range)
		var nodeNames = interchangeableNodeNames[markup[0].nodeName] || [markup[0].nodeName];
		var foundMarkup = rangeObject.findMarkup(function() {
			return -1 !== Arrays.indexOf(nodeNames, this.nodeName);
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
			updateUiAfterMutation(formatPlugin, rangeObject);
		} else {
			// when the range is collapsed, extend it to a word
			if (rangeObject.isCollapsed()) {
				Dom.extendToWord(rangeObject);
				if (rangeObject.isCollapsed()) {
					if (StateOverride.enabled()) {
						StateOverride.setWithRangeObject(
							commandsByElement[button],
							rangeObject,
							function (command, rangeObject) {
								format(formatPlugin, rangeObject, markup);
							}
						);
						return;
					}
				}
			}
			format(formatPlugin, rangeObject, markup);
		}
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
					if (Selection.standardTextLevelSemanticsComparator(effectiveMarkup, jQuery('<' + nodeNames[j] + '>'))) {
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
					if (Selection.standardTextLevelSemanticsComparator(effectiveMarkup, multiSplitItem.markup)) {
						formatPlugin.multiSplitButton.setActiveItem(multiSplitItem.name);
						foundMultiSplit = true;
					}
				}
			}

			if (!foundMultiSplit) {
				formatPlugin.multiSplitButton.setActiveItem(null);
			}
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

		if ($element.is('pre')) {
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
	function removePlaceholders(){
		if (Aloha.activeEditable) {
			Aloha.activeEditable.removePlaceholder(Aloha.activeEditable.obj);
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
			formatBold:      'ctrl+b meta+b',
			formatItalic:    'ctrl+i meta+i',
			formatUnderline: 'ctrl+u meta+u',
			formatParagraph: 'alt+ctrl+0 alt+meta+0',
			formatH1:        'alt+ctrl+1 alt+meta+1',
			formatH2:        'alt+ctrl+2 alt+meta+2',
			formatH3:        'alt+ctrl+3 alt+meta+3',
			formatH4:        'alt+ctrl+4 alt+meta+4',
			formatH5:        'alt+ctrl+5 alt+meta+5',
			formatH6:        'alt+ctrl+6 alt+meta+6',
			formatPre:       'ctrl+p meta+p',
			formatDel:       'ctrl+d meta+d',
			formatSub:       'alt+shift+s',
			formatSup:       'ctrl+shift+s'
		},

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			var me = this;

			Ephemera.classes('aloha-heading-hierarchy-violated');

			if (typeof this.settings.hotKey !== 'undefined') {
				jQuery.extend(true, this.hotKey, this.settings.hotKey);
			}

			this.initButtons();

			Aloha.bind('aloha-plugins-loaded', function () {
				// @todo add config option for sidebar panel
				me.initSidebar(Aloha.Sidebar.right);
			});

			var shouldCheckHeadingHierarchy = Strings.parseBoolean(this.settings.checkHeadingHierarchy);

			var checkHeadings = function () {
				checkHeadingHierarchy(me.formatOptions);
			};

			if (shouldCheckHeadingHierarchy) {
				Aloha.bind('aloha-smart-content-changed', checkHeadings);
				Aloha.bind('aloha-markup-change', checkHeadings);
			}

			// apply specific configuration if an editable has been activated
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				me.applyButtonConfig(editable.obj);

				if (shouldCheckHeadingHierarchy) {
					checkHeadings();
				}

				var createAdder = function (tagname) {
					if (isFormatAllowed(tagname, me, editable)) {
						return function addFormat() {
							me.addMarkup(tagname);
							return false;
						};
					}
					return function () {
						return false;
					};
				};

				var createChanger = function (tagname) {
					if (isFormatAllowed(tagname, me, editable)) {
						return function changeFormat() {
							me.changeMarkup(tagname);
							return false;
						};
					}
					return function () {
						return false;
					};
				};

				var $editable = editable.obj;
				$editable.bind('keydown.aloha.format',  me.hotKey.formatBold,      createAdder('b'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatItalic,    createAdder('i'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatUnderline, createAdder('u'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatDel,       createAdder('del'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatSub,       createAdder('sub'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatSup,       createAdder('sup'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatParagraph, createChanger('p'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH1,        createChanger('h1'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH2,        createChanger('h2'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH3,        createChanger('h3'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH4,        createChanger('h4'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH5,        createChanger('h5'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatH6,        createChanger('h6'));
				$editable.bind('keydown.aloha.format',  me.hotKey.formatPre,       createChanger('pre'));
			});

			PubSub.sub('aloha.editable.deactivated', function (message) {
				message.editable.obj.unbind('keydown.aloha.format');
			});
		},

		/**
		 * applys a configuration specific for an editable
		 * buttons not available in this configuration are hidden
		 * @param {Object} id of the activated editable
		 * @return void
		 */
		applyButtonConfig: function ($editable) {
			var config = this.getEditableConfig($editable),
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

			var editable = $editable[0];

			// now iterate all buttons and show/hide them according to the config
			for ( button in this.buttons) {
				if (this.buttons.hasOwnProperty(button)) {
					if (!ContentRules.isAllowed(editable, button)) {
						this.buttons[button].handle.hide();
					} else if (jQuery.inArray(button, config) !== -1) {
						this.buttons[button].handle.show();
					} else {
						this.buttons[button].handle.hide();
					}
				}
			}

			// and the same for multisplit items
			len = this.multiSplitItems.length;
			for (i = 0; i < len; i++) {
				var name = this.multiSplitItems[i].name;

				// Currently removeFormat is the only button, that would not
				// insert tags, and can therefore ignore the content rules.
				if (name != 'removeFormat' && !ContentRules.isAllowed(editable, name)) {
					this.multiSplitButton.hideItem(name);
				} else if (jQuery.inArray(name, config) !== -1) {
					this.multiSplitButton.showItem(name);
				} else {
					this.multiSplitButton.hideItem(name);
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

			$.each(this.availableButtons, function(j, button) {
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

			this.multiSplitButton = new MultiSplitButton({
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

					var content = this.setContent(html).content;

					jQuery( pl.nsSel( 'framename' ) ).live( 'keyup', function () {
						jQuery( that.effective ).attr( 'target', jQuery( this ).val().replace( '\"', '&quot;' ).replace( "'", "&#39;" ) );
					} );

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
		 * And deconstructs lists via unformatList method.
		 */
		removeFormat: function() {
			var formats = [
				'u', 'strong', 'em', 'b', 'i', 'q', 'del', 's', 'code', 'sub', 'sup',
				'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'quote', 'blockquote',
				'address', 'small', 'cite', 'dfn',
				'abbr', 'time', 'var', 'samp', 'kbd', 'mark', 'span', 'ins'
				],
			    rangeObject = Selection.rangeObject,
			    i;

			// formats to be removed by the removeFormat button may now be configured using Aloha.settings.plugins.format.removeFormats = ['b', 'strong', ...]
			if (this.settings.removeFormats) {
				formats = this.settings.removeFormats;
			}

			if (rangeObject.isCollapsed()) {
				return;
			}

			for (i = 0; i < formats.length; i++) {
				Dom.removeMarkup(
					rangeObject,
					jQuery('<' + formats[i] + '>'),
					Aloha.activeEditable.obj,
					false);
			}
			unformatList(rangeObject);

			// select the modified range
			rangeObject.select();
			Aloha.activeEditable.smartContentChange({type: 'block-change'});
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
