/*!
 * Aloha Editor
 * Author & Copyright (c) 2010-2013 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 *
 * @overview
 * Prepares block-level elements in contents of editables that are initialized
 * for editing ('initEditing'), or when exporting contents of editable for
 * saving ('getContents').
 */
define([
	'jquery',
	'aloha/core',
	'aloha/contenthandlermanager',
	'contenthandler/contenthandler-utils',
	'util/functions',
	'util/html',
	'util/arrays'

], function (
	$,
	Aloha,
	ContentHandlerManager,
	Utils,
	Functions,
	Html,
	Arrays
) {
	'use strict';

	var blocksSelector = Html.BLOCKLEVEL_ELEMENTS.join();
	var nonVoidBlocksSelector = Arrays.subtract(
			Html.BLOCKLEVEL_ELEMENTS,
			Html.VOID_ELEMENTS
		).join();

	var NOT_ALOHA_BLOCK_FILTER = ':not(.aloha-block)';

	var isNotIgnorableWhitespace =
			Functions.complement(Html.isIgnorableWhitespace);

	/**
	 * Removes the <br> tag that is at the end of the given container.
	 * Invisible white spaces are ignored.
	 *
	 * @param {number} i Index of element in its collection. (Unused)
	 * @param {HTMLElement} element The container in which to remove the <br>.
	 */
	function removeTrailingBr(i, element) {
		var node = Html.findNodeRight(
			element.lastChild,
			isNotIgnorableWhitespace
		);
		if (node && 'br' === node.nodeName.toLowerCase()) {
			$(node).remove();
		}
	}

	/**
	 * Prepares this content for editing
	 *
	 * @param {number} i Index of element in its collection. (Unused)
	 * @param {HTMLElement} element
	 */
	function prepareForEditing(i, element) {
		var $element = $(element);

		$element.filter(nonVoidBlocksSelector).filter(':empty').remove();

		if ($.browser.msie) {
			// Because even though content edited by Aloha Editor is no longer
			// exported with propping <br>'s that are annotated with
			// "aloha-end-br" classes,  this clean-up still needs to be done for
			// content that was edited using legacy Aloha Editor.
			$element.filter('br.aloha-end-br').remove();

			// Because IE's Trident engine goes against W3C's HTML specification
			// by rendering empty block-level elements with height if they are
			// contentEditable.  Propping <br> elements therefore result in 2
			// lines being displayed rather than 1 (which was the intention of
			// having the propping <br> element is).  Because these empty
			// content editable block-level elements are not rendered invisibly
			// in IE, we can remove the propping <br> in otherwise empty
			// block-level elements.
			$element.filter(blocksSelector).each(removeTrailingBr);
		}

		$element.children(NOT_ALOHA_BLOCK_FILTER).each(prepareForEditing);
	}

	/**
	 * Prepares the content for editing in IE versions older than version 8.
	 *
	 * Ensure that all empty blocklevel elements must contain a zero-width
	 * whitespace.
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function prepareEditingInOldIE(i, element) {
		var $element = $(element);
		$element.filter(nonVoidBlocksSelector).append('\u200b');
		$element.children(NOT_ALOHA_BLOCK_FILTER).each(prepareEditingInOldIE);
	}

	/**
	 * For a given DOM element, will make sure that it, and every one of its
	 * child nodes, which is a block-level element ends with a <br> node.
	 *
	 * This ensures that a block is rendered visibly (with atleast one character
	 * height).
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function propBlockElements(i, element) {
		var $element = $(element);
		if ($.browser.msie) {
			$element.filter(nonVoidBlocksSelector).filter(':empty').append('<br/>');
			$element.children(NOT_ALOHA_BLOCK_FILTER).each(propBlockElements);
		}
	}

	return ContentHandlerManager.createHandler({
		handleContent: function handleBlockLevelContent(content, options) {
			if (!options) {
				return content;
			}
			var $content = Utils.wrapContent(content);
			if (!$content) {
				return content;
			}
			switch (options.command) {
			case 'initEditable':
				$content.children(NOT_ALOHA_BLOCK_FILTER)
				        .each(prepareForEditing);

				if ($.browser.msie && $.browser.version <= 7) {
					$content.children(NOT_ALOHA_BLOCK_FILTER)
					        .each(prepareEditingInOldIE);
				}
				break;
			case 'getContents':
				$content.children(NOT_ALOHA_BLOCK_FILTER)
				        .each(propBlockElements);
				break;
			}
			return $content.html();
		}
	});
});
