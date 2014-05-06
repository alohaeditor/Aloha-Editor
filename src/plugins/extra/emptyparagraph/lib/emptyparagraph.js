define([
	'jquery',
	'util/dom',
	'util/dom2',
	'util/html'
], function (
	jQuery,
	Dom,
	Dom2,
	Html
) {
	'use strict';
	
	var EMPTY_ELEMENT_CSS_CLASS= 'aloha-empty-element';

	/**
	 * Checks if contains empty visible elements
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function containEmptyVisibleElements(node) {
		return node.getElementsByTagName('IMG').length !== 0;
	}

	/**
	 * Returns a new node with the BR elements removed.
	 * @param {Node} node
	 * @returns {Node}
	 */
	function cloneAndRemoveBRElements(node) {
		var clone = jQuery(node).clone();
		clone.find('br').remove();
		return clone[0];
	}

	/**
	 * Returns all the empty paragraph from `node`. A paragraphs with only
	 * BR elements is also an empty one
	 * @param {Node} node
	 * @params {String} elements selector with the elements that could be empty.
	 * @returns {Array}
	 */
	function getEmptyElements(node, elements) {
		var paragraphs = [];

		jQuery(node).find(joinWithComma(elements)).each(function() {
			var paragraph = cloneAndRemoveBRElements(this);

			if (Dom.isEmpty(paragraph) && !containEmptyVisibleElements(paragraph)) {
				paragraphs.push(this);
			}
		});

		return paragraphs;
	}

	/**
	 * Deletes `elements`
	 * @param {Array<Node>} elements
	 */
	function deleteElements(elements) {
		var i,
		    len;

		for (i = 0, len = elements.length; i < len; i++) {
			Dom2.remove(elements[i]);
		}
	}

	/**
	 * Removes empty paragraph.
	 * @param {Node} node
	 */
	function removeEmptyElements(node, elements) {
		removeCSSClassEmptyElement(node);
		deleteElements(getEmptyElements(node, elements));
	}

	/**
	 * Transforms an array to a string separated by commas.
	 * @param {Array<String>} elements
	 * @returns {string}
	 */
	function joinWithComma(elements) {
		return elements.join();
	}
	
	/**
	 * Checks if `node` is the first child.
	 * @param {Node} node
	 */
	function isFirstChild (node) {
		return node.parentNode.firstChild === node;
	}

	/**
	 * Gets consecutive br's
	 * @param {Node} node
	 * @returns {Array<Node>}
	 */
	function getConsecutiveBr(node) {
		var brs = [];

		jQuery(node).find('BR').each(function() {
			var node = Html.findNodeLeft(this.nextSibling, function (node) {
				return (Html.isRenderedNode(node) && !Dom.isEmpty(node)) || node.nodeName === 'BR';
			});

			if ((node && node.nodeName === 'BR') || isFirstChild(this)) {
				brs.push(this);
			}
		});

		return brs;
	}

	/**
	 * Removes highlight of empty elements.
	 * @param {Node} node
	 */
	function removeCSSClassEmptyElement(node) {
		jQuery(node).find('.'  + EMPTY_ELEMENT_CSS_CLASS)
		            .removeClass(EMPTY_ELEMENT_CSS_CLASS);
	}

	/**
	 * Highlights empty elements
	 * @param node
	 */
	function addCSSClassEmptyElements(node, elements) {
		var emptyElements = getEmptyElements(node, elements);

		jQuery.each(emptyElements, function(i, paragraph) {
			jQuery(paragraph).addClass(EMPTY_ELEMENT_CSS_CLASS);
		});
	}

	/**
	 * Removes consecutive br's
	 * @param {Node} node
	 */
	function removeConsecutiveBr(node) {
		deleteElements(getConsecutiveBr(node));
	}

	/**
	 * Highlights disallowed elements inside `node`.
	 * @param {Node} node
	 */
	function highlightEmptyElements(node, elements) {
		removeCSSClassEmptyElement(node);
		addCSSClassEmptyElements(node, elements);
	}

	return {
		EMPTY_ELEMENT_CSS_CLASS: EMPTY_ELEMENT_CSS_CLASS,

		highlightEmptyElements: highlightEmptyElements,

		getEmptyElements: getEmptyElements,
		removeEmptyElements: removeEmptyElements,
		getConsecutiveBr: getConsecutiveBr,
		removeConsecutiveBr: removeConsecutiveBr
	};
});
