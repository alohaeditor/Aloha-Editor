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
		return 'SPAN' === node.nodeName &&
			(node.childNodes.length === 0 || node.innerHTML === '&nbsp;');
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
		var node;

		// This is a bit of an ugly hack, but since we allow tags
		// consisting of inline-block DIVs we have to wrap those
		// with other DIVs to ensure valid HTML markup and not
		// disturb for example the autoparagraph plugin.
		if ($blockElement.is('div')) {
			node = document.createElement('div');
			node.style.display = 'inline-block';
		} else {
			node = document.createElement('span');
		}

		node.className = createLandingClassName($blockElement);
		node.appendChild(document.createTextNode('\u00A0'));

		Ephemera.markWhiteSpaceWrapper(node);

		return node;
	}

	/**
	 * Check if a node is an Aloha-Block
	 * @param  {HTMLElement}  node the HTML-node to check
	 * @return {boolean}      true if the node is a block
	 */
	function isAlohaBlock(node) {
		return $(node).data('aloha-block-type') || false;
	}

	function isVisibleNode(node) {
		return (Html.isBlock(node) || Dom.isTextNode(node)) &&
			!Html.isUnrenderedNode(node);
	}

	/**
	 * Go forward in the dom while ignoring the starting node completely
	 *
	 * @param  {HTMLElement} node the element to start from
	 * @return {HTMLElement}      the next element
	 */
	function skipNodeForward(node) {
		if (node.lastChild) {
			return skipNodeForward(node.lastChild);
		} else {
			return Dom.forward(node);
		}
	}

	/**
	 * When creating the padding for inline blocks this function is used to determine how far to go
	 * forward or backward in the dom structure.
	 *
	 * @param  {HTMLElement} node the HTML-node to check
	 * @return {boolean}      true if the node is line-break ('br'), a block element or the editing host itself
	 */
	function untilNode(node) {
		return /^(br|td|th)$/.test(node.nodeName.toLowerCase()) || Html.isBlock(node) || DomLegacy.isEditingHost(node);
	}

	/**
	 * When creating the padding for inline blocks this function is used to determine how far to go
	 * forward in the dom structure. This function calls untilNode() internally.
	 *
	 * @param  {HTMLElement} node the HTML-node to check
	 * @return {boolean}      true if untilNode() returns true or the node is an Aloha-Block
	 */
	function untilNodeForward(node) {
		return untilNode(node) || node.nodeName.toLowerCase() === 'li' || (node.previousSibling && DomLegacy.isEditingHost(node.previousSibling)) || isAlohaBlock(node);
	}

	/**
	 * Pads the given block element with landing areas at the beginning and end
	 * of the block. This allows the editor to place the caret next to an inline
	 * block elements.
	 *
	 * @param {jQuery<DOMElement>} $block
	 */
	function pad($block) {
		if (DomLegacy.isBlockNode($block[0])) {
			return;
		}

		// first check, whether the padding already exists (previous or next sibling with
		// the a class named landingClassName)
		var landingClassName = createLandingClassName($block), previous, next;

		if ($block.prev('.' + landingClassName).length === 0) {
			previous = Dom.findBackward(
					Dom.backward($block[0]),
					isVisibleNode,
					untilNode
			);
			if (!previous) {
				$block.before(createLandingElement($block));
			}
		}
		if ($block.next('.' + landingClassName).length === 0) {
			next = Dom.findForward(
					skipNodeForward($block[0]),
					isVisibleNode,
					untilNodeForward
			);
			if (!next) {
				$block.after(createLandingElement($block));
			}
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
	 * Get table inside the block or null if this block is not for a table
	 *
	 * @param $block
	 * @returns {jQuery Element} jQuery table or null if this block
	 * is not for a Table
	 */
	function getTableByBlock($block) {
		return isTable($block) ? $block.find('table').filter(':first') : null;
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

	return {
		pad: pad,
		unpad: unpad,
		isDragdropEnabledForElement: isDragdropEnabledForElement,
        isTable: isTable,
        getEditableByBlock: getEditableByBlock,
        getTableByBlock: getTableByBlock
	};
});
