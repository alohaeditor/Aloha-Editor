define([
	'jquery',
	'util/dom',
	'util/dom2',
	'util/html',
	'aloha/ephemera'
], function (
	$,
	DomLegacy,
	Dom,
	Html,
	Ephemera
) {
	'use strict';

	/**
	 * Class name for landing element.
	 */
	var LANDING_ELEMENT_CLASS = 'aloha-caret-landing';

	/**
	 * Check if a white space span should be removed
	 *
	 * @param {DOMElement} node where the white space span has been inserted
	 * @returns {Boolean}
	 */
	function isObsoleteLandingNode(node) {
		return 'SPAN' === node.nodeName
		    && (node.childNodes.length === 0 || node.innerHTML === '&nbsp;');
	}
	
	/**
	 * Creates unique class name for `$blockELement`.
	 */
	function createLandingClassName ($blockElement) {
		return LANDING_ELEMENT_CLASS + '_' + $blockElement.attr('id');
	}

	/**
	 * Creates landing element.
	 * @return {HTMLElement}
	 */
	function createLandingElement($blockElement) {
		var node = document.createElement('span');
		node.className = createLandingClassName($blockElement);
		node.appendChild(document.createTextNode('\u00A0'));
		
		Ephemera.markWhiteSpaceWrapper(node);
		
		return node;
	}

	function isVisibleNode(node) {
		return (Html.isBlock(node) || Dom.isTextNode(node))
		    && !Html.isUnrenderedNode(node);
	}

	function skipNodeForward(node) {
		return Dom.forward(node.lastChild || node);
	}

	/**
	 * Pads the given block element with landing areas at the beginning and end
	 * of the block. This allows the editor to place the caret next to an inline
	 * block elements.
	 *
	 * @param {jQuery<DOMElement>} $block
	 */
	function pad($block) {
		var previous = Dom.findBackward(
			Dom.backward($block[0]),
			isVisibleNode,
			function(node) {
				return Html.isBlock(node) || DomLegacy.isEditingHost(node);
			}
		);
		if (!previous) {
			$block.before(createLandingElement($block));
		}
		var next = Dom.findForward(
			skipNodeForward($block[0]),
			isVisibleNode,
			function (node) {
				return Html.isBlock(node) || DomLegacy.isEditingHost(node) || (
					node.previousSibling
					&&
					DomLegacy.isEditingHost(node.previousSibling)
				);
			}
		);
		if (!next) {
			$block.after(createLandingElement($block));
		}
	}

	/**
	 * Removes the landing nodes inserted by the pad() function.
	 *
	 * @param {jQuery<DOMElement>} $block
	 */
	function unpad($block) {
		var className = createLandingClassName($block);
		$('.' + className).each(function (index, elem) {
			if (Html.hasOnlyWhiteSpaceChildren(elem)) {
				elem.parentNode.removeChild(elem);
			} else {
				$(elem.childNodes).unwrap();
			}
		});
	}

	/**
	 * Tests whether the given element is contained in an editable for
	 * which the block dragdrop feature is enabled.
	 *
	 * @param {!jQuery} $element
	 *        The element that may or may not be contained in an editable.
	 * @return {Boolean}
	 *        True, unless the given $element is contained in an
	 *        editable for which the dragdrop feature has been disabled.
	 */
	function isDragdropEnabledForElement($element) {
		var $editable = $element.closest('.aloha-editable');
		if ($editable.length) {
			return !!$editable.data('block-dragdrop');
		}
		// no editable specified, let's make drag & drop enabled by default.
		return true;
	}

    /**
     * Get the parent editable of the block $block
     *
     * @param {jQuery Element} $block
     * @returns {jQuery Element}
     */
    function getEditableByBlock($block) {
        return $block.parents('.aloha-editable').filter(':first');
    }

	/**
	 * Check if a block element is a table.
	 *
	 * @param {jQuery Element} $blockElement
	 * @returns {Boolean} true if it is a table, false otherwise
	 */
	function isTable($blockElement) {
		return $blockElement.hasClass('aloha-table-wrapper');
	}

    /**
     * Get table inside the block or null if this block is not for a table
     *
     * @param $block
     * @returns {jQuery Element} jQuery table or null if this block
     * is not for a Table
     */
    function getTableByBlock($block) {
        return isTable($block)? $block.find('table').filter(':first') : null;
    }

	/**
	 * Checks if `$blockElement` is an inline block element.
	 * @param {Element} $blockElement
	 * @return {boolean}
	 */
	function isInlineBlock($blockElement) {
		return $blockElement[0].nodeName === 'SPAN';
	}

	/**
	 * Helper which traverses the DOM tree starting from el and wraps all non-empty texts with spans,
	 * such that they can act as drop target.
	 *
	 * @param {DomElement} el
	 */
	function traverseDomTreeAndWrapCharactersWithSpans(el) {
		var child;
		var i, l;
		for(i=0, l=el.childNodes.length; i < l; i++) {
			child = el.childNodes[i];
			if (child.nodeType === 1) { // DOM Nodes
				if (!~child.className.indexOf('aloha-block') && child.attributes['data-i'] === undefined) {
					// We only recurse if child does NOT have the class "aloha-block", and is NOT data-i
					traverseDomTreeAndWrapCharactersWithSpans(child);
				} else if (child.attributes['data-i']) {
					// data-i set -> we have converted this hierarchy level already --> early return!
					return;
				}
			} else if (child.nodeType === 3) { // Text Nodes
				var numberOfSpansInserted = insertSpans(child);
				i += numberOfSpansInserted;
				l += numberOfSpansInserted;
			}
		}
	}

	/**
	 * Helper which splits text on word boundaries, adding whitespaces to the following element.
	 * Examples:
	 * - "Hello world" -> ["Hello", " world"]
	 * - " Hello world" -> [" Hello", " world"]
	 * --> see the unit tests for the specification
	 */
	function splitText(text) {
		var textParts = text.split(/(?=\b)/);
		var cleanedTextParts = [];

		var isWhitespace = false;
		var i,l;

		for (i=0,l=textParts.length; i<l; i++) {
			if (!/[^\t\n\r ]/.test(textParts[i])) {
				// if the current text part is just whitespace, we add a flag...
				isWhitespace = true;
			} else {
				if (isWhitespace) {
					// we have a whitespace to add
					cleanedTextParts.push(' ' + textParts[i]);
					isWhitespace = false;
				} else {
					cleanedTextParts.push(textParts[i]);
				}
			}
		}
		if (isWhitespace) {
			cleanedTextParts[cleanedTextParts.length - 1] += ' ';
		}
		return cleanedTextParts;
	}


	/**
	 * This is a helper for traverseDomTreeAndWrapCharactersWithSpans,
	 * performing the actual conversion.
	 *
	 * This function returns the number of additional DOM elements inserted.
	 * This is "numberOfSpansCreated - 1" (because one text node has been initially there)
	 */
	function insertSpans(el) {
		var text = el.nodeValue;

		// If node just contains empty strings, we do not do anything.
		// Use ECMA-262 Edition 3 String and RegExp features
		if (!/[^\t\n\r ]/.test(text)) {
			return 0;
		}
		var newNodes = document.createDocumentFragment();

		var splittedText = splitText(text);

		var l = splittedText.length;
		var x, word, leftWordPartLength, t;
		var numberOfSpansInserted = 0;
		var i;

		for (i=0; i<l; i++) {
			// left half of word
			word = splittedText[i];
			if (word.length === 0) {
				continue;
			}
			// We use "floor" here such that sentence delimiters like "!" can have a block placed afterwards
			leftWordPartLength = Math.floor(word.length/2);

			// For Internet Explorer, we only make dropping AFTER words possible to improve performance
			var browserMajorVersion = parseInt(jQuery.browser.version, 10);
			if (jQuery.browser.msie && (7 === browserMajorVersion || 8 === browserMajorVersion)) {
				leftWordPartLength = 0;
			}

			if (leftWordPartLength > 0) {
				x = document.createElement('span');
				x.appendChild(document.createTextNode(word.substr(0, leftWordPartLength)));
				x.setAttribute('data-i', i);

				newNodes.appendChild(x);
				numberOfSpansInserted++;
			}

			// right half of word
			x = document.createElement('span');
			t = word.substr(leftWordPartLength);
			x.appendChild(document.createTextNode(t));
			x.setAttribute('data-i', i);
			x.setAttribute('class', 'aloha-block-droppable-right');

			newNodes.appendChild(x);
			numberOfSpansInserted++;
		}
		el.parentNode.replaceChild(newNodes, el);
		return numberOfSpansInserted-1;
	}

	return {
		pad: pad,
		unpad: unpad,
		isDragdropEnabledForElement: isDragdropEnabledForElement,
		isTable: isTable,
		getEditableByBlock: getEditableByBlock,
		getTableByBlock: getTableByBlock,
		isInlineBlock: isInlineBlock,
		traverseDomTreeAndWrapCharactersWithSpans: traverseDomTreeAndWrapCharactersWithSpans,
		splitText: splitText
	};
});
