/*!
 * Aloha Editor
 * Author & Copyright (c) 2010-2013 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */
define([
	'jquery',
	'aloha/core',
	'aloha/contenthandlermanager',
	'contenthandler/contenthandler-utils',
	'util/html'
], function (
	$,
	Aloha,
	ContentHandlerManager,
	Utils,
	Html
) {
	'use strict';

	var blocksSelector = Html.BLOCK_TAGNAMES.join();
	var emptyBlocksSelector = Html.BLOCK_TAGNAMES.join(':empty,') + ':empty';
	var NOT_ALOHA_BLOCK_FILTER = ':not(.aloha-block)';

	/**
	 * Determines if the given HTML element needs a trailing <br> tag in order
	 * for it to be visible.
	 *
	 * @param {HTMLElement} block
	 * @return {boolean}
	 */
	function needsEndBr(block) {
		return (
			Html.isBlock(block)
			&&
			(!block.lastChild ||
				'br' !== block.lastChild.nodeName.toLowerCase())
		);
	}

	/**
	 * Finds a <br> tag that is at the end of the given container.
	 * Invisible what spaces are ignored.
	 *
	 * @param {HTMLElement} container
	 * @return {HTMLElement|null} A <br> tag at the end of the container; null
	 *                            if none is found.
	 */
	function findEndBr(container) {
		var node = container.lastChild;
		while (node && Html.isIgnorableWhitespace(node)) {
			node = node.previousSibling;
		}
		return ('br' === node.nodeName.toLowerCase()) ? node : null;
	}

	/**
	 * Removes the <br> tag that is at the end of the given container.
	 * Invisible what spaces are ignored.
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function removeEndBr(i, element) {
		var br = findEndBr(element);
		if (br) {
			$(br).remove();
		}
	}

	/**
	 * Prepares this content for editing
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function prepareForEditing(i, element) {
		var $element = $(element);

		$element.filter(emptyBlocksSelector).remove();

		if ($.browser.msie) {
			// If editing in IE: remove end-br's.  Content edited by Aloha
			// Editor is no longer exported with <br>'s that are annotated with
			// "aloha-end-br" classes,  this clean-up is still done, however,
			// for content that was edited using legacy Aloha Editor.
			$element.filter('br.aloha-end-br').remove();

			// Because IE's Trident engine goes against W3C's HTML specification
			// by rendering empty block-level elements with height if they are
			// contentEditable.  Propping <br> elements therefore result in 2
			// lines being displayed rather than 1 (which was the intention of
			// having the propping <br> element is).  Because these empty
			// content editable block-level elements are not rendered invisibly
			// in IE, we can remove the propping <br> in otherwise empty
			// block-level elements.
			$element.filter(blocksSelector).each(removeEndBr);
		} else {
			$element.filter('li').each(function () {
				// Does not compute; Html.isBlock(li) === false
				if (needsEndBr(this)) {
					$(this).append('<br/>');
				}
			});
		}
		$element.children(NOT_ALOHA_BLOCK_FILTER).each(prepareForEditing);
	}

	/**
	 * Prepares the content for editing in IE7.
	 *
	 * Ensure that all empty blocklevel elements must contain a zero-width
	 * whitespace.
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function prepareEditingIE7(i, element) {
		var $element = $(element);
		$element.filter(emptyBlocksSelector).append('\u200b');
		$element.children(NOT_ALOHA_BLOCK_FILTER).each(prepareEditingIE7);
	}

	/**
	 * For a given DOM element, will make sure that it, and every one of its
	 * child nodes, which is a block-level element ends with a <br> node.
	 *
	 * This ensures that a block is rendered visibly (with atleast one
	 * character height).
	 *
	 * @param {number} i Unused
	 * @param {HTMLElement} element
	 */
	function propBlockElements(i, element) {
		var $element = $(element);
		$element.filter(emptyBlocksSelector).append('<br/>');
		$element.children(NOT_ALOHA_BLOCK_FILTER).each(propBlockElements);
	}

	return ContentHandlerManager.createHandler({
		handleContent: function (content, options) {
			var $content = Utils.wrapContent(content);

			if (!options || !$content) {
				return $content && $content.html();
			}

			switch (options.command) {
			case 'initEditable':
				$content.children(NOT_ALOHA_BLOCK_FILTER)
				        .each(prepareForEditing);

				// TODO: Do we support ie versions below 7?
				if ($.browser.msie && $.browser.version <= 7) {
					$content.children(NOT_ALOHA_BLOCK_FILTER)
					        .each(prepareEditingIE7);
				}
				break;
			case 'getContents':
				$content.children(NOT_ALOHA_BLOCK_FILTER)
				        .each(propBlockElements);

				// Because trailing end <br>s in <li>s are not necessary for
				// rendering.
				$content.find('li>br:last').remove();
				break;
			}

			return $content.html();
		}
	});
});
