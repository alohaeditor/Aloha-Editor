/* content-rules.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'PubSub',
	'aloha/core',
	'util/dom2',
	'util/arrays',
	'aloha/jquery'
], function (
	PubSub,
	Aloha,
	Dom,
	Arrays,
	$
) {
	'use strict';

	/**
	 * White list node names for list elements.
	 * @type {Array.<string>}
	 */
	var LIST_WHITELIST_NODE_NAMES = ['li'];

	/**
	 * White list node names for table elements.
	 * @type {Array.<string>}
	 */
	var TABLE_WHITELIST_NODE_NAMES = ['caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'td', 'th'];

	/**
	 * Add default rules for some elements.
	 * @param {Object.<string, Array.<string>>}
	 * @return {Object.<string, Array.<string>>}
	 */
	function addDefaultRules(mapRules) {
		var selector;
		for (selector in mapRules) {
			if (mapRules.hasOwnProperty(selector)) {
				if (Arrays.contains(mapRules[selector], 'ol') || Arrays.contains(mapRules[selector], 'ul')) {
					mapRules[selector] = Arrays.concat(mapRules[selector], LIST_WHITELIST_NODE_NAMES);
				}
				if (Arrays.contains(mapRules[selector], 'table')) {
					mapRules[selector] = Arrays.concat(mapRules[selector], TABLE_WHITELIST_NODE_NAMES);
				}
			}
		}
		return mapRules;
	}

	/**
	 * Whitelist rules.
	 *
	 * @private
	 * @type {Object.<string, Array.<string>>}
	 */
	var whitelist = addDefaultRules((
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.whitelist
	) || {});

	/**
	 * Blacklist rules.
	 *
	 * @private
	 * @type {Object.<string, Array.<string>>}
	 */
	var blacklist = (
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.blacklist
	) || {};

	/**
	 * Translation rules.
	 *
	 * @private
	 * @type {Object<string, string>}
	 */
	var translations = (
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.translate
	) || {};

	/**
	 * Retrieves a list of all rules in a specified table that are applicable
	 * the given editable.
	 *
	 * @private
	 * @param {Element}                        editable
	 * @param {Object<string, Array.<string>}} table
	 */
	function getRules(editable, table) {
		var $editable = $(editable);
		var rules = [];
		var selector;
		for (selector in table) {
			if (table.hasOwnProperty(selector) && $editable.is(selector)) {
				rules.push(table[selector]);
			}
		}
		return rules;
	}

	/**
	 * Concatenates the given list of lists into a single set.
	 *
	 * @private
	 * @param  {Array.<Array<string>>} lists
	 * @return {Array.<string>}
	 */
	function setcat(lists) {
		var result = [];
		$.each(lists, function (index, item) {
			result = result.concat(item);
		});
		$.unique(result);
		return result;
	}

	/**
	 * These element's cannot be simply unwrapped because they have dependent
	 * children.
	 *
	 * @private
	 * @see  GROUPED_ELEMENTS
	 * @type {<string, boolean>}
	 */
	var GROUP_CONTAINERS = {
		FIELDSET : true,
		OBJECT   : true,
		FIGURE   : true,
		AUDIO    : true,
		SELECT   : true,
		COLGROUP : true,
		HGROUP   : true,
		TABLE    : true,
		TBODY    : true,
		TR       : true,
		OL       : true,
		UL       : true,
		DL       : true,
		MENU     : true
	};

	/**
	 * These element's cannot be simply unwrapped because their parents only
	 * allow these as their immediate child nodes.
	 *
	 * @private
	 * @see  GROUP_CONTAINERS
	 * @type {<string, Array.<string>}
	 */
	var GROUPED_ELEMENTS = {
		LI    : ['OL', 'UL', 'DL'],
		DT    : ['DL'],
		DD    : ['DL'],
		TBODY : ['TABLE'],
		TR    : ['TABLE', 'TBODY'],
		TH    : ['TABLE', 'TBODY'],
		TD    : ['TR', 'TH']
	};

	/**
	 * Checks whether nodes of the specified nodeName are allowed in the given
	 * editable.
	 *
	 * @param  {Element} editable
	 * @param  {string}  nodeName
	 * @return {boolean}
	 */
	function isAllowed(editable, nodeName) {
		var white = getRules(editable, whitelist);
		// Because if no rules are configured for this editable then permit all
		if (white.length > 0) {
			// Because textnode are always to be permitted by default. They
			// must be explicitly blacklisted if undesired
			if (!Arrays.contains(setcat(['#text'].concat(white)), nodeName.toLowerCase())) {
				return false;
			}
		}
		var black = getRules(editable, blacklist);
		if (black.length > 0) {
			return !Arrays.contains(setcat(black), nodeName.toLowerCase());
		}
		return true;
	}

	/**
	 * Translates nodes from one name to another (eg: i to em) if translation is
	 * configured for the given editable.
	 *
	 * @param  {Element} editable
	 * @param  {string}  nodeName
	 * @return {string}  Translated nodeName
	 */
	function translate(editable, nodeName) {
		var rules = $.extend.apply({}, getRules(editable, translations));
		return rules[nodeName.toLowerCase()] || nodeName;
	}

	/**
	 * Given a string of html content to be inserted in a specified editable
	 * element, will strip away any elements which are disallowed and translate
	 * any according to the Content Rules configuration.
	 *
	 * @param  {string}  content
	 * @param  {Element} editable
	 * @return {string}
	 */
	function applyRules(content, editable) {
		var doc = editable.ownerDocument;
		var container = doc.createElement('div');
		container.innerHTML = content;
		var node = Dom.forward(container);
		while (node) {
			//skip over node if it is a aloha-block, because we want to keep elements inside
			if ($(node).hasClass('aloha-block')) {
				node = Dom.forward(node, true);
			} else {
				var translation = translate(editable, node.nodeName);
				if (translation !== node.nodeName) {
					var replacement = doc.createElement(translation);
					replacement.innerHTML = node.innerHTML;
					node.parentNode.replaceChild(replacement, node);
					node = replacement;
				}
				if (isAllowed(editable, node.nodeName)) {
					node = Dom.forward(node);
				} else if (GROUP_CONTAINERS[node.nodeName] || GROUPED_ELEMENTS[node.nodeName]) {
					// Because `node` is being entirely removed, we skip over, and
					// do not descend its subtree
					var prev = Dom.backward(node);
					node.parentNode.removeChild(node);
					node = Dom.forward(prev);
				} else {
					var next = Dom.forward(node);
					Dom.removeShallow(node);
					node = next;
				}
			}
		}
		return container.innerHTML;
	}

	return {
		isAllowed  : isAllowed,
		translate  : translate,
		applyRules : applyRules
	};
});
