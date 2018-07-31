/*!
* Aloha Editor
* Author & Copyright (c) 2012-2013 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*
* @overview
* Utility functions for content handling.
*/
define([
	'jquery',
	'util/html'
], function (
	$,
	Html
) {
	'use strict';

	/**
	 * Checks whether the markup describes a paragraph that is propped by
	 * a <br> tag but is otherwise empty.
	 *
	 * Will return true for:
	 *
	 * <p id="foo"><br class="bar" /></p>
	 *
	 * as well as:
	 *
	 * <p><br></p>
	 *
	 * @param {string} html Markup
	 * @return {boolean} True if html describes a propped paragraph.
	 */
	function isProppedParagraph(html) {
		var trimmed = $.trim(html);
		if (!trimmed) {
			return false;
		}
		var div = $('<div>' + trimmed + '</div>')[0];
		var first = div.firstChild;
		var containsSingleP = first === div.lastChild && 'P' === first.nodeName;
		if (!containsSingleP) {
			return false;
		}
		var $visible = $(first.childNodes).filter(function (i, node) {
			return Html.isRenderedNode(node);
		});
		return $visible.length === 1 && $visible[0].nodeName === 'BR';
	}

	function wrapContent(content) {
		if (typeof content === 'string') {
			return $('<div>' + content + '</div>');
		}
		if (content instanceof $) {
			return $('<div>').append(content);
		}
		return null;
	}

	function notAlohaBlockFilter() {
		var $elem = $(this);
		return !$elem.hasClass('aloha-block') && $elem.parents('.aloha-block').length === 0;
	};


	/**
	 * Transforms all tables in the given content to make them ready to for
	 * use with Aloha's table handling.
	 *
	 * Cleans tables of their unwanted attributes.
	 * Normalizes table cells.
	 *
	 * @param {jQuery.<HTMLElement>} $elem the element
	 */
	function prepareTables($elem) {
		// Because Aloha table handling simply does not regard colgroups.
		// @TODO Use sanitize.js?
		if ($elem.is('colgroup')) {
			$elem.remove();
			return;
		}
		if (!$elem.is('table,th,td,tr')) {
			return;
		}
		$elem
			.removeAttr('width heigth valign')

		// Because Aloha does not provide a way for the editor to
		// manipulate borders, cellspacing, cellpadding in tables.
		// @todo what about width, height?
		if ($elem.is('table')) {
			$elem
				.removeAttr('cellpadding cellspacing border border-top border-bottom border-left border-right');
		}
		
		if ($elem.is('td')) {
			// Because cells with a single empty <p> are rendered to appear
			// like empty cells, it simplifies the handeling of cells to
			// normalize these table cells to contain actual white space
			// instead.
			if (isProppedParagraph($elem.html())) {
				$elem.html('&nbsp;');
			}

			// Because a single <p> wrapping the contents of a <td> is
			// initially superfluous and should be stripped out.
			var $p = $('>p', $elem);
			if (1 === $p.length) {
				$p.contents().unwrap();
			}
		}
	}

	/**
	 * Remove all comments
	 * @param content
	 */
	function removeComments($elem) {
		if ($elem[0].nodeType === 8) {
			$elem.remove();
		}
	}

	/**
	 * Remove styles
	 * @param content
	 */
	function removeStyles($elem) {
		if ($elem.is('style')) {
			$elem.remove();
			return;
		};
		// remove style attributes and classes
		$elem.removeAttr('style').removeClass();
	}
	

	/**
	 * Remove some unwanted tags from content paste
	 * @param {jQuery.<HTMLElement>} $elem The HTMLElement which will be
	 *                         		handled.
	 * @param selector the tags to unwrap
	 * @return boolean false when the element
	 */
	function unwrapTags($elem, selector) {
		// Note: we exclude all elements (they will be spans) here, that have the class aloha-wai-lang
		if (!$elem.is(selector) || $elem.hasClass('.aloha-wai-lang')) {
			return;
		}
		
		// TODO find a better solution for this (e.g. invent a more generic aloha class for all elements, that are
		// somehow maintained by aloha, and are therefore allowed)
		if ($elem.is('div')) {
			// safari and chrome cleanup for plain text paste with working linebreaks
			if ($elem[0].innerHTML !== '<br>') {
				$elem = Aloha.Markup.transformDomObject($elem, 'p').append('<br>');
			}
		}
		$elem.contents().unwrap();
	}


	/**
	 * Remove all list elements and leave only its contents.
	 *
	 * See http://validator.w3.org/check with following invalid markup for
	 * example:
	 * <!DOCTYPE html><head><title></title></head><ul><li>ok</li><ol></ol></ul>
	 *
	 * @param {jQuery.<HTMLElement>} $content
	 */
	function cleanLists($elem) {
		if ($elem.parent().is('ul,ol') && !$elem.is('li')) {
			$elem.remove();
			return;
		}
		// Remove paragraphs and headers inside list elements
		// This has been observed to happen with Word documents
		if ($elem.closest('li').length > 0 && $elem.is('p,h1,h2,h3,h4,h5,h6')) {
			if (!$elem.is(':last-child') && !$elem.contents().last().is('br')) {
				$elem.append('<br>');
			}
			$elem.contents().unwrap();
		}
	}

	/**
	 * Remove all elements which are in different namespaces
	 * @param content
	 */
	function removeNamespacedElements($elem) {
		// get all elements
		var nsPrefix = $elem[0].prefix ? $elem[0].prefix
				: ($elem[0].scopeName ? $elem[0].scopeName : undefined);
		// when the prefix is set (and different from 'HTML'), we remove the
		// element
		if ((nsPrefix && nsPrefix !== 'HTML') || $elem[0].nodeName.indexOf(':') >= 0) {
			var $contents = $elem.contents();
			if ($contents.length) {
				// the element has contents, so unwrap the contents
				$contents.unwrap();
			} else {
				// the element is empty, so remove it
				$elem.remove();
			}
		}
	}
	/**
	 * Tags used for semantic formatting
	 * @type {Array.<String>}
	 * @see GenericContentHandler#transformFormattings
	 */
	var formattingTags = ['strong', 'em', 's', 'u', 'strike'];
	
	/**
	 * Return true if the nodeType is allowed in the settings,
	 * Aloha.settings.contentHandler.allows.elements
	 * 
	 * @param {String} nodeType	The tag name of the element to evaluate
	 * 
	 * @return {Boolean}
	 */
	function isAllowedNodeName(nodeType) {
		return !!(
			Aloha.settings.contentHandler &&
			Aloha.settings.contentHandler.allows &&
			Aloha.settings.contentHandler.allows.elements &&
			($.inArray(
		              nodeType.toLowerCase(), 
				      Aloha.settings.contentHandler.allows.elements
				         ) !== -1
			   )
		);
	}

	/**
	 * Transform formattings
	 * @param content
	 */
	function transformFormattings($elem) {
		// find all formattings we will transform
		// @todo this makes troubles -- don't change semantics! at least in this way...

		var selectors = [],
			i;

		for (i = 0; i < formattingTags.length; i++) {
			if (!isAllowedNodeName(formattingTags[i])) {
				selectors.push(formattingTags[i]);
			}
		}

		if ($elem.is(selectors.join(','))) {
			if ($elem[0].nodeName === 'STRONG') {
				// transform strong to b
				Aloha.Markup.transformDomObject($elem, 'b');
			} else if ($elem[0].nodeName === 'EM') {
				// transform em to i
				Aloha.Markup.transformDomObject($elem, 'i');
			} else if ($elem[0].nodeName === 'S' || $elem[0].nodeName == 'STRIKE') {
				// transform s and strike to del
				Aloha.Markup.transformDomObject($elem, 'del');
			} else if ($elem[0].nodeName === 'U') {
				// transform u?
				$elem.contents().unwrap();
			}
		}
	}


	/**
	 * Replaces unnecessary new line characters within text nodes in Word HTML
	 * with a space.
	 *
	 * @param {jQuery.<HTMLElement>} $content
	 */
	function replaceNewlines($elem) {
		if ($elem[0].nodeType === 3) {
			$elem[0].nodeValue = $elem[0].nodeValue.replace(/[\r\n]+/gm, ' ');
		}
	}

	function isTransformFormatting() {
		if (Aloha.settings.contentHandler &&
			Aloha.settings.contentHandler.handler &&
			Aloha.settings.contentHandler.handler.generic &&
			typeof Aloha.settings.contentHandler.handler.generic.transformFormattings !== 'undefinded' &&
			!Aloha.settings.contentHandler.handler.generic.transformFormattings) {
			return false;
		}
		return true;
	}	
	/**
	 * Do generic cleanup recursivley
	 */
	function doGenericCleanupRecursivley($elements) {
		var transformFormatting = isTransformFormatting();
		$elements.filter(notAlohaBlockFilter).each(function () {
			var $elem = $(this);
			var $contents = $elem.contents();
			doGenericCleanup($elem, transformFormatting);
			doGenericCleanupRecursivley($contents);
		});
	} 
	/**
	 * Apply the generic content cleanup to an HTMLElement.
	 * 
 	 * @param {jQuery.<HTMLElement>} $elem The HTMLElement which will be
	 *                         		handled.
	 * @param {boolean} isTransformFormattings if formattings should be transformed
	 */
	function doGenericCleanup($elem, isTransformFormattings) {
		// TODO: move to table plugin (when the table plugin is not available we should unwarp the tables contents)
		prepareTables($elem);
		removeComments($elem);
		// we unwrap list elements in the generic cleanup because Aloha-Editor has no way of handling
		// lists wihtout the list plugin   
		unwrapTags($elem, 'div, span, font');
		cleanLists($elem);
		removeStyles($elem);
		removeNamespacedElements($elem);
		if (isTransformFormattings) {
			transformFormattings($elem);
		}
		replaceNewlines($elem);
	}
	/**
	 * Remove all attributes from an element, but preserving those
	 * which are explicitly allowed.
	 * 
 	 * @param {jQuery.<HTMLElement>} $elem The HTMLElement for which the attributes should be removed
	 * @param {Array.<string>} allowed a list of allowed attributes which will not be removed
	 */
	function removeAttributes($elem, allowed) {
		if ($elem.length < 1) {
			return;
		}
		var attributes = $.map($elem[0].attributes, function (attr) {
			return attr.name;
		}).filter(function (attrName) {
			if (Array.isArray(allowed) && allowed.indexOf(attrName) !== -1) {
				return false;
			}
			return true;
		});
		$.each(attributes, function (idx, attrName) {
			$elem.removeAttr(attrName)
		});
	}
	   


	return {
		wrapContent: wrapContent,
		isProppedParagraph: isProppedParagraph,
		doGenericCleanup: doGenericCleanup,
		doGenericCleanupRecursivley: doGenericCleanupRecursivley,
		notAlohaBlockFilter: notAlohaBlockFilter,
		isTransformFormatting: isTransformFormatting,
		removeAttributes: removeAttributes
	};
});
