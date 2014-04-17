/* content-rules.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * License http://aloha-editor.org/license.php
 */
define([
	'aloha/core',
	'aloha/jquery'
], function (
	Aloha,
	$
) {
	'use strict';

	/**
	 * Whitelist rules.
	 *
	 * @param {Array.<Array.<string>>}
	 */
	var whitelist = (
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.whitelist
	) || [];

	/**
	 * Blacklist rules.
	 *
	 * @param {Array.<Array.<string>>}
	 */
	var blacklist = (
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.blacklist
	) || [];

	/**
	 * Translation rules.
	 *
	 * @param {Object<string, string>}
	 */
	var translations = (
		Aloha.settings &&
		Aloha.settings.contentRules &&
		Aloha.settings.contentRules.translations
	) || {};

	/**
	 * Retrieves a list of all rules in a specified table that are applicable
	 * the editable.
	 *
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
	 * Checks whether `x` is contained in the set `xs`.
	 *
	 * @param  {Array.<*>} xs
	 * @param  {*}         x
	 * @return {boolean}
	 */
	function contains(xs, x) {
		return -1 !== $.inArray(x, xs);
	}

	/**
	 * Concatenates the given list of lists into a single set.
	 *
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
			if (!contains(setcat(['#text'].concat(white)), nodeName.toLowerCase())) {
				return false;
			}
		}
		var black = getRules(editable, blacklist);
		if (black.length > 0) {
			return !contains(setcat(black), nodeName.toLowerCase());
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
		var rules = $.merge([], getRules(editable, translations));
		return rules[nodeName.toLowerCase()] || nodeName;
	}

	return {
		isAllowed : isAllowed,
		translate : translate
	};
});
