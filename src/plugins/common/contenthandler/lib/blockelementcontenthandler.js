/*global define:true */
/*!
* Aloha Editor
* Author & Copyright (c) 2010-2012 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
define([
	'aloha',
	'jquery',
	'aloha/contenthandlermanager'
], function (
	Aloha,
	jQuery,
	ContentHandlerManager
) {
	'use strict';

	var IS_BLOCK = {
		h1: true,
		h2: true,
		h3: true,
		h4: true,
		h5: true,
		h6: true,
		p: true,
		pre: true,
		blockquote: true,
		H1: true,
		H2: true,
		H3: true,
		H4: true,
		H5: true,
		H6: true,
		P: true,
		PRE: true,
		BLOCKQUOTE: true
	};

	var IS_BR = {
		br: true,
		BR: true
	};

	/**
	 * Determines if the given HTML element needs a trailing <br> tag in order
	 * for it to be visible.
	 */
	var needsEndBr = function (block) {
		return (
			IS_BLOCK[block.nodeName]
			&&
			!(block.lastChild && IS_BR[block.lastChild.nodeName])
		);
	};

	/**
	 * Prepares this content for editing
	 */
	var prepareEditing = function (index, element) {
		var $element = jQuery(element);

		// Remove empty blocklevel elements which are invisible
		$element.filter('h1:empty,h2:empty,h3:empty,h4:empty,h5:empty,h6:empty,'
			+ 'p:empty,pre:empty,blockquote:empty').remove();

		if (!jQuery.browser.msie) {
			$element.filter('li').each(function () {
				if (needsEndBr(this)) {
					jQuery(this).append('<br/>');
				}
			});
		} else {
			// If editing in IE: remove end-br's.  Content edited by Aloha
			// Editor is no longer exported with <br>'s that are annotated with
			// "aloha-end-br" classes,  this clean-up is still done, however,
			// for content that was edited using legacy Aloha Editor.
			$element.filter('br.aloha-end-br').remove();
		}
		$element.children(':not(.aloha-block)').each(prepareEditing);
	};

	/**
	 * Prepares the content for editing in IE7.
	 *
	 * Ensure that all empty blocklevel elements must contain a zero-width
	 * whitespace.
	 */
	var prepareEditingIE7 = function (index, element) {
		var $element = jQuery(element);
		$element.filter('h1:empty,h2:empty,h3:empty,h4:empty,h5:empty,h6:empty,'
			+ 'p:empty,pre:empty,blockquote:empty').append('\u200b');
		$element.children(':not(.aloha-block)').each(prepareEditingIE7);
	};

	/**
	 * For a given DOM element, will make sure that every one of its child
	 * nodes which is a block-level element ends with a <br> node.
	 *
	 * This ensures that a block is rendered visibly (with atleast one
	 * character height).
	 */
	var propBlockElements = function (index, element) {
		var $element = jQuery(element);
		if ($element.filter('p,h1,h2,h3,h4,h5,h6,pre,blockquote').length > 0) {
			if (needsEndBr(element)) {
				jQuery(element).append('<br/>');
			}
		}
		$element.children(':not(.aloha-block)').each(propBlockElements);
	};

	/**
	 * Register the blockelement content handler
	 */
	var BlockElementContentHandler = ContentHandlerManager.createHandler({
		/**
		 * Handle all blockelements
		 * @param content
		 * @param options
		 */
		handleContent: function (content, options) {
			if (typeof content === 'string') {
				content = jQuery('<div>' + content + '</div>');
			} else if (content instanceof jQuery) {
				content = jQuery('<div>').append(content);
			}

			options = options || {};

			if (options.command === 'initEditable') {
				content.children(':not(.aloha-block)').each(prepareEditing);
				if (jQuery.browser.msie && jQuery.browser.version <= 7) {
					content.children(':not(.aloha-block)').each(prepareEditingIE7);
				}
			} else if (options.command === 'getContents') {
				content.children(':not(.aloha-block)').each(propBlockElements);

				// Remove trailing end br's in li's since they are not
				// necessary for rendering
				content.find('li>br:last').remove();
			}

			return content.html();
		}
	});

	return BlockElementContentHandler;
});
