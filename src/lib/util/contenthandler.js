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
	'aloha/core',
	'aloha/markup',
	'util/html'
], function (
	$,
	Aloha,
	Markup,
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

	/**
	 * Wrap contents in a div.
	 *
	 * @param {string|jQuery.<HTMLElement>} content the content to wrap
	 * @returns {jQuery.<HTMLElement>} the content wrapped in a div
	 */
	function wrapContent(content) {
		if (typeof content === 'string') {
			return $('<div>' + content + '</div>');
		}
		if (content instanceof $) {
			return $('<div>').append(content);
		}
		return null;
	}

	/**
	 * jQuery Filter function to determine if an element is an aloha-block.
	 * 
	 * @param {number} idx the index of the element
	 * @param {HTMLElement} elem the element
	 * @returns true when $(this) or one of its parents is an aloha-block element
	 */
	function notAlohaBlockFilter(idx, elem) {
		var $elem = $(elem);
		return !$elem.hasClass('aloha-block') && $elem.parents('.aloha-block').length === 0;
	}

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
		if ($elem.is('p') && $elem.parent().is('td') && $elem.siblings().length == 0) {
			// Because a single <p> wrapping the contents of a <td> is
			// initially superfluous and should be stripped out.
			$elem.contents().unwrap();
		}
		// Because Aloha table handling simply does not regard colgroups.
		// @TODO Use sanitize.js?
		if ($elem.is('colgroup')) {
			$elem.remove();
			return;
		}
		if (!$elem.is('table,tbody,th,td,tr')) {
			return;
		}
		$elem
			.removeAttr('width heigth valign');

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
		}
	}

	/**
	 * Remove comment elements.
	 *
	 * @param {jQuery.<HTMLElement>} $elem the element
	 */
	function removeComments($elem) {
		if ($elem[0].nodeType === 8) {
			$elem.remove();
		}
	}

	/**
	 * Remove style elements, and class and style attributes on elements.
	 *
	 * @param {jQuery.<HTMLElement>} $elem the element
	 */
	function removeStyles($elem) {
		if ($elem.is('style')) {
			$elem.remove();
			return;
		}
		// remove style attributes and classes
		$elem.removeAttr('style').removeClass();
	}


	/**
	 * Unwrap elements matching the given selector.
	 *
	 * @param {jQuery.<HTMLElement>} $elem The HTMLElement which will be handled.
	 * @param {string} selector a selector for elements to unwrap
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
				$elem = Markup.transformDomObject($elem, 'p').append('<br>');
			}
		}
		$elem.contents().unwrap();
	}


	/**
	 * Remove list elements and leave only its contents.
	 *
	 * See http://validator.w3.org/check with following invalid markup for
	 * example:
	 * <!DOCTYPE html><head><title></title></head><ul><li>ok</li><ol></ol></ul>
	 *
	 * @param {jQuery.<HTMLElement>} $elem the element
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
	 * Remove elements which are in different namespaces
	 * @param {jQuery.<HTMLElement>} $elem the element
	 */
	function removeNamespacedElements($elem) {
		// get all elements
		var nsPrefix = $elem[0].prefix || ($elem[0].scopeName || undefined);
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
			($.inArray(nodeType.toLowerCase(), Aloha.settings.contentHandler.allows.elements) !== -1)
		);
	}

	/**
	 * Transform formattings
	 * @param {jQuery.<HTMLElement>} $elem the element
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
				Markup.transformDomObject($elem, 'b');
			} else if ($elem[0].nodeName === 'EM') {
				// transform em to i
				Markup.transformDomObject($elem, 'i');
			} else if ($elem[0].nodeName === 'S' || $elem[0].nodeName == 'STRIKE') {
				// transform s and strike to del
				Markup.transformDomObject($elem, 'del');
			} else if ($elem[0].nodeName === 'U') {
				// transform u?
				$elem.contents().unwrap();
			}
		}
	}

	/**
	 * Check elements should be transformed.
	 *
	 * @returns true if elements should be transformed
	 */
	function isTransformFormattingsByMapping() {
		if (
			Aloha.settings.contentHandler &&
			    Aloha.settings.contentHandler.handler &&
			    Aloha.settings.contentHandler.handler.generic
		) {
			if (typeof Aloha.settings.contentHandler.handler.generic.transformFormattingsMapping !== 'undefined' &&
					Aloha.settings.contentHandler.handler.generic.transformFormattingsMapping.length >= 1
			        ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Transform elements according to mapping set in configuration
	 * Example config used for fixing Chrome 75 copy paste issues in contenteditable
	 * Chrome will try to maintain styling on the copied range.
	 * Depening on the styling of the copied element this may lead to <b> elements turning into <span style="font-size: 700">
	 * Chrome is unable to copy <sub> and <sup> elements in content editable. This leads to <sub> and <sup> elements turning into spans
	 * 
	 *	Aloha.settings.contentHandler.handler.generic.transformFormattingsMapping: [
	 *		{
	 *			nodeNameIs: 'span',
	 *			nodeNameShould: 'b',
	 *			attribute: {
	 *				name: 'style',
	 *				value: 'font-weight: 700'
	 *			}
	 *		},
	 *		{
	 *			nodeNameIs: 'span',
	 *			nodeNameShould: 'sup',
	 *			attribute: {
	 *				name: 'style',
	 *				value: 'top: -0.5em'
	 *			}
	 *		},
	 *		{
	 *			nodeNameIs: 'span',
	 *			nodeNameShould: 'sub',
	 *			attribute: {
	 *				name: 'style',
	 *				value: 'bottom: -0.5em'
	 *			}
	 *		}
	 *	]
	 * @param {jQuery.<HTMLElement>} $elem the element
	 */
	function transformFormattingsByMapping($elem) {
		if (isTransformFormattingsByMapping()) {
			Aloha.settings.contentHandler.handler.generic.transformFormattingsMapping.forEach(function (mapping) {
				if (typeof mapping.nodeNameIs !== 'undefined' &&
						typeof mapping.nodeNameShould !== 'undefined' &&
						typeof mapping.attribute !== 'undefined' &&
						$elem[0].nodeName.toLowerCase() === mapping.nodeNameIs &&
						$elem[0].hasAttribute(mapping.attribute.name) &&
						$elem[0].getAttribute(mapping.attribute.name).indexOf(mapping.attribute.value) >= 0) {
					return Markup.transformDomObject($elem, mapping.nodeNameShould);
				}
			});
		}

		return $elem;
	}

	/**
	 * Replaces unnecessary new line characters within text nodes in Word HTML
	 * with a space.
	 *
	 * @param {jQuery.<HTMLElement>} $elem
	 */
	function replaceNewlines($elem) {
		if ($elem[0].nodeType === 3) {
			$elem[0].nodeValue = $elem[0].nodeValue.replace(/[\r\n]+/gm, ' ');
		}
	}

	/**
	 * Check if formattiongs should be transformed.
	 *
	 * @returns true if formattings should be transformed
	 */
	function isTransformFormatting() {
		if (
			Aloha.settings.contentHandler &&
				Aloha.settings.contentHandler.handler &&
				Aloha.settings.contentHandler.handler.generic &&
				typeof Aloha.settings.contentHandler.handler.generic.transformFormattings !== 'undefinded' &&
				!Aloha.settings.contentHandler.handler.generic.transformFormattings
		) {
			return false;
		}
		return true;
	}
	/**
	 * Apply the generic content cleanup to an HTMLElement.
	 *
	 * @param {jQuery.<HTMLElement>} $elem The HTMLElement which will be handled.
	 * @param {boolean} isTransformFormattings if formattings should be transformed
	 */
	function doGenericCleanup($elem, isTransformFormattings) {
		transformFormattingsByMapping($elem);
		// TODO: move to table plugin (when the table plugin is not available we should unwrap the tables contents)
		prepareTables($elem);
		removeComments($elem);
		// TODO we should unwrap list elements in the generic cleanup because Aloha-Editor has no way of handling
		// lists without the list plugin
		unwrapTags($elem, 'div, span, font');
		cleanLists($elem);
		removeStyles($elem);
		removeNamespacedElements($elem);
		replaceNewlines($elem);
		if (isTransformFormattings) {
			transformFormattings($elem);
		}

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
			$elem.removeAttr(attrName);
		});
	}



	return {
		wrapContent: wrapContent,
		isProppedParagraph: isProppedParagraph,
		doGenericCleanup: doGenericCleanup,
		notAlohaBlockFilter: notAlohaBlockFilter,
		isTransformFormatting: isTransformFormatting,
		removeAttributes: removeAttributes
	};
});
