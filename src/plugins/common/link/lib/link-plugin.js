/* link-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */

/**
 * @typedef {import('../../ui/lib/select.js').SelectOption} SelectOption
 */


/* Aloha Link Plugin
 * -----------------
 * This plugin provides an interface to allow the user to insert, edit and
 * remove links within an active editable.
 * Clicking on any links inside the editable activates the this plugin's
 * floating menu scope.
 */
define([
	'jquery',
	'PubSub',
	'aloha',
	'aloha/plugin',
	'aloha/ephemera',
	'aloha/content-rules',
	'util/dom',
	'util/keys',
	'ui/ui',
	'ui/scopes',
	'ui/toggleSplitButton',
	'ui/icons',
	'ui/dynamicForm',
	'ui/utils',
	'ui/modal',
	'link/link-target',
	'i18n!link/nls/i18n'
], function (
	/** @type {JQueryStatic} */
	$,
	PubSub,
	Aloha,
	Plugin,
	Ephemera,
	ContentRules,
	Dom,
	Keys,
	Ui,
	Scopes,
	ToggleSplitButton,
	Icons,
	DynamicForm,
	Utils,
	Modal,
	LinkTarget,
	i18n
) {
	'use strict';

	var configurations = {};
	var pluginNamespace = 'aloha-link';

	var ATTR_HREF = 'href';
	var ATTR_TARGET = 'target';
	var ATTR_HREF_LANG = 'hreflang';
	var ATTR_TITLE = 'title';

	var CLASS_NEW_LINK = 'aloha-new-link';
	var CLASS_LINK = 'aloha-link-text';
	var CLASS_LINK_POINTER = 'aloha-link-pointer';

	/** @type {Array.<SelectOption>} */
	var TARGETS = [
		{
			id: '_self',
			label: i18n.t('link.target._self'),
		},
		{
			id: '_blank',
			label: i18n.t('link.target._blank'),
		},
		{
			id: '_parent',
			label: i18n.t('link.target._parent'),
		},
		{
			id: '_top',
			label: i18n.t('link.target._top'),
		},
		{
			id: '_unfencedTop',
			label: i18n.t('link.target._unfencedTop'),
		}
	];

	/**
	 * Properties for cleaning up markup immediately after inserting new link
	 * markup.
	 *
	 * Successive anchor elements are generally not merged, but an exception
	 * needs to be made in the process of creating links: adjacent fragments of
	 * new links are coalesced whenever possible.
	 *
	 * @type {object}
	 */
	var insertLinkPostCleanup = {
		merge: true,
		mergeable: function (node) {
			return (CLASS_NEW_LINK === node.className && node.nextSibling &&
				CLASS_NEW_LINK === node.nextSibling.className);
		}
	};

	Ephemera.classes(CLASS_LINK_POINTER, CLASS_LINK);

	function setupMousePointerFix() {
		$(document).on('keydown.aloha-link.pointer-fix', function (e) {
			// metaKey for OSX, 17 for PC (we can't check
			// e.ctrlKey because it's only set on keyup or
			// keypress, not on keydown).
			if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
				$('body').addClass(CLASS_LINK_POINTER);
			}
		})
			.on('keyup.aloha-link.pointer-fix', function (e) {
				if (e.metaKey || Keys.getToken(e.keyCode) === 'control') {
					$('body').removeClass(CLASS_LINK_POINTER);
				}
			});
	}

	function teardownMousePointerFix() {
		$(document).unbind('.aloha-link.pointer-fix');
	}

	function setupMetaClickLink(editable) {
		editable.obj.on('click.aloha-link.meta-click-link', 'a', function (e) {
			// Use metaKey for OSX and ctrlKey for PC
			if (e.metaKey || e.ctrlKey) {
				// blur current editable. user is waiting for the link to load
				Aloha.activeEditable.blur();
				// hack to guarantee a browser history entry
				window.setTimeout(function () {
					location.href = e.target;
				}, 0);
				e.stopPropagation();
				return false;
			}
		});
	}

	function teardownMetaClickLink(editable) {
		editable.obj.unbind('.aloha-link.meta-click-link');
	}

	function createLinkTargetFromConfig(
		config,
		name,
		applyChanges,
		validateFn,
		onChangeFn,
		onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, LinkTarget, {
			value: tmpOptions.value,
			targetLabel: tmpOptions.targetLabel,
			anchorLabel: tmpOptions.anchorLabel,

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

	var plugin = Plugin.create('link', {
		/**
		 * Default configuration allows links everywhere
		 */
		config: ['a'],

		/**
		 * the defined object types to be used for this instance
		 */
		objectTypeFilter: [],

		/**
		 * handle change on href change
		 * called function ( obj, href, item );
		 */
		onHrefChange: null,

		/**
		 * HotKeys used for special actions
		 */
		hotKey: {
			insertLink: i18n.t('insertLink', 'ctrl+k')
		},

		/**
		 * Default input value for a new link
		 */
		hrefValue: 'https://',

		/**
		 * Shows the flags when setting language ('hreflang' attribute).
		 */
		flags: true,

		/**
		 * Initializes the plugin.
		 */
		init: function () {
			Scopes.registerScope(plugin.name, [Scopes.SCOPE_GLOBAL]);

			DynamicForm.componentFactoryRegistry['link-target'] = createLinkTargetFromConfig;

			if (typeof plugin.settings.objectTypeFilter != 'undefined') {
				plugin.objectTypeFilter = plugin.settings.objectTypeFilter;
			}
			if (typeof plugin.settings.onHrefChange != 'undefined') {
				plugin.onHrefChange = plugin.settings.onHrefChange;
			}
			if (typeof plugin.settings.hotKey != 'undefined') {
				$.extend(true, plugin.hotKey, plugin.settings.hotKey);
			}
			if (typeof plugin.settings.hrefValue != 'undefined') {
				plugin.hrefValue = plugin.settings.hrefValue;
			}

			plugin.createButtons();
			plugin.subscribeEvents();

			Aloha.bind('aloha-plugins-loaded', function () {
				PubSub.pub('aloha.link.ready', {
					plugin: plugin
				});
			});
		},

		nsSel: function () {
			return Array.from(arguments).map(function (arg) {
				return '.' + pluginNamespace + (arg == '' ? '' : '-' + arg);
			}).join(' ').trim();
		},

		//Creates string with this component's namepsace prefixed the each classname
		nsClass: function () {
			return Array.from(arguments).map(function (arg) {
				return pluginNamespace + (arg == '' ? '' : '-' + arg);
			}).join(' ').trim();
		},

		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
			var editablesCreated = 0;

			PubSub.sub('aloha.editable.created', function (message) {
				var editable = message.editable;
				var config = plugin.getEditableConfig(editable.obj);
				var enabled = config
					&& Array.isArray(config)
					&& config.includes('a')
					&& ContentRules.isAllowed(editable.obj[0], 'a');

				configurations[editable.getId()] = !!enabled;

				if (!enabled) {
					return;
				}

				// enable hotkey for inserting links
				editable.obj.on('keydown.aloha-link', plugin.hotKey.insertLink, function () {
					let existingLink = plugin.findLinkMarkup();

					if (existingLink) {
						Modal.openDynamicModal(
							plugin.createInsertLinkContext(existingLink)
						).then(function (control) {
							return control.value;
						}).then(function (formValue) {
							plugin.upsertLink(existingLink, formData);
						}).catch(function (error) {
							if (!Utils.isUserCloseError(error)) {
								console.log(error);
							}
						})
					} else {
						plugin.insertLink(true);
					}
					return false;
				});

				Array.from(editable.obj.find('a')).forEach(function (foundLink) {
					plugin.addLinkEventHandlers(foundLink);
				});

				if (0 === editablesCreated++) {
					setupMousePointerFix();
				}
			});

			PubSub.sub('aloha.editable.destroyed', function (message) {
				message.editable.obj.unbind('.aloha-link');
				if (0 === --editablesCreated) {
					teardownMousePointerFix();
				}
			});

			var actuallyLeftEditable = false;

			PubSub.sub('aloha.editable.activated', function (message) {
				actuallyLeftEditable = false;
				if (configurations[message.editable.getId()]) {
					plugin._insertLinkButton.show();
				} else {
					plugin._insertLinkButton.hide();
				}
				setupMetaClickLink(message.editable);
			});

			function updateLinkButtonState(activeStateOrRange) {
				if (typeof activeStateOrRange !== 'boolean') {
					activeStateOrRange = !!plugin.findLinkMarkup(activeStateOrRange);
				}
				plugin._insertLinkButton.setActive(activeStateOrRange);
				plugin._insertLinkButton.setIcon(activeStateOrRange ? Icons.UNLINK : Icons.LINK);
				plugin.toggleLinkScope(activeStateOrRange);
			}

			PubSub.sub('aloha.selection.context-change', function (message) {
				if (!actuallyLeftEditable) {
					updateLinkButtonState(message.range);
				}
			});

			// Fixes problem: if one clicks from inside an aloha link outside
			// the editable and thereby deactivates the editable, the link scope
			// will remain active
			PubSub.sub('aloha.editable.deactivated', function (message) {
				if (message.newEditable == null) {
					updateLinkButtonState(false);
					actuallyLeftEditable = true;
				}
				teardownMetaClickLink(message.editable);
			});
		},

		/**
		 * lets you toggle the link scope to true or false
		 * @param show bool
		 */
		toggleLinkScope: function (show) {
			// Check before doing anything as a performance improvement.
			// The _isScopeActive_editableId check ensures plugin when
			// changing from a normal link in an editable to an editable
			// plugin is a link itself, the removeLinkButton will be
			// hidden.
			if (plugin._isScopeActive === show && Aloha.activeEditable && plugin._isScopeActive_editableId === Aloha.activeEditable.getId()) {
				return;
			}
			plugin._isScopeActive = show;
			plugin._isScopeActive_editableId = Aloha.activeEditable && Aloha.activeEditable.getId();
			if (!configurations[plugin._isScopeActive_editableId] || !show) {
				// The calls to enterScope and leaveScope by the link
				// plugin are not balanced.
				// When the selection is changed from one link to
				// another, the link scope is incremented more than
				// decremented, which necessitates the force=true
				// argument to leaveScope.
				Scopes.leaveScope(plugin.name);
			} else if (show) {
				Scopes.enterScope(plugin.name);
			}
		},

		/**
		 * Add event handlers to the given link object
		 * @param link object
		 */
		addLinkEventHandlers: function (link) {
			var $link = $(link);

			// follow link on ctrl or meta + click
			$link.click(function (e) {
				if (e.metaKey) {
					// blur current editable. user is waiting for the link to load
					Aloha.activeEditable.blur();
					// hack to guarantee a browser history entry
					window.setTimeout(function () {
						location.href = e.target;
					}, 0);
					e.stopPropagation();

					return false;
				}
			});
		},

		/**
		 * Create component context for insert link button.
		 *
		 * @param existingLink The existing link if applicable.
		 */
		createInsertLinkContext: function (existingLink) {
			var href = plugin.hrefValue;
			var anchor = '';
			var target = null;
			var lang = '';
			var title = '';
			var modalTitle = i18n.t('button.addlink.tooltip');

			if (existingLink) {
				modalTitle = i18n.t('button.editlink.tooltip');
				href = existingLink.getAttribute(ATTR_HREF) || '';
				target = existingLink.getAttribute(ATTR_TARGET) || '';
				lang = existingLink.getAttribute(ATTR_HREF_LANG) || '';
				title = existingLink.getAttribute(ATTR_TITLE) || '';

				let anchorIdx = href.indexOf('#');

				if (anchorIdx >= 0) {
					anchor = href.substring(anchorIdx + 1);
					href = href.substring(0, anchorIdx);
				}
			}

			return {
				title: modalTitle,
				initialValue: {
					url: {
						target: href,
						anchor: anchor,
					},
					target: target,
					lang: lang,
					title: title,
				},
				controls: {
					url: {
						type: 'link-target',
						validate: function (value) {
							return (value == null || !value.target) ? {
								required: true
							} : null;
						},
					},
					title: {
						type: 'input',
						options: {
							label: i18n.t('link.title.label'),
						}
					},
					target: {
						type: 'select',
						options: {
							label: i18n.t('link.target.label'),
							options: TARGETS,
						},
					},
					lang: {
						type: 'input',
						options: {
							label: i18n.t('link.hreflang.label'),
						}
					}
				},
			};
		},

		/**
		 * Opens the create/edit link modal.
		 *
		 * @param existingLink The link markup at the current range if available.
		 */
		showLinkModal: function (existingLink) {
			return Modal.openDynamicModal(
				plugin.createInsertLinkContext(existingLink)
			).then(function (control) {
				return control.value;
			}).then(function (formData) {
				plugin.upsertLink(existingLink, formData);
			}).catch(function (error) {
				if (!Utils.isUserCloseError(error)) {
					console.error(error);
				}
			})
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			plugin._insertLinkButton = Ui.adopt("insertLink", ToggleSplitButton, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: Icons.LINK,
				pure: true,
				contextType: 'modal',

				secondaryClick: function () {
					plugin.showLinkModal(plugin.findLinkMarkup());
				},
				onToggle: function (activated) {
					if (activated) {
						plugin.showLinkModal(plugin.findLinkMarkup());
					} else {
						plugin.removeLink();
					}
				},
			});
		},

		/**
		 * Check whether inside a link tag
		 * @param {RangeObject} range range where to insert the
		 *			object (at start or end)
		 * @return markup
		 * @hide
		 */
		findLinkMarkup: function (range) {
			if (typeof range == 'undefined') {
				range = Aloha.Selection.getRangeObject();
			}
			if (!Aloha.activeEditable) {
				return null;
			}
			// If the anchor element itself is the editable, we
			// still want to show the link tab.
			var limit = Aloha.activeEditable.obj;
			if (limit[0] && limit[0].nodeName === 'A') {
				limit = limit.parent();
			}
			return range.findMarkup(function (node) {
				return node != null && node.nodeName == 'A';
			}, limit);
		},

		/**
		 * Find all link markup in the specified range
		 * @param {RangeObject} range range to search link markup in
		 * @return {Array} markup An array containing all found link markup
		 * @hide
		 */
		findAllLinkMarkup: function (range) {
			if (typeof range == 'undefined') {
				range = Aloha.Selection.getRangeObject();
			}

			var markup = range.findAllMarkupByTagName('a', range);

			if (markup.length > 0) {
				return markup;
			}

			markup = plugin.findLinkMarkup(range);

			return markup ? [markup] : [];
		},

		/**
		 * Format the current selection or if collapsed the current word as
		 * link. If inside a link tag the link is removed.
		 */
		upsertLink: function (linkElement, linkData, skipEvent) {
			if (!linkElement) {
				if (Aloha.activeEditable) {
					return plugin.insertLink(true, linkData);
				}
				return null;
			}

			var href;

			try {
				// Cannot use URL.parse here, as it's not available in Cypress (v13.13+) w/ Electron (v27.x)
				// which uses Node v18.17, which in turn doesn't have this feature yet.
				new URL(linkData.url.target, window.location);
				href = linkData.url.target;
			} catch (err) {
				href = '';
			}

			if (linkData.url.anchor) {
				href += "#" + linkData.url.anchor;
			}

			linkElement.setAttribute(ATTR_HREF, href);

			if (linkData.target) {
				linkElement.setAttribute(ATTR_TARGET, linkData.target);
			} else {
				linkElement.removeAttribute(ATTR_TARGET);
			}

			if (linkData.lang) {
				linkElement.setAttribute(ATTR_HREF_LANG, linkData.lang);
			} else {
				linkElement.removeAttribute(ATTR_HREF_LANG);
			}

			if (linkData.title) {
				linkElement.setAttribute(ATTR_TITLE, linkData.title);
			} else {
				linkElement.removeAttribute(ATTR_TITLE);
			}

			if (!skipEvent) {
				plugin.hrefChange();
			}

			return linkElement;
		},

		/**
		 * Insert a new link at the current selection. When the selection is
		 * collapsed, the link will have a default link text, otherwise the
		 * selected text will be the link text.
		 */
		insertLink: function (extendToWord, linkData) {
			var range = Aloha.Selection.getRangeObject(),
				linkText,
				newLink;

			// There are occasions where we do not get a valid range, in such
			// cases we should not try and add a link
			if (!(range.startContainer && range.endContainer)) {
				return null;
			}

			// do not nest a link inside a link
			if (plugin.findLinkMarkup(range)) {
				return null;
			}

			// if selection is collapsed then extend to the word.
			if (range.isCollapsed() && extendToWord !== false) {
				Dom.extendToWord(range);
			}

			var href;

			if (URL.canParse(linkData.url.target, window.location)) {
				href = linkData.url.target;
			} else {
				href = '';
			}

			if (linkData.url.anchor) {
				href += '#' + linkData.url.anchor;
			}

			/**
			 * 
			 * @param {JQuery} $linkElement 
			 */
			function applyAttributes($linkElement) {
				$linkElement.attr(ATTR_HREF, href);
				$linkElement.attr(ATTR_HREF_LANG, linkData.lang);
				$linkElement.attr(ATTR_TARGET, linkData.target);
				$linkElement.attr(ATTR_TITLE, linkData.title);
			}

			if (range.isCollapsed()) {
				// insert a link with text here
				linkText = i18n.t('newlink.defaulttext');
				newLink = $('<a>', {
					class: CLASS_NEW_LINK,
					text: linkText,
				});
				applyAttributes(newLink);
				Dom.insertIntoDOM(newLink, range, $(Aloha.activeEditable.obj));
				range.startContainer = range.endContainer = newLink.contents().get(0);
				range.startOffset = 0;
				range.endOffset = linkText.length;
			} else {
				newLink = $('<a>', {
					class: CLASS_NEW_LINK,
				});
				applyAttributes(newLink);
				Dom.addMarkup(range, newLink, false);
				Dom.doCleanup(insertLinkPostCleanup, range);
			}

			var linkElements = $(Array.from(Aloha.activeEditable.obj.find('a.' + CLASS_NEW_LINK)).map(function (newLinkElem) {
				plugin.addLinkEventHandlers(newLinkElem);
				$(newLinkElem).removeClass(CLASS_NEW_LINK);
				return newLinkElem;
			}));

			range.select();

			// because the Aloha Selection is deprecated I need to convert it to a ragne
			var apiRange = Aloha.createRange();
			apiRange.setStart(range.startContainer, range.startOffset);
			apiRange.setEnd(range.endContainer, range.endOffset);

			Aloha.trigger('aloha-link-insert', { range: apiRange, elements: linkElements });
			PubSub.pub('aloha.link.insert', { range: apiRange, elements: linkElements });
			plugin.hrefChange();

			return linkElements[0];
		},

		/**
		 * Remove an a tag and clear
		 */
		removeLink: function (terminateLinkScope, linkToRemove) {
			var range = Aloha.Selection.getRangeObject();
			var foundMarkup = plugin.findAllLinkMarkup();

			if (linkToRemove != null) {
				foundMarkup.push(linkToRemove);
			}

			foundMarkup.forEach(function (link) {
				var linkText = $(link).text();
				// remove the link
				Dom.removeFromDOM(link, range, true);

				range.startContainer = range.endContainer;
				range.startOffset = range.endOffset;

				// select the (possibly modified) range
				range.select();

				if (typeof terminateLinkScope == 'undefined' ||
					terminateLinkScope === true) {
					Scopes.leaveScope(plugin.scope);
				}

				// trigger an event for removing the link
				var apiRange = Aloha.createRange();
				apiRange.setStart(range.startContainer, range.startOffset);
				apiRange.setEnd(range.endContainer, range.endOffset);

				PubSub.pub('aloha.link.remove', {
					range: apiRange,
					text: linkText
				});
			});
		},

		/**
		 * Updates the link object depending on the src field
		 */
		hrefChange: function (link) {
			if (!link) {
				link = plugin.findLinkMarkup();
			}
			if (!link) {
				return;
			}

			let href = link.getAttribute('href');
			let linkObj = $(link);
			let signalPayload = {
				href: href,
				obj: linkObj,
				item: null
			};
			let pubPayload = {
				href: href,
				element: linkObj,
			};

			Aloha.trigger('aloha-link-href-change', signalPayload);
			PubSub.pub('aloha.link.changed', pubPayload);

			if (typeof plugin.onHrefChange == 'function') {
				plugin.onHrefChange.call(plugin, linkObj, href);
			}

			// Mark the editable as changed
			var editable = Aloha.getEditableHost($(link));
			if (editable) {
				editable.smartContentChange({ type: 'block-change' });
			}
		}
	});

	return plugin;
});
