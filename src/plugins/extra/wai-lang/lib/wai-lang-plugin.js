/*!
 * Aloha Editor
 * Author & Copyright (c) 2011-2024 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 */
define([
	'jquery',
	'aloha',
	'PubSub',
	'aloha/plugin',
	'aloha/selection',
	'aloha/content-rules',
	'aloha/keybinds',
	'util/dom',
	'ui/ui',
	'ui/icons',
	'ui/scopes',
	'ui/attributeToggleButton',
	'i18n!wai-lang/nls/i18n',
	'extra/languages/languages'
], function (
	$,
	Aloha,
	PubSub,
	Plugin,
	Selection,
	ContentRules,
	Keybinds,
	Dom,
	Ui,
	Icons,
	Scopes,
	AttributeToggleButton,
	i18n,
	LanguageRepository
) {
	'use strict';

	var WAI_LANG_CLASS = 'aloha-wai-lang';

	/**
	 * Maps the given value to boolean.
	 *
	 * We need to do this to support Gentics Content.Node which provides Aloha
	 * Editor configuration from serialized PHP.
	 *
	 * @return {boolean}
	 */
	function isTrue(value) {
		return true === value
			|| 'true' === value
			|| 1 === value
			|| '1' === value;
	}

	/**
	 * Checks whether this element is a wai-lang wrapper element.
	 *
	 * @this   {HTMLElement}
	 * @return {boolean} True if the given markup denotes wai-lang wrapper.
	 */
	function filterForWaiLangMarkup() {
		var $elem = $(this);
		return $elem.hasClass(WAI_LANG_CLASS) || $elem.is('[lang]');
	}

	/**
	 * Looks for a wai-Lang wrapper DOM element within the the given range.
	 *
	 * @param  {RangeObject} range
	 * @return {?HTMLElement} Wai-lang wrapper node; null otherwise.
	 */
	function findWaiLangMarkup(range) {
		return Aloha.activeEditable
			? range.findMarkup(filterForWaiLangMarkup, Aloha.activeEditable.obj)
			: null;
	}

	/**
	 * Wraps the contents at the current range in a wai-lang wrapper element.
	 *
	 * @param {RangeObject} range
	 */
	function addMarkup(range) {
		if (range.isCollapsed()) {
			Dom.extendToWord(range);
		}
		Dom.addMarkup(
			range,
			$('<span class="' + WAI_LANG_CLASS + '"></span>'),
			false
		);
		range.select();
	}

	/**
	 * Removes wai-lang wrapper on the markup at the given range.
	 *
	 * @param {RangeObject} range
	 */
	function removeMarkup(range) {
		var markup = findWaiLangMarkup(range);
		if (markup) {
			Dom.removeFromDOM(markup, range, true);
			range.select();
		}
	}

	/**
	 * Prepares the markup at the current range for language annotation.
	 */
	function prepareAnnotation() {
		var range = Selection.getRangeObject();

		// Because we don't want to add markup to an area that already contains
		// wai-lang markup
		if (!findWaiLangMarkup(range)) {
			addMarkup(range);
		}
	}

	/**
	 * Mark the given element as a wai-lang wrapper, with a class and
	 * annotation.
	 *
	 * @param {HTMLElement} element
	 */
	function annotate(element) {
		var $element = $(element);
		$element.addClass(WAI_LANG_CLASS)
			.attr('data-gentics-aloha-repository', 'wai-languages')
			.attr('data-gentics-aloha-object-id', $element.attr('lang'));
	}

	/**
	 * Initialize the buttons:
	 * Places the Wai-Lang UI button into the floating menu.
	 */
	function prepareUi() {
		plugin._wailangButton = Ui.adopt('wailang', AttributeToggleButton, {
			tooltip: i18n.t('button.add-wai-lang.tooltip'),
			icon: Icons.LANGUAGE,
			targetAttribute: 'lang',
			inputLabel: 'Language',
			panelLabel: 'WAI language',
			pure: true,
			onToggle: function (active) {
				if (Aloha.activeEditable) {
					var range = Selection.getRangeObject();
					if (findWaiLangMarkup(range)) {
						removeMarkup(range);
						plugin._wailangButton.setActive(false);
					} else {
						addMarkup(range);
						plugin._wailangButton.setActive(true);
					}
				}
			}
		});
	}

	function checkVisibility(editable) {
		// If we have no editable, then we don't want to show the button
		if (editable == null || editable.obj == null) {
			plugin._wailangButton.hide();
			return;
		}

		var config = plugin.getEditableConfig(editable.obj);
		var enabled = config
			&& ($.inArray('span', config) > -1)
			&& ContentRules.isAllowed(editable.obj[0], 'span');

		if (enabled) {
			plugin._wailangButton.show();
		} else {
			plugin._wailangButton.hide();
		}
	}

	/**
	 * Registers event handlers for the given plugin instance.
	 */
	function subscribeEvents() {
		Aloha.bind('aloha-editable-created', function (e, editable) {
			Keybinds.bind(editable.obj, 'abbr', Keybinds.parseKeybinds(plugin.hotKey.insertAnnotation), function() {
				prepareAnnotation();
			});
		});

		// Set the button visible if it's enabled via the config
		PubSub.sub('aloha.editable.activated', function (message) {
			var editable = message.editable;
			checkVisibility(editable);

			if (!plugin._wailangButton.visibile) {
				return;
			}

			$editable.find('span[lang]').each(function () {
				annotate(this);
			});
		});

		// Reset and hide the button when leaving an editable
		PubSub.sub('aloha.editable.deactivated', function (message) {
			plugin._wailangButton.hide();
			message.editable.obj.off('keydown.aloha-wai');
		});

		checkVisibility(Aloha.activeEditable);

		// 'aloha-selection-changed',
		PubSub.sub('aloha.selection.context-change', function onSelectionChanged(message) {
			var range = message.range;
			var markup = findWaiLangMarkup(range);

			if (markup) {
				plugin._wailangButton.setActive(true);
				plugin._wailangButton.activateInput(true);
				plugin._wailangButton.setTargetElement($(markup));
				Scopes.enterScope(plugin.name);
			} else {
				plugin._wailangButton.setActive(false);
				plugin._wailangButton.deactivateInput();
				Scopes.leaveScope(plugin.name);
			}
		});
	}

	var plugin = {

		/**
		 * Default configuration, allows spans everywhere.
		 *
		 * @type {Array.<string>}
		 */
		config: ['span'],

		/**
		 * Define the exact standard of language codes to use (possible values
		 * are 'iso639-1' and 'iso639-2', default is 'iso639-1')
		 *
		 * @type {string}
		 */
		iso639: 'iso639-1',

		/**
		 * Whether or not to show flag icons.
		 *
		 * @type {boolean}
		 */
		flags: false,

		/**
		 * The object types to be used for for annotations.
		 *
		 * @type {Array.<string>}
		 */
		objectTypeFilter: ['language/wai'],

		/**
		 * HotKeys used for special actions.
		 *
		 * @type {object<string, string>}
		 */
		hotKey: {
			insertAnnotation: i18n.t('insertAnnotation', 'ctrl+shift+l')
		},

		init: function init() {
			if (plugin.settings.objectTypeFilter) {
				plugin.objectTypeFilter = plugin.settings.objectTypeFilter;
			}
			if (plugin.settings.hotKey) {
				$.extend(true, plugin.hotKey, plugin.settings.hotKey);
			}
			if (plugin.settings.iso639) {
				plugin.iso639 = plugin.settings.iso639;
			}
			plugin.flags = isTrue(plugin.settings.flags);
			prepareUi();
			subscribeEvents();

			var repo = new LanguageRepository(
				'wai-languages',
				plugin.flags,
				plugin.iso639 == 'iso639-1' ? 'iso639-1' : 'iso639-2',
				Aloha.settings.locale,
				'language/wai'
			);
		},

		/**
		 * Makes the given editable DOM element clean for export.  Find all
		 * elements with lang attributes and remove the attribute.
		 *
		 * It also removes data attributes attached by the repository manager.
		 *
		 * @param {jQuery<HTMLElement>} $element jQuery unit set containing
		 *                                       element to clean up.
		 */
		makeClean: function makeClean($element) {
			$element.find('span[lang]').each(function onEachLangSpan() {
				var $span = $(this);
				$span.removeClass(WAI_LANG_CLASS)
					.removeAttr('data-gentics-aloha-repository')
					.removeAttr('data-gentics-aloha-object-id');
			});
		}

	};

	plugin = Plugin.create('wai-lang', plugin);

	return plugin;
});
