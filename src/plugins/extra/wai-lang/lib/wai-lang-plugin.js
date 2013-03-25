/*!
 * Aloha Editor
 * Author & Copyright (c) 2011-2013 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 */
define([
	'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'aloha/selection',
	'util/dom',
	'ui/ui',
	'ui/scopes',
	'ui/button',
	'ui/toggleButton',
	'ui/port-helper-attribute-field',
	'i18n!wai-lang/nls/i18n',
	'wai-lang/languages'
], function WaiLangPlugin(
	Aloha,
	$,
	PubSub,
	Plugin,
	Selection,
	Dom,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	attributeField,
	i18n
) {
	'use strict';

	var WAI_LANG_CLASS = 'aloha-wai-lang';

	/**
	 * Ui Attribute Field singleton.
	 *
	 * @type {AttributeField}
	 */
	var FIELD = attributeField({
		name: 'wailangfield',
		width: 320,
		valueField: 'id',
		minChars: 1,
		scope: 'wai-lang'
	});

	/**
	 * Sets focus on the given field.
	 *
	 * @param {AttributeField} field
	 */
	function focusOn(field) {
		field.foreground();
		field.focus();
		Scopes.setScope('wai-lang');
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
		return (
			true === value
			|| 1 === value
			|| 'true' === value
			|| '1' === value
		);
	}

	/**
	 * Checks whether this element is a wai-lang wrapper element.
	 *
	 * @this {HTMLElement}
	 * @return {boolean} True if the given markup denotes wai-lang wrapper.
	 */
	function filterForWaiLangMarkup() {
		var $elem = $(this);
		return $elem.hasClass(WAI_LANG_CLASS) || $elem.is('[lang]');
	}

	/**
	 * Looks for a wai-Lang wrapper DOM element within the the given range.
	 *
	 * @param {RangeObject} range
	 * @return {HTMLElement|null} Wai-lang wrapper node; null otherwise.
	 */
	function findWaiLangMarkup(range) {
		return (
			Aloha.activeEditable
				? range.findMarkup(filterForWaiLangMarkup,
				                   Aloha.activeEditable.obj)
				: null
		);
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
		// wai-lang markup.
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
		        .attr('data-gentics-aloha-object-id', $element.attr('lang'));
	}

	/**
	 * Initialize the buttons:
	 * Places the Wai-Lang UI buttons into the floating menu.
	 *
	 * @param {Plugin} plugin Wai-lang plugin instance
	 */
	function prepareUi(plugin) {
		plugin._wailangButton = Ui.adopt('wailang', ToggleButton, {
			tooltip: i18n.t('button.add-wai-lang.tooltip'),
			icon: 'aloha-icon aloha-icon-wai-lang',
			scope: 'Aloha.continuoustext',
			click: toggleAnnotation
		});

		Ui.adopt('removewailang', Button, {
			tooltip: i18n.t('button.add-wai-lang-remove.tooltip'),
			icon: 'aloha-icon aloha-icon-wai-lang-remove',
			scope: 'wai-lang',
			click: function onButtonClick() {
				removeMarkup(Selection.getRangeObject());
			}
		});

		Scopes.createScope('wai-lang', 'Aloha.continuoustext');

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
	 * Create a unique id prefixed with the specified prefix.
	 *
	 * @param {string} prefix
	 * @return {string} Unique identifier string
	 */
	var uniqueId = (function (prefix) {
		var idCounter = 0;
		return function uniqueId() {
			return prefix + '-' + (++idCounter);
		};
	}());

	/**
	 * Return the unique id of the given wai-lang plugin instance.
	 * For use with the caching editable configurations.
	 *
	 * @param {Plugin} plugin Wai-lang plugin instance
	 * @return {string} Unique id of plugin instance
	 */
	function getPluginInstanceId(plugin) {
		return plugin._instanceId;
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
	 * Get this plugin's configuration for the given editable.
	 *
	 * @param {Editable} editable
	 * @param {Plugin} plugin A wai-lang plugin instance
	 * @return {object} configuration
	 */
	function getConfig(editable, plugin) {
		var key = editable.getId() + ':' + getPluginInstanceId(plugin);
		if (!configurations[key]) {
			configurations[key] = plugin.getEditableConfig(editable.obj);
		}
		return configurations[key];
	}

	/**
	 * Registers event handlers for the given plugin instance.
	 *
	 * @param {Plugin} plugin Instance of wai-lang plugin.
	 */
	function subscribeEvents(plugin) {
		PubSub.sub('aloha.editable.activated',
			function onEditableActivated(msg) {
				var config = getConfig(msg.data.editable, plugin);
				if ($.inArray('span', config) > -1) {
					plugin._wailangButton.show();
				} else {
					plugin._wailangButton.hide();
				}
			});

		Aloha.bind('aloha-selection-changed',
			function onSelectionChanged($event, range) {
				var markup = findWaiLangMarkup(range);
				if (markup) {
					plugin._wailangButton.setState(true);
					FIELD.setTargetObject(markup, 'lang');
					Scopes.setScope('wai-lang');
				} else {
					plugin._wailangButton.setState(false);
					FIELD.setTargetObject(null);
				}
			});

		FIELD.addListener('blur', function onFieldBlur() {
			// @TODO Validate value to not permit values outside the set of
			//       configured language codes.
			if (!this.getValue()) {
				removeMarkup(Selection.getRangeObject());
			}
		});

		Aloha.bind('aloha-editable-created',
			function onEditableCreated($event, editable) {
				editable.obj.bind('keydown', plugin.hotKey.insertAnnotation,
					function () {
						prepareAnnotation();

						// Because on a MAC Safari, cursor would otherwise
						// automatically jump to location bar.  We therefore
						// prevent bubbling, so that the editor must hit ESC and
						// then META+I to manually do that.
						return false;
					});

				editable.obj.find('span[lang]').each(function () {
					annotate(this);
				});
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
		objectTypeFilter: ['language'],

		/**
		 * HotKeys used for special actions.
		 *
		 * @type {object<string, string>}
		 */
		hotKey: {
			insertAnnotation: i18n.t('insertAnnotation', 'ctrl+shift+l')
		},

		init: function init() {
			this._instanceId = uniqueId('wai-lang');
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
			$element.find('span[lang]').each(function onEachLangSpan() {
				var $span = $(this);
				$span.removeClass(WAI_LANG_CLASS)
				     .removeAttr('data-gentics-aloha-repository')
				     .removeAttr('data-gentics-aloha-object-id')
				     .attr('xml:lang', $span.attr('lang'));
			});
		}

	});
});
