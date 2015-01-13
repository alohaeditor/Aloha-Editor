/*!
 * Aloha Editor
 * Author & Copyright (c) 2011-2013 Gentics Software GmbH
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
	'util/dom',
	'ui/ui',
	'ui/scopes',
	'ui/button',
	'ui/toggleButton',
	'ui/port-helper-attribute-field',
	'i18n!wai-lang/nls/i18n',
	'../../../shared/languages/languages'
], function (
	$,
	Aloha,
	PubSub,
	Plugin,
	Selection,
	ContentRules,
	Dom,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	attributeField,
	i18n,
	LanguageRepository
) {
	'use strict';

	var WAI_LANG_CLASS = 'aloha-wai-lang';

	/**
	 * Ui Attribute Field singleton.
	 *
	 * Needs to be defined in prepareUi(), because of a problem with the
	 * stateful initialization of jQuery UI autocomplete implementation for
	 * Aloha Editor.
	 *
	 * @type {AttributeField}
	 */
	var FIELD = null;

	/**
	 * UI Button to remove wai-lang
	 */
	var removeButton = null;

	/**
	 * True if IE9
	 */
	var isIE9 = Aloha.browser.msie && parseInt(Aloha.browser.version, 10) === 9;

	/**
	 * Sets focus on the given field.
	 *
	 * @param {AttributeField} field
	 */
	function focusOn(field) {
		if (field) {
			field.foreground();
			field.focus();
		}
		FIELD.show();
		removeButton.show();
	}

	/**
	 * Maps the given value to boolean.
	 *
	 * We need to do this to support Gentics Content.Node which provides Aloha
	 * Editor configuration from serialized PHP.
	 *
	 * @return {boolean}
	 */
	function isTrue(value) {
		return true   === value
		    || 'true' === value
		    || 1      === value
		    || '1'    === value;
	}

	/**
	 * Checks whether this element is a wai-lang wrapper element.
	 *
	 * @this   {HTMLElement}
	 * @return {boolean} True if the given markup denotes wai-lang wrapper.
	 */
	function filterForWaiLangMarkup() {
		var $elem = $(this);
		//IE9 Fix, "lang" value not in dom attributes, use "xml:lang" instead
		return $elem.hasClass(WAI_LANG_CLASS) || $elem.is('[lang]' || $elem.is('[xml\\:lang'));
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

		focusOn(FIELD);
	}

	/**
	 * Toggles language annotation on the markup at the current range.
	 */
	function toggleAnnotation() {
		if (Aloha.activeEditable) {
			var range = Selection.getRangeObject();
			if (findWaiLangMarkup(range)) {
				removeMarkup(range);
			} else {
				addMarkup(range);
				focusOn(FIELD);
			}
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
		        .attr('data-gentics-aloha-object-id', $element.attr(isIE9 ? 'xml:lang' : 'lang'));
	}

	/**
	 * Initialize the buttons:
	 * Places the Wai-Lang UI buttons into the floating menu.
	 *
	 * Initializes `FIELD`.
	 *
	 * @param {Plugin} plugin Wai-lang plugin instance
	 */
	function prepareUi(plugin) {
		FIELD = attributeField({
			name: 'wailangfield',
			width: 320,
			valueField: 'id',
			minChars: 1,
			scope: 'Aloha.continuoustext'
		});

		plugin._wailangButton = Ui.adopt('wailang', ToggleButton, {
			tooltip: i18n.t('button.add-wai-lang.tooltip'),
			icon: 'aloha-icon aloha-icon-wai-lang',
			scope: 'Aloha.continuoustext',
			click: toggleAnnotation
		});

		removeButton = Ui.adopt('removewailang', Button, {
			tooltip: i18n.t('button.add-wai-lang-remove.tooltip'),
			icon: 'aloha-icon aloha-icon-wai-lang-remove',
			scope: 'Aloha.continuoustext',
			click: function onButtonClick() {
				removeMarkup(Selection.getRangeObject());
			}
		});

		FIELD.setTemplate(plugin.flags
				? '<div class="aloha-wai-lang-img-item">' +
				  '<img class="aloha-wai-lang-img" src="{url}" />' +
				  '<div class="aloha-wai-lang-label-item">{name} ({id})</div>' +
				  '</div>'
				: '<div class="aloha-wai-lang-img-item">' +
				  '<div class="aloha-wai-lang-label-item">{name} ({id})</div>' +
				  '</div>'
			);

		FIELD.setObjectTypeFilter(plugin.objectTypeFilter);
	}

	/**
	 * Cache of editable configuration for quicker lookup.
	 *
	 * Note that each configuration is the product of the per-editable
	 * configuration and the plugin configuration, and therefore the cache key
	 * for each configuration entry must be a function of both their
	 * identifiers.
	 *
	 * @type {string, object}
	 */
	var configurations = {};

	/**
	 * Registers event handlers for the given plugin instance.
	 *
	 * Assumes `FIELD` is initialized.
	 *
	 * @param {Plugin} plugin Instance of wai-lang plugin.
	 */
	function subscribeEvents(plugin) {
		PubSub.sub('aloha.editable.created', function (message) {
			var $editable = message.editable.obj;
			var config = plugin.getEditableConfig($editable);
			var enabled = config
			           && ($.inArray('span', config) > -1)
			           && ContentRules.isAllowed($editable[0], 'span');

			configurations[message.editable.getId()] = enabled;

			if (!enabled) {
				return;
			}

			$editable.bind('keydown', plugin.hotKey.insertAnnotation, function () {
					prepareAnnotation();

					// Because on a MAC Safari, cursor would otherwise
					// automatically jump to location bar.  We therefore prevent
					// bubbling, so that the editor must hit ESC and then META+I
					// to manually do that
					return false;
				}
			);

			$editable.find('span[lang]').each(function () {
				annotate(this);
			});
		});

		PubSub.sub('aloha.editable.activated', function (message) {
			plugin._wailangButton.show(!!configurations[message.editable.getId()]);
		});

		PubSub.sub('aloha.editable.deleted', function (message) {
			delete configurations[message.editable.getId()];
		});

		Aloha.bind(
			'aloha-selection-changed',
			function onSelectionChanged($event, range) {
				var markup = findWaiLangMarkup(range);
				if (markup) {
					plugin._wailangButton.setState(true);
					//IE9 Fix, "lang" value not in dom attributes,
					//use "xml:lang" instead
					FIELD.setTargetObject(markup, isIE9 ? 'xml:lang' : 'lang');

					FIELD.show();
					removeButton.show();
					Scopes.enterScope(plugin.name, 'wai-lang');
				} else {
					plugin._wailangButton.setState(false);
					FIELD.setTargetObject(null);
					FIELD.hide();
					removeButton.hide();
					Scopes.leaveScope(plugin.name, 'wai-lang', true);
				}
			}
		);

		FIELD.addListener('blur', function onFieldBlur() {
			// @TODO Validate value to not permit values outside the set of
			//       configured language codes
			if (!this.getValue()) {
				removeMarkup(Selection.getRangeObject());
			}
		});
	}

	return Plugin.create('wai-lang', {

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
			if (this.settings.objectTypeFilter) {
				this.objectTypeFilter = this.settings.objectTypeFilter;
			}
			if (this.settings.hotKey) {
				$.extend(true, this.hotKey, this.settings.hotKey);
			}
			if (this.settings.iso639) {
				this.iso639 = this.settings.iso639;
			}
			this.flags = isTrue(this.settings.flags);
			prepareUi(this);
			subscribeEvents(this);
			
			var repo = new LanguageRepository(
				'wai-languages',
				this.flags,
				this.iso639 == 'iso639-1' ? 'iso639-1' : 'iso639-2',
				Aloha.settings.locale,
				'language/wai'
			);
		},

		/**
		 * Toggle language annotation on the current selection, or if collapsed,
		 * the current word.
		 */
		formatLanguageSpan: toggleAnnotation,

		/**
		 * Makes the given editable DOM element clean for export.  Find all
		 * elements with lang attributes and remove the attribute.
		 *
		 * It also removes data attributes attached by the repository manager.
		 * It adds a xml:lang attribute with the value of the lang attribute.
		 *
		 * @param {jQuery<HTMLElement>} $element jQuery unit set containing
		 *                                       element to clean up.
		 */
		makeClean: function makeClean($element) {
			//IE9 Fix, "lang" value not in dom attributes,
			//use "xml:lang" instead
			$element.find(isIE9 ? 'span[xml\\:lang]' : 'span[lang]')
				.each(function onEachLangSpan() {
					var $span = $(this);
					$span.removeClass(WAI_LANG_CLASS)
					     .removeAttr('data-gentics-aloha-repository')
					     .removeAttr('data-gentics-aloha-object-id');
					if (isIE9) {
						$span.attr('lang', $span.attr('xml:lang'));
						$span.lang = $span.attr('xml:lang');
					} else {
						$span.attr('xml:lang', $span.attr('lang'));
					}
				});
		}

	});
});
