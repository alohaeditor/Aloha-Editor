define([
	'util/dom',
	'util/dom2',
	'util/html'
], function (
	DomLegacy,
	Dom,
	Html
) {
	'use strict';

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

	function createLandingElement() {
		var node = document.createElement('span');
		node.appendChild(document.createTextNode('\u00A0'));
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
			DomLegacy.isEditingHost
		);
		if (!previous) {
			$block.before(createLandingElement());
		}
		var next = Dom.findForward(
			skipNodeForward($block[0]),
			isVisibleNode,
			function (node) {
				return DomLegacy.isEditingHost(node) || (
					node.previousSibling
					&&
					DomLegacy.isEditingHost(node.previousSibling)
				);
			}
		);
		if (!next) {
			$block.after(createLandingElement());
		}
	}

	/**
	 * Removes the landing nodes inserted by the pad() function.
	 *
	 * @param {jQuery<DOMElement>} $block
	 */
	function unpad($block) {
		var previous = $block[0].previousSibling;
		var next = $block[0].nextSibling;
		if (previous && isObsoleteLandingNode(previous)) {
			previous.parentNode.removeChild(previous);
		}
		if (next && isObsoleteLandingNode(next)) {
			next.parentNode.removeChild(next);
		}
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

	return {
		pad: pad,
		unpad: unpad,
		isDragdropEnabledForElement: isDragdropEnabledForElement
	};
});
