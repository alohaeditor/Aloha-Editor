/** @typedef {import('../../ui/lib/toggleSplitButton').ToggleSplitButton} ToggleSplitButton */
/** @typedef {import('../../ui/lib/dropdown').Dropdown} Dropdown */
/** @typedef {import('../../ui/lib/selectMenu').SelectMenuOptions} SelectMenuOptions */
/** @typedef {import('../../ui/lib/selectMenu').SelectMenuResult} SelectMenuResult */

/**
 * Settings for css-classes which should be applied, depending on the nesting level.
 * Example settings:
 * ```js
 * var settings = {
 *   ul: {
 *     list: ['root-level', 'first-level', 'way-too-deep'],
 *     item: ['generic-item']
 *   }
 * }
 * ```
 * 
 * Resulting layout/classes:
 * ```html
 * <ul class="root-level">
 *   <li class="generic-item">
 *     <ul class="first-level">
 *       <li class="generic-item">
 *         <ul class="way-too-deep">
 *           <li class="generic-item">
 *             <ul class="way-too-deep">
 *               <li class="generic-item"></li>
 *               <li class="generic-item"></li>
 *             </ul>
 *           </li>
 *         </ul>
 *       </li>
 *     </ul>
 *   </li>
 * </ul>
 * ```
 * @typedef {object} ListSettings
 * @property {Array.<string>} list Classes that will be applied to the list elements (ul/ol/dl).
 * @property {Array.<string>} item Classes that will be applied to the list items (li/dd)
 */

/**
 * @typedef {object} ListTemplate
 * @property {string} label Label of the template
 * @property {Array.<string>} classes Classes that will be applied to the list-elements when selected.
 * Works the same way as for `ListSettings`.
 * @see ListSettings
 */

/** @typedef {'ul'|'ol'|'dl'} ListType */

/**
 * @typedef {object} ListPlugin
 * @property {Array.<string>} config At which elements the plugin is active at.
 *
 * @property {object.<string, boolean>} transformableElements Elements which can be transformed to lists/list-items.
 * @property {object.<string, Array.<ListTemplate>>} templates Types of templates that can be applied to the list-type. The user can select one.
 * @property {object.<string, ?ListSettings>} defaultClasses Default classes which are applied to list/item elements
 
 * @property {ToggleSplitButton} orderedListButton
 * @property {ToggleSplitButton} unorderedListButton
 * @property {ToggleSplitButton} definitionListButton
 * 
 * @property {function(): HTMLElement | false} getNearestSelectedListItem
 */

/* list-ListPlugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha',
	'PubSub',
	'jquery',
	'aloha/plugin',
	'aloha/content-rules',
	'aloha/engine',
	'util/contenthandler',
	'util/dom',
	'ui/ui',
	'ui/icons',
	'ui/scopes',
	'ui/button',
	'ui/toggleSplitButton',
	'ui/dropdown',
	'ui/utils',
	'i18n!list/nls/i18n'
], function (
	Aloha,
	PubSub,
	/** @type {JQueryStatic} */
	$,
	Plugin,
	ContentRules,
	Engine,
	ContentHandlerUtils,
	Dom,
	Ui,
	Icons,
	Scopes,
	Button,
	ToggleSplitButton,
	/** @type {Dropdown} */
	Dropdown,
	Utils,
	i18n
) {
	'use strict';

	/** @type {Array.<ListType>} */
	var LIST_TYPES = ['ul', 'ol', 'dl'];
	/** @type {Array.<string>} */
	var ITEM_TYPES = ['li', 'dt', 'dd'];
	var VALID_ITEMS = {
		ul: ['li'],
		ol: ['li'],
		dl: ['dt', 'dd']
	};
	var ATTR_DATA_LIST_TEMPLATE = 'data-aloha-list-template';
	var NONE_OPTION_ID = -1;

	/** @typedef {object.<string, boolean>} EditableListConfiguration */
	/** @type {object.<string, EditableListConfiguration>} */
	var configurations = {};

	function getListTypeFromElement($elem) {
		if ($elem.is('ol')) {
			return 'ol';
		} else if ($elem.is('ul')) {
			return 'ul';
		} else if ($elem.is('dl')) {
			return 'dl';
		}
		return false;
	}

	function calculateNestingLevel($elem, $root) {
		var nestingLevel = 0;
		while ($elem.parent().length > 0 && !$elem.parent().is($root)) {
			$elem = $elem.parent();
			if ($elem.is(LIST_TYPES.join(','))) {
				nestingLevel++;
			}
		}
		return nestingLevel;
	}

	function getRootList($elem, $root) {
		var lastParent = $elem;
		while ($elem.parent().length > 0 && !$elem.parent().is($root)) {
			$elem = $elem.parent();
			if ($elem.is(LIST_TYPES.join(','))) {
				lastParent = $elem;
			}
		}
		return lastParent;
	}

	/**
	 * Initializes the plugin button menus.
	 *
	 * @private
	 */
	function initializeButtons() {
		ListPlugin.orderedListButton = Ui.adopt('listOrdered', ToggleSplitButton, /** @type {ToggleSplitButton} */ ({
			tooltip: i18n.t('button.listordered.tooltip'),
			icon: Icons.LIST_ORDERED,
			pure: true,

			secondaryClick: function () {
				ListPlugin.showListDropdown('ol', 'listOrdered');
			},

			onToggle: function (activated) {
				ListPlugin.transformList('ol');
			},
		}));

		ListPlugin.unorderedListButton = Ui.adopt('listUnordered', ToggleSplitButton, /** @type {ToggleSplitButton} */ ({
			tooltip: i18n.t('button.listunordered.tooltip'),
			icon: Icons.LIST_UNORDERED,
			pure: true,

			secondaryClick: function () {
				ListPlugin.showListDropdown('ul', 'listUnordered');
			},

			onToggle: function (activated) {
				ListPlugin.transformList('ul');
			},
		}));

		ListPlugin.definitionListButton = Ui.adopt('listDefinition', ToggleSplitButton, /** @type {ToggleSplitButton} */ ({
			tooltip: i18n.t('button.listdefinition.tooltip'),
			icon: Icons.LIST_DEFINITION,
			pure: true,

			secondaryClick: function () {
				ListPlugin.showListDropdown('dl', 'listDefinition');
			},

			onToggle: function (activated) {
				ListPlugin.transformList('dl');
			},
		}));

		ListPlugin._indentListButton = Ui.adopt('indentList', Button, {
			tooltip: i18n.t('button.indentlist.tooltip'),
			icon: Icons.INDENT,
			click: function () {
				ListPlugin.indentList();
			}
		});

		ListPlugin._outdentListButton = Ui.adopt('outdentList', Button, {
			tooltip: i18n.t('button.outdentlist.tooltip'),
			icon: Icons.OUTDENT,
			click: function () {
				ListPlugin.outdentList();
			}
		});
	}

	/**
	 * Subscribes event handlers to facilitate user interaction on editables.
	 *
	 * @private
	 */
	function registerEventHandlers() {
		PubSub.sub('aloha.editable.created', function (message) {
			var editable = message.editable.obj[0];
			var config = ListPlugin.getEditableConfig(message.editable.obj);

			var newConfig = {};
			LIST_TYPES.forEach(function(type) {
				newConfig[type] = config && config[type] && ContentRules.isAllowed(editable, type);
			});

			configurations[message.editable.getId()] = newConfig;
		});

		Aloha.bind('aloha-smart-content-changed', function (event, data) {
			if (!data.triggerType === 'paste') {
				return;
			}
			// When a paste event occurs, we need to add the defaultClasses to any
			// lists which were pasted in. There is no way to know what was just pasted,
			// so we just go through all lists in the editable.
			data.editable.obj.find(LIST_TYPES.join(',')).each(function (index, list) {
				if (!$(list).contentEditable()) {
					return;
				}
				var nestingLevel = ListPlugin.getListNestingLevel(list);
				if (nestingLevel === 0) {
					ListPlugin.applyDefaultClassesToList(list);
				}
			});
		});

		PubSub.sub('aloha.editable.destroyed', function (message) {
			delete configurations[message.editable.getId()];
		});

		PubSub.sub('aloha.editable.activated', function (message) {
			var config = configurations[message.editable.getId()];
			if (config) {
				LIST_TYPES.forEach(function(type) {
					toggleListOption(type, config[type] !== false);
				});
			}
		});

		PubSub.sub('aloha.editable.deactivated', function () {
			ListPlugin.orderedListButton.setActive(false);
			ListPlugin.unorderedListButton.setActive(false);
			ListPlugin.definitionListButton.setActive(false);
		});

		PubSub.sub('aloha.selection.context-change', function (message) {
			var wasInListScope = ListPlugin._inListScope;

			ListPlugin._inListScope = false;

			ListPlugin.orderedListButton.setActive(false);
			ListPlugin.unorderedListButton.setActive(false);
			ListPlugin.definitionListButton.setActive(false);
			ListPlugin._outdentListButton.show(false);
			ListPlugin._indentListButton.show(false);

			var i;
			var markup;
			var range = message.range;

			for (i = 0; i < range.markupEffectiveAtStart.length; i++) {
				markup = range.markupEffectiveAtStart[i];
				switch (markup.nodeName) {
				case 'DL':
					$(markup).addClass('alohafocus');
					ListPlugin.definitionListButton.setActive(true);
					ListPlugin._inListScope = true;
					break;
				case 'OL':
					ListPlugin._outdentListButton.show(true);
					ListPlugin._indentListButton.show(true);
					ListPlugin.orderedListButton.setActive(true);
					ListPlugin._inListScope = true;
					break;
				case 'UL':
					ListPlugin._outdentListButton.show(true);
					ListPlugin._indentListButton.show(true);
					ListPlugin.unorderedListButton.setActive(true);
					ListPlugin._inListScope = true;
					break;
				}
			}

			if (wasInListScope != ListPlugin._inListScope) {
				if (ListPlugin._inListScope) {
					Scopes.enterScope('Aloha.List');
				} else {
					Scopes.leaveScope('Aloha.List');
				}
			}
		});

		Aloha.Markup.addKeyHandler(9, function (event) {
			return ListPlugin.processTab(event);
		});

		Aloha.Markup.addKeyHandler(8, function (event) {
			return ListPlugin.processBackspace(event);
		});

		Aloha.Markup.addKeyHandler(13, function (event) {
			return ListPlugin.processEnter(event);
		});
	}

	function getTypeButton(listType) {
		switch (listType) {
			case 'ul':
				return ListPlugin.unorderedListButton;
			case 'ol':
				return ListPlugin.orderedListButton;
			case 'dl':
				return ListPlugin.definitionListButton;
		}
		return null;
	}

	/**
	 * Shows or hides the ul, ol or dl buttons in Aloha floating menu if they are
	 * configured.
	 *
	 * @param {ListType} listType the type of listbutton to toggle (ul, ol, dl)
	 * @param {boolean} show hide or show the button
	 */
	function toggleListOption(listType, show) {
		var btn = getTypeButton(listType);
		if (!btn) {
			return;
		}

		if (show) {
			btn.show();
		} else {
			btn.hide();
		}
	}

	/**
	 * Transforms the given list element and its sub elements (if they are in the selection) into
	 * the given transformTo target.
	 * @param domToTransform - The list object that should be transformed
	 * @param transformTo - Transformationtarget e.g. 'ul' / 'ol'
	 */
	function transformExistingListAndSubLists (domToTransform, transformTo) {
		// find and transform sublists if they are in the selection
		$(domToTransform).find(domToTransform.nodeName).each(function () {
			if (isListInSelection(this)) {
				Aloha.Markup.transformDomObject(this, transformTo, Aloha.Selection.rangeObject);
			}
		});

		// the element itself
		var newList = Aloha.Markup.transformDomObject(domToTransform, transformTo, Aloha.Selection.rangeObject);
		ListPlugin.applyDefaultClassesToList(newList);

		Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
	}

	/**
	 * Checks if a dom element is in the given Slectiontree.
	 * @param needle - the searched element
	 * @return returns true if the needle is found in the current selection tree.
	 */
	function isListInSelection(needle) {
		var selectionTree = Aloha.Selection.getSelectionTree();
		return checkSelectionTreeEntryForElement(selectionTree, needle);
	}

	/**
	 * Checks if the given needle is in the given treeElement or in one of its sub elements.
	 * @param treeElement - the tree element to be searched in
	 * @param needle - the searched element
	 */
	function checkSelectionTreeEntryForElement(treeElementArray, needle) {
		return treeElementArray.some(function(element) {
			return (
				(element.domobj === needle && element.selection !== "none")
				|| (element.children && checkSelectionTreeEntryForElement(element.children, needle))
			);
		});
	}

	/**
	 * @param {ListSettings} settings 
	 * @return {Array.<string>}
	 */
	function getCombinedClasses(settings) {
		return (settings.item || []).concat(settings.list || []);
	}

	/**
	 * Takes a value which can be a string or and array, and normalizes to an array.
	 * @param {string|Array<string>} value
	 * @return {Array<string>}
	 */
	function normalizeToArray(value) {
		if (!value) {
			return [];
		} else if (typeof value === 'string') {
			return [value];
		} else {
			return value;
		}
	}

	/**
	 * Register the ListPlugin as Aloha.Plugin
	 * @type {ListPlugin}
	 */
	var ListPlugin = Plugin.create('list', /** @type {ListPlugin} */ ({

		/**
		 * default button configuration
		 */
		config: LIST_TYPES.slice(0),

		/**
		 * List of transformable elements
		 */
		transformableElements: {
			'p' : true,
			'h1' : true,
			'h2' : true,
			'h3' : true,
			'h4' : true,
			'h5' : true,
			'h6' : true,
			'ul' : true,
			'ol' : true,
			'dl': true
		},
		
		templates: {
			ul: [],
			ol: [],
			dl: []
		},

		defaultClasses: {
			ul: {
				list: [],
				item: [],
			},
			ol: {
				list: [],
				item: [],
			},
			dl: {
				list: [],
				item: [],
			},
		},

		orderedListButton: null,
		unorderedListButton: null,
		definitionListButton: null,

		/**
		 * Initializes the ListPlugin. Register buttons, menus, and event handlers.
		 */
		init: function () {
			if (Aloha.settings.plugins && Aloha.settings.plugins.list) {
				if (Aloha.settings.plugins.list.templates) {
					ListPlugin.templates = Aloha.settings.plugins.list.templates;
				}

				if (Aloha.settings.plugins.list.listTypes) {
					ListPlugin.config = LIST_TYPES.filter(function(type) {
						return Aloha.settings.plugins.list.listTypes[type] !== false;
					});
				}

				if (Aloha.settings.plugins.list.defaultClasses) {
					ListPlugin.defaultClasses = ListPlugin.normalizeDefaultClasses(Aloha.settings.plugins.list.defaultClasses);
				}
			}

			initializeButtons();
			registerEventHandlers();

			ListPlugin._inListScope = false;

			Scopes.registerScope('Aloha.List', [Scopes.SCOPE_CONTINUOUS_TEXT]);
		},

		/**
		 * @param {string} listType The key of `defaultClasses` to get the classes from
		 * @returns All css-classes (list + item)
		 */
		getAllClasses: function(listType) {
			return getCombinedClasses(ListPlugin.defaultClasses[listType] || {}).concat(getTemplateClases(listType));
		},

		getTemplateClases: function(listType) {
			return (ListPlugin.templates[listType] || []).flatMap(function(template) {
				return template.classes || [];
			});
		},

		applyNestingClass: function(element, classNames) {
			if (!Array.isArray(classNames) || classNames.length === 0) {
				return;
			}
			var level = ListPlugin.getListNestingLevel(element);
			var classToApply = classNames[Math.min(classNames.length - 1, level)];
			$(element).addClass(classToApply);
		},

		/**
		 * Set selected CSS class on current list element and all nested
		 * list elements that are contained in the selection
		 * @param {string} listType The type of list to apply
		 * @param {ListTemplate=} template The selected template (if any)
		 * @param {number=} templateId The id of the template which should be saved
		 * @return void
		 */
		setListStyle: function (listType, template, templateId) {
			var domObject = ListPlugin.getStartingDomObjectToTransform();
			var nodeName = domObject.nodeName.toLowerCase();
			var listToStyle = $(domObject);
			
			if (!LIST_TYPES.includes(nodeName)) {
				// we don't have a list yet, so transform selection to list
				ListPlugin.transformList(listType);
				domObject = ListPlugin.getStartingDomObjectToTransform();
				$(domObject).attr(ATTR_DATA_LIST_TEMPLATE, templateId);
				nodeName = domObject.nodeName.toLowerCase();
				listToStyle = $(ListPlugin.getStartingDomObjectToTransform());
			}

			listToStyle.attr(ATTR_DATA_LIST_TEMPLATE, templateId);
			if (listType !== nodeName) {
				return;
			}

			var allTemplateClasses = ListPlugin.getTemplateClases(listType);

			// Remove all template-classes first
			listToStyle.removeClass(allTemplateClasses);

			if (template) {
				ListPlugin.applyNestingClass(listToStyle, template.classes);
			}

			// now proceed with all selected sublists
			listToStyle.find(listType).each(function () {
				if (isListInSelection(this)) {
					var subList = $(this);
					subList.removeClass(allTemplateClasses);

					if (template) {
						ListPlugin.applyNestingClass(subList, template.classes);
					}
				}
			});
		},

		/**
		 * Create the select menu entries for the available list styles.
		 * @param type The list type.
		 * @param elementId The ID of the button element.
		 */
		showListDropdown: function (type, elementId) {
			/**
			 * Copy of the templates, as we later need them again and just in case they change
			 * inbetween the dropdown open, we have the correct values.
			 * @type {Array.<ListTemplate>}
			 */
			var templates = (ListPlugin.templates[type] || []).slice(0);
			var options = templates.map(function (tpl, idx) {
				return {
					id: idx,
					label: tpl.label,
				};
			});

			// If there's no options available, don't show a dropdown at all (and remove potential template classes)
			if (options.length === 0) {
				ListPlugin.setListStyle(type);
				return;
			}

			// Add an option to unselect the current template
			options.unshift({
				id: NONE_OPTION_ID,
				label: i18n.t('template.none.label'),
			});

			Dropdown.openDynamicDropdown(elementId, {
				type: 'select-menu',
				options: /** @type {SelectMenuOptions} */ ({
					iconsOnly: false,
					options: options,
				}),
			}).then(function (ref) {
				return /** @type {Promise.<SelectMenuResult.<*>>} */ (ref.value);
			}).then(function (selection) {
				var tpl = null;
				var tplId = null;

				if (selection && selection.id !== NONE_OPTION_ID) {
					tpl = templates[selection.id];
					tplId = selection.id;
				}

				ListPlugin.setListStyle(type, tpl, tplId);
			}).catch(function (error) {
				if (!Utils.isUserCloseError(error)) {
					console.log(error);
				}
			});
		},

		getPluginContentHandler: function () {
			var handlers = {};

			var listHandler = function ($elem, options, editable) {
				// check which list-types are allowed in this editable
				// if the list type is not allowed we have to remove the
				// element by unwrapping its contents
				var config = configurations[editable.getId()],
					listType = getListTypeFromElement($elem);
				if (!listType || (config && !config[listType])) {
					$elem.contents().unwrap();
					return false;
				}
				ContentHandlerUtils.removeAttributes($elem, ['class']);
				/** @type {Array.<string>} */
				var classList = Array.from($elem[0].classList);
				/** @type {Array.<ListTemplate>} */
				var templates = ListPlugin.templates[listType] || [];
				var templateClasses = templates.flatMap(function(tpl) {
					return tpl.classes;
				});

				classList.forEach(function(className) {
					if (!templateClasses.includes(className)) {
						$elem.removeClass(className);
					}
				});

				// add default classes
				var nestingLevel = calculateNestingLevel($elem, editable.obj);
				$elem.addClass(ListPlugin.getDefaultListClass(listType, nestingLevel));

				// add template classes
				var $rootList = getRootList($elem, editable.obj);
				var selectedTemplate = $rootList.attr(ATTR_DATA_LIST_TEMPLATE);
				if (selectedTemplate) {
					selectedTemplate = parseInt(selectedTemplate, 10);
					if (selectedTemplate) {
						ListPlugin.applyNestingClass($elem, templates[selectedTemplate], nestingLevel);
					}
				}

				// cleanup empty class attributes
				if (!$elem.attr('class')) {
					$elem.removeAttr('class');
				}
				// return false to not apply other handlers and skip the generic cleanup on this element
				return false;
			};

			var itemHandler = function ($elem, $options, editable) {
				// if li,dt,dd elements are not properly nested
				// we have to unwrap their contents
				var $parent = $elem.parent(),
					listType = getListTypeFromElement($parent);

				if (!listType || !$elem.is(VALID_ITEMS[listType].join(','))) {
					$elem.contents().unwrap();
					return false;
				}
				ContentHandlerUtils.removeAttributes($elem);
				$elem.addClass(ListPlugin.getDefaultItemClass(listType, calculateNestingLevel($parent, editable.obj)));
				// return false to not apply other handlers and skip the generic cleanup on this element
				return false;
			};

			handlers[LIST_TYPES.join(',')] = listHandler;
			handlers[ITEM_TYPES.join(',')] = itemHandler;

			return handlers;
		},

		/**
		 * The defaultClasses may be specified as a string or an array of strings. This method takes the user-defined
		 * config and normalizes it to always be an array of strings.
		 *
		 * @param {Object.<string, ListSettings>} defaultClasses
		 * @return {Object.<string, ListSettings>}
		 */
		normalizeDefaultClasses: function(defaultClasses) {
			if (!defaultClasses) {
				return;
			}
			var normalized = {};

			Object.entries(defaultClasses).forEach(function(entry) {
				var settings = entry[1] || {};

				normalized[entry[0]] = {
					list: normalizeToArray(settings.list),
					item: normalizeToArray(settings.item)
				};
			});

			return normalized;
		},

		/**
		 * Process Tab and Shift-Tab pressed in lists
		 * @param {KeyboardEvent} event
		 */
		processTab: function (event) {
			if (event.keyCode === 9/*tab*/ ) {
				if (event.shiftKey) {
					return ListPlugin.outdentList();
				} else {
					return ListPlugin.indentList();
				}
			}
			return true;
		},

		/**
		 * If the backspace key is pressed while at position 0 of a list item, the list will be transformed into a paragraph.
		 * This transformation does not occur within this plugin, so the usual methods (transformList() etc) are not called.
		 *
		 * This method is used to ensure that default classes are correctly removed when a list is transformed into a paragraph
		 * by a press of the backspace key.
		 *
		 * @param {KeyboardEvent} event
		 * @return {boolean}
		 */
		processBackspace: function(event) {
			if (event.keyCode !== 8) {
				return true;
			}
			
			var list = ListPlugin.getNearestSelectedListItem();

			if (list
				// If no default classes have been configured, we can skip this.
				&& ListPlugin.defaultClasses[list.nodeName] != null
				&& (
					(ListPlugin.defaultClasses[list.nodeName].list || []).length > 0
					|| (ListPlugin.defaultClasses[list.nodeName].item || []).length > 0
				)
			) {
				setTimeout(function() {
					// setTimeout is needed because the processBackspace() method is executed prior to the DOM
					// changes taking place. This deferred code will therefore execute after the DOM updates
					// and the selection can be assumed to be in the correct place.
					var newParentElement = Aloha.Selection.rangeObject.startContainer.parentNode;
					var closestList$ = $(newParentElement).closest(LIST_TYPES.join(','));
					if (closestList$.get(0)) {
						ListPlugin.applyDefaultClassesToList(closestList$)
					} else {
						ListPlugin.removeAllDefaultClasses(newParentElement);
					}
				});
			}
			return true;
		},

		/**
		 * If the enter key is pressed while at the last position of the last item of a list, the list item
		 * will be either outdented to its parent list or transformed into a paragraph. This transformation does
		 * not occur within this plugin, so the usual methods (transformList() etc) are not called.
		 *
		 * This method is used to ensure that default classes are correctly removed when a list is transformed
		 * by a press of the enter key.
		 *
		 * @param {KeyboardEvent} event
		 * @return {boolean}
		 */
		processEnter: function(event) {
			if (event.keyCode !== 13) {
				return true;
			}
			var list = ListPlugin.getNearestSelectedListItem();

			if (!list
				// If no default classes have been configured, we can skip this.
				|| !ListPlugin.defaultClasses[list.nodeName] != null
				|| !(
					(ListPlugin.defaultClasses[list.nodeName].list || []).length > 0
					|| (ListPlugin.defaultClasses[list.nodeName].item || []).length > 0
				)
			) {
				return true;
			}

			var nestingLevel = ListPlugin.getListNestingLevel(list);

			setTimeout(function () {
				if (nestingLevel === 0) {
					// The list has been transformed into a paragraph.
					// Unfortunately in this case we cannot rely on the Aloha.Selection.rangeObject -
					// it will still be set at the <li> element which has just been removed from
					// the DOM, so we need to just remove all defaultClasses from non-list elements
					// in the editable.
					var editable$ = Aloha.activeEditable && Aloha.activeEditable.originalObj;
					if (editable$) {
						editable$.children().each(function (index, childElement) {
							if (!Dom.isListElement(childElement)) {
								ListPlugin.removeAllDefaultClasses(childElement);
							}
						});
					}
				} else {
					var closestList$ = $(Aloha.Selection.rangeObject.startContainer).closest(LIST_TYPES.join(','));
					if (0 < closestList$.length) {
						ListPlugin.applyDefaultClassesToList(closestList$);
					}
				}
			});

			return true;
		},

		/**
		 * For the current selection, get the DOM object, which will be transformed to/from the list
		 * @return dom object or false
		 */
		getStartingDomObjectToTransform: function () {
			Aloha.Selection.checkForFirefoxIncorrectRange();
			var rangeObject = Aloha.Selection.rangeObject,
				i, effectiveMarkup;

			for ( i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (ListPlugin.transformableElements[effectiveMarkup.nodeName.toLowerCase()]) {
					return effectiveMarkup;
				}
			}

			return false;
		},

		/**
		 * For the current selection, get the nearest list item as dom object
		 * @return {HTMLElement} object or false
		 */
		getNearestSelectedListItem: function () {
			var rangeObject = Aloha.Selection.rangeObject,
				i, effectiveMarkup;

			for ( i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (Dom.isListElement(effectiveMarkup)) {
					return effectiveMarkup;
				}
			}

			return false;
		},

		/**
		* Transforms a list into paragraphs
		* @param Dom domToTransform element to transform
		* @param String listElement the list element to transform (li, dt, dd)
		*/
		transformListToParagraph: function (domToTransform, listElement) {
			var newPara;
			var jqToTransform = $(domToTransform);

			jqToTransform.children(listElement).each(function (index, el) {
				newPara = Aloha.Markup.transformDomObject(el, 'p', Aloha.Selection.rangeObject);
				// if any lists are in the paragraph, move the to after the paragraph
				newPara.after(newPara.children(LIST_TYPES.join(',')));
				ListPlugin.removeAllDefaultClasses(newPara);
				Engine.ensureContainerEditable(newPara.get(0));
			});

			// unwrap the elements (remove the enclosing list)
			jqToTransform.children().unwrap();

			Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
		},

		/**
		* When the list is nested into another, our list items will be
		* added to the list items of the outer list.
		* @param {JQuery} jqParentList Parent List Dom element
		* @param {JQuery} jqList List Dom Element
		*/
		fixupNestedLists: function (jqParentList, jqList) {
			// find the place where to put the children of the inner list
			if (jqParentList.get(0).nodeName.toLowerCase() === 'li') {
				// transform the list elements to be li (could by dt and dd)
				$.each(jqList.children(), function (index, el) {
					Aloha.Markup.transformDomObject(el, 'li', Aloha.Selection.rangeObject);
				});
				// inner list is nested in a li (this conforms to the html5 spec)
				jqParentList.after(jqList.children());
				ListPlugin.applyDefaultClassesToList(jqParentList.parent());
				jqList.remove();
			} else {
				// inner list is nested in the outer list directly (this violates the html5 spec)
				jqList.children().unwrap();
			}
		},

		/**
		* Creates a list out of allowed elements
		* @param String listtype type of list we want to create (ul, ol, dl)
		* @param Dom domToTransform DOM object to transform
		*/
		createList: function (listtype, domToTransform) {
			var selectedSiblings = Aloha.Selection.rangeObject.getSelectedSiblings(domToTransform);
			var jqList;
			var jqNewEl;
			var lastAppendedEl;
			var el;

			// create a new list
			switch (listtype) {
				case 'ol':
					jqList = $('<ol></ol>');
					jqNewEl = $('<li></li>');
					break;
				case 'ul':
					jqList = $('<ul></ul>');
					jqNewEl = $('<li></li>');
					break;
				case 'dl':
					jqList = $('<dl></dl>');
					jqNewEl = $('<dt></dt>');
					break;
			}

			// add the li into the list
			jqList.append(jqNewEl);
			// append the contents of the old dom element to the li
			$(domToTransform).contents().appendTo(jqNewEl);
			// replace the old dom element with the new list
			$(domToTransform).replaceWith(jqList);

			// update the selection range
			if (Aloha.Selection.rangeObject.startContainer == domToTransform) {
				Aloha.Selection.rangeObject.startContainer = jqNewEl.get(0);
			}
			if (Aloha.Selection.rangeObject.endContainer == domToTransform) {
				Aloha.Selection.rangeObject.endContainer = jqNewEl.get(0);
			}

			lastAppendedEl = jqNewEl;

			// now also transform all siblings
			if (selectedSiblings) {
				var o = true;
				var lastEl = false;
				for (var i = 0; i < selectedSiblings.length; ++i) {
					if (Dom.isBlockLevelElement(selectedSiblings[i])) {
						if (lastEl) {
							lastEl = false;
						}
						// transform the block level element
						if (listtype === 'dl') {
							if (!o) {
								jqNewEl = Aloha.Markup.transformDomObject(selectedSiblings[i], 'dt', Aloha.Selection.rangeObject);
							} else {
								jqNewEl = Aloha.Markup.transformDomObject(selectedSiblings[i], 'dd', Aloha.Selection.rangeObject);
							}
							o = !o;
						} else {
							jqNewEl = Aloha.Markup.transformDomObject(selectedSiblings[i], 'li', Aloha.Selection.rangeObject);
						}
						jqList.append(jqNewEl);
						lastAppendedEl = jqNewEl;
					} else {
						if (
							selectedSiblings[i].nodeType === Node.TEXT_NODE
							&& (selectedSiblings[i].data || '').trim().length === 0
						) {
							continue;
						}
						if (!lastEl) {
							lastEl = jqNewEl;
							jqList.append(lastEl);
							lastAppendedEl = lastEl;
						}
						lastEl.append(selectedSiblings[i]);
					}
				}
			}

			// merge adjacent lists
			var mergedList = ListPlugin.mergeAdjacentLists(jqList);

			ListPlugin.applyDefaultClassesToList(mergedList);

			var $list = $(jqList);
			ListPlugin.applyDefaultClassesToList($list);

			//use rangy to change the selection to the contents of
			//the last li that was appended to the list
			el = lastAppendedEl.get(0);
			if (Dom.isEmpty(el)) {
				var range = Aloha.createRange();
				var selection = Aloha.getSelection();
				//IE7 requires an (empty or non-empty) text node
				//inside the li for the selection to work.
				el.appendChild(document.createTextNode(""));
				range.selectNodeContents( el.lastChild );
				selection.removeAllRanges();
				selection.addRange( range );
				Aloha.Selection.updateSelection();
			}

			Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
		},

		/**
		* Set up a new empty list
		* @param {ListType} listType type of list we want to create (ul, ol, dl)
		* @return Dom domToTransform DOM object to transform
		*/
		prepareNewList: function (listType) {
			var jqList;
			var jqNewEl;
			var el;
			var editable;
			var range;
			var selection;
			Aloha.Selection.updateSelection();

			// wrap a paragraph around the selection
			Aloha.Selection.changeMarkupOnSelection($('<p></p>'));
			var domToTransform = ListPlugin.getStartingDomObjectToTransform();

			if (!domToTransform) {
				return domToTransform;
			}

			if (!$(Aloha.Selection.rangeObject.startContainer).contentEditable()) {
				Aloha.Log.error(ListPlugin, 'Could not transform selection into a list');
				return domToTransform;
			}

			// create a new list with an empty item
			switch (listType) {
				case 'ol':
					jqList = $('<ol></ol>');
					jqNewEl = $('<li></li>');
					break;
				case 'ul':
					jqList = $('<ul></ul>');
					jqNewEl = $('<li></li>');
					break;
				case 'dl':
					jqList = $('<dl></dl>');
					jqNewEl = $('<dt></dt>');
					break;
			}

			jqList.append(jqNewEl);
			el = jqNewEl.get(0);
			el.appendChild(document.createTextNode(""));

			if (!Dom.insertIntoDOM(jqList, Aloha.Selection.rangeObject)) {
				Aloha.Log.error(ListPlugin, 'Could not transform selection into a list');
				return domToTransform;
			}

			range = Aloha.createRange();
			selection = Aloha.getSelection();
			range.setStart( el.firstChild, 0 );
			range.setEnd( el.firstChild, 0 );
			selection.removeAllRanges();
			selection.addRange( range );
			Aloha.Selection.updateSelection();
			domToTransform = jqList.get(0);

			return domToTransform;
		},

		/**
		 * Transform the current selection to/from a list
		 * @param {ListType} listType type of list we want to transform to (ul, ol, dl)
		 */
		transformList: function (listType) {
			var domToTransform = ListPlugin.getStartingDomObjectToTransform();
			var jqList = $(domToTransform);
			var jqParentList;
			var	nodeName;

			// visible is set to true, but the button is not visible
			ListPlugin._outdentListButton.show(true);
			ListPlugin._indentListButton.show(true);

			if (!domToTransform || !domToTransform.parentNode) {
				domToTransform = ListPlugin.prepareNewList(listType);
				ListPlugin.refreshSelection();

				if (domToTransform && domToTransform.nodeName.toLowerCase() === listType) {
					return;
				}
			}

			// check the dom object
			nodeName = domToTransform.nodeName.toLowerCase();

			//remove all classes on list type change
			if (nodeName !== listType && ListPlugin.templates[nodeName]) {
				/** @type {Array.<ListTemplate>} */
				var templates = Object.values(ListPlugin.templates).flatMap(function(group) {
					return group;
				});
				var templateClasses = templates.flatMap(function(template) {
					return template.classes;
				})
				jqList.removeClass(templateClasses);
			}

			// remove default classes
			ListPlugin.removeAllDefaultClasses(jqList);
			jqList.children().each(function (index, item) {
				ListPlugin.removeAllDefaultClasses(item);
			});

			if (nodeName === listType) {
				jqParentList = jqList.parent();
				if (jqParentList.length > 0 && Dom.isListElement(jqParentList.get(0))) {
					// we are in a nested list
					ListPlugin.fixupNestedLists(jqParentList, jqList);
				} else {
					// we are in an list and shall transform it to paragraphs
					if (listType === 'dl') {
						ListPlugin.transformListToParagraph(domToTransform, 'dd, dt');
					} else {
						ListPlugin.transformListToParagraph(domToTransform, 'li');
					}
				}

			} else if (nodeName === 'ul' && listType === 'ol') {
				transformExistingListAndSubLists(domToTransform, 'ol');
				ListPlugin.mergeAdjacentLists($(domToTransform));
			} else if (nodeName === 'ol' && listType === 'ul') {
				transformExistingListAndSubLists(domToTransform, 'ul');
				ListPlugin.mergeAdjacentLists($(domToTransform));
			} else if (nodeName === 'ul' && listType === 'dl') {
				ListPlugin.transformListToParagraph(domToTransform, 'li');
				domToTransform = ListPlugin.prepareNewList(listType);
				ListPlugin.createList(listType, domToTransform);
			} else if (nodeName === 'ol' && listType === 'dl') {
				ListPlugin.transformListToParagraph(domToTransform, 'li');
				domToTransform = ListPlugin.prepareNewList(listType);
				ListPlugin.createList(listType, domToTransform);
			} else if (nodeName === 'dl' && listType === 'ol' ) {
				ListPlugin.transformListToParagraph(domToTransform, 'dd, dt');
				domToTransform = ListPlugin.prepareNewList(listType);
				ListPlugin.createList(listType, domToTransform);
			} else if (nodeName === 'dl' && listType === 'ul' ) {
				ListPlugin.transformListToParagraph(domToTransform, 'dd, dt');
				domToTransform = ListPlugin.prepareNewList(listType);
				ListPlugin.createList(listType, domToTransform);
			} else {
				ListPlugin.createList(listType, domToTransform);
			}

			ListPlugin.refreshSelection();
		},


		/**
		 * Indent the selected list items by moving them into a new created, nested list
		 */
		indentList: function () {
			var listItem = ListPlugin.getNearestSelectedListItem(),
				i, jqNewList, selectedSiblings, jqOldList, jqItemBefore;

			if (!listItem) {
				return true;
			}

			jqItemBefore = $(listItem).prev('li');

			// when we are in the first li of a list, there is no indenting
			if (jqItemBefore.length === 0) {
				// but we handled the TAB keystroke
				return false;
			}
			jqOldList = $(listItem).parent();

			// get the also selected siblings of the dom object
			selectedSiblings = Aloha.Selection.rangeObject.getSelectedSiblings(listItem);

			// create the new list element by cloning the selected list element's parent
			jqNewList = $(listItem)
				.parent()
				.clone(false)
				.removeAttr('class')
				.removeAttr(ATTR_DATA_LIST_TEMPLATE)
				.empty();
			jqNewList.append(listItem);

			// we found a list item before the first selected one, so append the new list to it
			jqItemBefore.append(jqNewList);

			// check for multiple selected items
			if (selectedSiblings) {
				for ( i = 0; i < selectedSiblings.length; ++i) {
					jqNewList.append($(selectedSiblings[i]));
				}
			}

			// merge adjacent lists
			var mergedList = ListPlugin.mergeAdjacentLists(jqNewList, true);

			ListPlugin.applyDefaultClassesToList(mergedList);

			// refresh the selection
			ListPlugin.refreshSelection();

			Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
			return false;
		},

		/**
		 * Outdent nested list items by moving them into the outer list
		 */
		outdentList: function () {
			var
				listItem = ListPlugin.getNearestSelectedListItem(),
				i, jqNewPostList,
				jqListItem, jqList, jqParentList, wrappingLi,
				selectedSiblings, lastSelected;

			if (!listItem) {
				return true;
			}

			// check whether the list is nested into another list
			jqListItem = $(listItem);
			jqList = jqListItem.parent();

			// get the parent list
			jqParentList = jqList.parents('ul,ol');

			// check whether the inner list is directly inserted into a li element
			wrappingLi = jqList.parent('li');

			if (jqParentList.length === 0 || !Dom.isListElement(jqParentList.get(0))) {
				Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
				return false;
			}

			// the list is nested into another list

			// get the also selected siblings of the dom object
			selectedSiblings = Aloha.Selection.rangeObject.getSelectedSiblings(listItem);

			// check for multiple selected items
			if (selectedSiblings && selectedSiblings.length > 0) {
				lastSelected = $(selectedSiblings[selectedSiblings.length - 1]);
			} else {
				lastSelected = jqListItem;
			}

			// check whether we found not selected li's after the selection
			if (lastSelected.nextAll('li').length > 0) {
				jqNewPostList = jqList.clone(false).empty();
				jqNewPostList.append(lastSelected.nextAll());
				lastSelected.append(jqNewPostList);
			}

			// now move all selected li's into the higher list
			if (wrappingLi.length > 0) {
				wrappingLi.after(jqListItem);
			} else {
				jqList.before(jqListItem);
			}

			// check for multiple selected items
			if (selectedSiblings && selectedSiblings.length > 0) {
				for ( i = selectedSiblings.length - 1; i >= 0; --i) {
					jqListItem.after($(selectedSiblings[i]));
				}
			}

			// finally check whether there are elements left in the list
			if (jqList.contents('li').length === 0) {
				// list is completely empty, so remove it
				jqList.remove();
			}

			// check whether the wrapping li is empty now
			if (wrappingLi.length > 0 && wrappingLi.contents().length === 0) {
				wrappingLi.remove();
			}

			// refresh the selection
			ListPlugin.refreshSelection();

			ListPlugin.applyDefaultClassesToList(jqParentList);

			Aloha.activeEditable.smartContentChange({type: 'block-change', plugin: 'list-plugin'});
			return false;
		},

		/**
		 * Refresh the current selection and set to focus to the current editable again
		 */
		refreshSelection: function () {
			Aloha.Selection.rangeObject.update();
			Aloha.Selection.rangeObject.select();
			Aloha.Selection.updateSelection();
		},

		/**
		 * Merge adjacent lists (of same type) into the first list
		 * @param jqList $ object of a list
		 * @param allTypes true if all types of lists may be merged, false if only same types may be merged
		 * @return {HTMLUListElement|HTMLOListElement}
		 */
		mergeAdjacentLists: function (jqList, allTypes) {
			// first get the first previous sibling of same type
			var firstList = jqList.get(0), jqNextList;

			while (
				firstList.previousSibling
				&& firstList.previousSibling.nodeType === Node.ELEMENT_NODE
				&& ListPlugin.isMergable(firstList.previousSibling, firstList, allTypes)
			) {
				firstList = firstList.previousSibling;
			}

			jqList = $(firstList);
			// now merge all adjacent lists into this one
			while (
				firstList.nextSibling
				&& (
					(
						firstList.nextSibling.nodeType === Node.ELEMENT_NODE
						&& ListPlugin.isMergable(firstList.nextSibling, firstList, allTypes)
					) || (
						firstList.nextSibling.nodeType === Node.TEXT_NODE
						&& (firstList.nextSibling.data || '').trim().length === 0
					)
				)
			) {
				jqNextList = $(firstList.nextSibling);
				if (firstList.nextSibling.nodeType == Node.ELEMENT_NODE) {
					jqNextList.contents().appendTo(jqList);
				}
				jqNextList.remove();
			}
			return firstList;
		},

		/**
		 * Check whether the given DOM element toCheck is mergeable into the DOM element mergeInto
		 * @param toCheck DOM element to check
		 * @param mergeInto DOM element into which toCheck shall be merged
		 * @param allTypes true if all types of lists may be merged, false if only same types may be merged
		 */
		isMergable: function (toCheck, mergeInto, allTypes) {
			if (allTypes) {
				return toCheck.nodeName.toLowerCase() == 'ul' || toCheck.nodeName.toLowerCase() == 'ol';
			} else {
				return toCheck.nodeName == mergeInto.nodeName;
			}
		},

		/**
		 * Adds the correct defaultClasses (as defined in the Aloha config) to the given list element and its
		 * LI children, recursively for all nested lists below the starting list.
		 *
		 * @param {HTMLUListElement|HTMLOListElement|HTMLDListElement|JQuery} list
		 */
		applyDefaultClassesToList: function(list) {
			function recur(list, nestingLevel) {
				var $list = $(list).first();
				var elNodeName = $list.get(0).nodeName;
				var listType = elNodeName.toLowerCase();

				ListPlugin.removeAllDefaultClasses($list);

				var classToAdd = ListPlugin.getDefaultListClass(listType, nestingLevel);
				$list.addClass(classToAdd);

				$list.children().each(function (index, item) {
					var $item = $(item);
					ListPlugin.removeAllDefaultClasses(item);
					$item.addClass(ListPlugin.getDefaultItemClass(listType, nestingLevel));

					$item.children(LIST_TYPES.join(',')).each(function (index, childList) {
						recur(childList, nestingLevel + 1);
					});
				});
			}

			var nestingLevel = ListPlugin.getListNestingLevel(list);
			recur(list, nestingLevel);
		},

		/**
		 * Returns a 0-indexed nesting level for the given list or list item. A nesting of 0 === a top-level list in
		 * this editable.
		 *
		 * @param {HTMLOListElement|HTMLUListElement|HTMLLIElement} listEl
		 * @return {number}
		 */
		getListNestingLevel: function (listEl) {
			// wrap with $ to normalize HTMLElements and $ objects
			var $element = $(listEl);
			var elNodeName = $element.get(0).nodeName;
			var $list = ITEM_TYPES.includes(elNodeName.toLowerCase()) ? $element.parent() : $element;
			var nestingLevel = 0;
			var maxSteps = 50; // set a maximum to prevent infinite loops
			var steps = 0;
			var parent = $list.get(0);
			var editable = $list.closest('.aloha-editable').get(0);

			while (parent && editable && parent !== editable && steps < maxSteps) {
				parent = parent.parentElement;
				if (LIST_TYPES.includes(parent.nodeName.toLowerCase())) {
					nestingLevel++;
				}
				if (parent === editable) {
					return nestingLevel;
				}
				steps++;
			}
			return nestingLevel;
		},

		/**
		 * Returns the default class for a list of a given nesting level.
		 *
		 * @param {ListType} listType
		 * @param {number} nestingLevel
		 * @return {?string}
		 */
		getDefaultListClass: function (listType, nestingLevel) {
			/** @type {Array.<string>} */
			var listClasses = ListPlugin.getDefaultClasses(listType).list || [];
			if (listClasses.length === 0) {
				return null;
			}

			var index = Math.min(listClasses.length - 1, nestingLevel);
			return listClasses[index];
		},

		/**
		 * Returns the default class for a list item of a given nesting level.
		 *
		 * @param {ListType} listType
		 * @param {number} nestingLevel
		 * @return {?string}
		 */
		getDefaultItemClass: function (listType, nestingLevel) {
			var listClasses = ListPlugin.getDefaultClasses(listType).item || [];
			if (listClasses.length === 0) {
				return null;
			}

			var index = Math.min(listClasses.length - 1, nestingLevel);
			return listClasses[index];
		},

		/**
		 * Removes all defaultClasses associated with list items.
		 *
		 * @param {HTMLElement} element 
		 */
		removeAllDefaultClasses: function (element) {
			var $element = $(element);
			/** @type {LisType} */
			var listType;
			/** @type {ListSettings} */
			var settings;
			/** @type {Array.<string>=} */
			var classNames;

			if ($element.is(LIST_TYPES.join(','))) {
				listType = $element.get(0).nodeName.toLowerCase();
				settings = ListPlugin.defaultClasses[listType] || {};
				classNames = settings.list || [];
			} else if ($element.is(ITEM_TYPES.join(','))) {
				listType = $element.get(0).parentNode.nodeName.toLowerCase();
				settings = ListPlugin.defaultClasses[listType] || {};
				classNames = settings.item || [];
			} else {
				// If an element is transformed into a list, then we have to aggregate *all* classes, regardless of context
				classNames = Object.values(ListPlugin.defaultClasses).flatMap(/** @param {ListSettings} settings */ function(settings) {
					settings = settings || {};
					return (settings.item || []).concat(settings.list || []);
				});
			}

			$element.removeClass(classNames);
		},

		/**
		 * Returns the default list an item classes for a given list type
		 *
		 * @param {ListType} listType
		 * @return {ListSettings}
		 */
		getDefaultClasses: function (listType) {
			listType = listType.toLowerCase();
			if (!LIST_TYPES.includes(listType)) {
				throw new Error('Invalid listType: ' + listType.toString());
			}

			return ListPlugin.defaultClasses[listType] || { list: [], item: [] };
		}
	}));

	Engine.commands['insertdefinitionlist'] = {
		action: function (value, range) {
			ListPlugin.transformList('dl');
			if (range && Aloha.Selection.rangeObject) {
				range.startContainer = Aloha.Selection.rangeObject.startContainer;
				range.startOffset = Aloha.Selection.rangeObject.startOffset;
				range.endContainer = Aloha.Selection.rangeObject.endContainer;
				range.endOffset = Aloha.Selection.rangeObject.endOffset;
			}
		},
		indeterm: function () {
			// TODO
		},
		state: function () {
			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ul></ul>'))) {
					return false;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ol></ol>'))) {
					return false;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<dl></dl>'))) {
					return true;
				}
			}

			return false;
		}
	};

	Engine.commands['insertorderedlist'] = {
		action: function (value, range) {
			ListPlugin.transformList('ol');
			if (range && Aloha.Selection.rangeObject) {
				range.startContainer = Aloha.Selection.rangeObject.startContainer;
				range.startOffset = Aloha.Selection.rangeObject.startOffset;
				range.endContainer = Aloha.Selection.rangeObject.endContainer;
				range.endOffset = Aloha.Selection.rangeObject.endOffset;
			}
		},
		indeterm: function () {
			// TODO
		},
		state: function () {
			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ul></ul>'))) {
					return false;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ol></ol>'))) {
					return true;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<dl></dl>'))) {
					return false;
				}
			}

			return false;
		}
	};

	Engine.commands['insertunorderedlist'] = {
		action: function (value, range) {
			ListPlugin.transformList('ul');
			if (range && Aloha.Selection.rangeObject) {
				range.startContainer = Aloha.Selection.rangeObject.startContainer;
				range.startOffset = Aloha.Selection.rangeObject.startOffset;
				range.endContainer = Aloha.Selection.rangeObject.endContainer;
				range.endOffset = Aloha.Selection.rangeObject.endOffset;
			}
		},
		indeterm: function () {
			// TODO
		},
		state: function () {
			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ul></ul>'))) {
					return true;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<ol></ol>'))) {
					return false;
				}
				if (Aloha.Selection.standardTagNameComparator(effectiveMarkup, $('<dl></dl>'))) {
					return false;
				}
			}

			return false;
		}
	};

	Engine.commands['indent'] = {
		action: function (value, range) {
			ListPlugin.indentList();
			if (range && Aloha.Selection.rangeObject) {
				range.startContainer = Aloha.Selection.rangeObject.startContainer;
				range.startOffset = Aloha.Selection.rangeObject.startOffset;
				range.endContainer = Aloha.Selection.rangeObject.endContainer;
				range.endOffset = Aloha.Selection.rangeObject.endOffset;
			}
		},
		indeterm: function () {
			// TODO
		},
		state: function () {
			// TODO
			return false;
		}
	};

	Engine.commands['outdent'] = {
		action: function (value, range) {
			ListPlugin.outdentList();
			if (range && Aloha.Selection.rangeObject) {
				range.startContainer = Aloha.Selection.rangeObject.startContainer;
				range.startOffset = Aloha.Selection.rangeObject.startOffset;
				range.endContainer = Aloha.Selection.rangeObject.endContainer;
				range.endOffset = Aloha.Selection.rangeObject.endOffset;
			}
		},
		indeterm: function () {
			// TODO
		},
		state: function () {
			// TODO
			return false;
		}
	};

	return ListPlugin;
});
