/* link-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
/** @typedef {import('../../ui/lib/toggleSplitButton').ToggleSplitButton} ToggleSplitButton */
/** @typedef {import('../../ui/lib/select').SelectOption} SelectOption */


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
	'aloha/keybinds',
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
	Keybinds,
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

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			LinkPlugin._insertLinkButton.hide();
			return false;
		}

		var config = LinkPlugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray('a', config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], 'a');

		if (enabled) {
			LinkPlugin._insertLinkButton.show();
		} else {
			LinkPlugin._insertLinkButton.hide();
		}

		return enabled;
	}

	var LinkPlugin = {
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
		 * @type {function(jQuery, string):void=}
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

		/** @type {ToggleSplitButton=} */
		_insertLinkButton: null,

		/**
		 * Initializes the plugin.
		 */
		init: function () {
			Scopes.registerScope(LinkPlugin.name, [Scopes.SCOPE_GLOBAL]);

			DynamicForm.componentFactoryRegistry['link-target'] = createLinkTargetFromConfig;

			if (typeof LinkPlugin.settings.objectTypeFilter != 'undefined') {
				LinkPlugin.objectTypeFilter = LinkPlugin.settings.objectTypeFilter;
			}
			if (typeof LinkPlugin.settings.onHrefChange != 'undefined') {
				LinkPlugin.onHrefChange = LinkPlugin.settings.onHrefChange;
			}
			if (typeof LinkPlugin.settings.hotKey != 'undefined') {
				$.extend(true, LinkPlugin.hotKey, LinkPlugin.settings.hotKey);
			}
			if (typeof LinkPlugin.settings.hrefValue != 'undefined') {
				LinkPlugin.hrefValue = LinkPlugin.settings.hrefValue;
			}

			LinkPlugin.createButtons();
			LinkPlugin.subscribeEvents();

			Aloha.bind('aloha-plugins-loaded', function () {
				PubSub.pub('aloha.link.ready', {
					plugin: LinkPlugin
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
			Aloha.bind('aloha-editable-created', function (e, editable) {
				Keybinds.bind(editable.obj, 'link', Keybinds.parseKeybinds(LinkPlugin.hotKey.insertLink), function() {
					LinkPlugin.showLinkModal(LinkPlugin.findLinkMarkup());
				});
			});

			// Set the button visible if it's enabled via the config
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;

				setupMetaClickLink(editable);

				if (!checkVisibility(editable)) {
					return;
				}

				Array.from(editable.obj.find('a')).forEach(function (foundLink) {
					LinkPlugin.addLinkEventHandlers(foundLink);
				});
			});

			// Reset and hide the button when leaving an editable
			PubSub.sub('aloha.editable.deactivated', function (message) {
				teardownMetaClickLink(message.editable);
				LinkPlugin._insertLinkButton.hide();
				updateLinkButtonState(false);
			});

			checkVisibility(Aloha.activeEditable);

			function updateLinkButtonState(activeStateOrRange) {
				if (typeof activeStateOrRange !== 'boolean') {
					activeStateOrRange = !!LinkPlugin.findLinkMarkup(activeStateOrRange);
				}
				LinkPlugin._insertLinkButton.setActive(activeStateOrRange);
				LinkPlugin._insertLinkButton.setIcon(activeStateOrRange ? Icons.UNLINK : Icons.LINK);

				if (activeStateOrRange) {
					Scopes.enterScope(LinkPlugin.name);
				} else {
					Scopes.leaveScope(LinkPlugin.name);
				}
			}

			PubSub.sub('aloha.selection.context-change', function (message) {
				updateLinkButtonState(message.range);
			});
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
			var href = LinkPlugin.hrefValue;
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
							return (value == null || !(value.target || value.anchor)) ? {
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
							hint: i18n.t('link.hreflang.hint', ''),
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
				LinkPlugin.createInsertLinkContext(existingLink)
			).then(function (control) {
				return control.value;
			}).then(function (formData) {
				LinkPlugin.upsertLink(existingLink, formData);
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
			LinkPlugin._insertLinkButton = Ui.adopt("insertLink", ToggleSplitButton, {
				tooltip: i18n.t("button.addlink.tooltip"),
				icon: Icons.LINK,
				pure: true,
				contextType: 'modal',

				secondaryClick: function () {
					LinkPlugin.showLinkModal(LinkPlugin.findLinkMarkup());
				},
				onToggle: function (activated) {
					if (activated) {
						LinkPlugin.showLinkModal(LinkPlugin.findLinkMarkup());
					} else {
						LinkPlugin.removeLink();
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

			markup = LinkPlugin.findLinkMarkup(range);

			return markup ? [markup] : [];
		},

		/**
		 * Format the current selection or if collapsed the current word as
		 * link. If inside a link tag the link is removed.
		 */
		upsertLink: function (linkElement, linkData, skipEvent) {
			if (linkData == null) {
				linkData = {};
			}

			if (!linkElement) {
				if (Aloha.activeEditable) {
					return LinkPlugin.insertLink(true, linkData);
				}
				return null;
			}

			var href;

			try {
				// Cannot use URL.parse here, as it's not available in Cypress (v13.13+) w/ Electron (v27.x)
				// which uses Node v18.17, which in turn doesn't have this feature yet.
				if (linkData.url != null && linkData.url.target != null) {
					new URL(linkData.url.target, window.location);
					href = linkData.url.target;
				}
			} catch (err) {
				href = '';
			}

			if (linkData.url != null && linkData.url.anchor) {
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
				LinkPlugin.hrefChange();
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
			if (linkData == null) {
				linkData = {};
			}

			// There are occasions where we do not get a valid range, in such
			// cases we should not try and add a link
			if (!(range.startContainer && range.endContainer)) {
				return null;
			}

			// do not nest a link inside a link
			if (LinkPlugin.findLinkMarkup(range)) {
				return null;
			}

			// if selection is collapsed then extend to the word.
			if (range.isCollapsed() && extendToWord !== false) {
				Dom.extendToWord(range);
			}

			var href;

			if (linkData.url != null && linkData.url.target != null && URL.canParse(linkData.url.target, window.location)) {
				href = linkData.url.target;
			} else {
				href = '';
			}

			if (linkData.url != null && linkData.url.anchor) {
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
				LinkPlugin.addLinkEventHandlers(newLinkElem);
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
			LinkPlugin.hrefChange();

			return linkElements[0];
		},

		/**
		 * Remove an a tag and clear
		 */
		removeLink: function (terminateLinkScope, linkToRemove) {
			var range = Aloha.Selection.getRangeObject();
			var foundMarkup = LinkPlugin.findAllLinkMarkup();

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
					Scopes.leaveScope(LinkPlugin.scope);
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
				link = LinkPlugin.findLinkMarkup();
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

			if (typeof LinkPlugin.onHrefChange == 'function') {
				LinkPlugin.onHrefChange.call(LinkPlugin, linkObj, href);
			}

			// Mark the editable as changed
			var editable = Aloha.getEditableHost($(link));
			if (editable) {
				editable.smartContentChange({ type: 'block-change' });
			}
		}
	};

	LinkPlugin = Plugin.create('link', LinkPlugin);

	return LinkPlugin;
});
