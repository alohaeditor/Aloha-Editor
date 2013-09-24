define([
], function(

	) {

	/**
	 * Check if a node type TEXT_NODE is empty.
	 * @param {DOM Element} node
	 */
	function isEmptyOrNullTextNode(node) {
		return (node !== null && node.nodeType === 3 &&
			    node.nodeValue.match(/^\s*$/) !== null);
	}

	/**
	 * Check if a white space span should be inserted
	 *
	 * @param {DOM Element} node where the white space span should be inserted
	 * @param {text} spanId to compare with
	 * @returns {boolean}
	 */
	function isInsertableSpanWhiteSpace(node, spanId) {
		return node === null ||
			(node.nodeName !== 'SPAN' &&
			(node.nodeType !== 3 || isEmptyOrNullTextNode(node)));
	}

	/**
	 * Check if a white space span should be removed
	 *
	 * @param {DOM Element} node where the white space span has been inserted
	 * @param {text} spanId to compare with
	 * @returns {boolean}
	 */
	function isRemovableSpanWhiteSpace(node, spanId) {
		if (node !== null && node.nodeName === 'SPAN') {
			if (node.innerHTML.length === 0 || node.innerHTML === '&nbsp;') {
				return true;
			}
		}
		return false;
	}

	/**
	 * Add WHITE SPACE at the beginning and at the end of the Block, so the
	 * user can insert text after the block.
	 * For inline components like <span>, the focus of the caret when click outside the
	 * inline component, make the caret be positioned at the end of the content of the
	 * inline component instead of at the end of the inline component.
	 *
	 * We have the next span element
	 * <span>aloha-editor</span>
	 *
	 * When clicked outside caret at then end of the span's content
	 * <span>aloha-editor{|}</span>
	 *
	 * but we want the caret at the end of the span
	 * <span>aloha-editor</span>{|}
	 *
	 * @private
	 * @param {jQuery<DOMElement>} $block
	 */
	function addWhiteSpacesAfterAndBefore($block) {
		var span = document.createElement('span');
		span.appendChild(document.createTextNode('\u00A0'));
		var spanId = "span-" + $block.attr('id');
		span.id = spanId;

		var prevSibling = $block[0].previousSibling;
		var nextSibling = $block[0].nextSibling;

		if (isInsertableSpanWhiteSpace(prevSibling, spanId)) {
			$block.before(span.cloneNode(true));
		}

		if (isInsertableSpanWhiteSpace(nextSibling, spanId)) {
			$block.after(span.cloneNode(true));
		}
	}


	/**
	 * Removes the white space inserted by the function _addWhiteSpacesAfterAndBeforeBlock.
	 * It removes the white space only if there is nothing after of before the white space
	 *
	 * @param {jQuery<DOMElement>} $block
	 */
	function removeWhiteSpacesAfterAndBefore($block) {
		var prevSibling = $block[0].previousSibling;
		var nextSibling = $block[0].nextSibling;

		var spanId = "span-" + $block.attr('id');
		var parent = prevSibling.parentNode;

		if (isRemovableSpanWhiteSpace(prevSibling, spanId)) {
			parent.removeChild(prevSibling);
		}

		if (isRemovableSpanWhiteSpace(nextSibling, spanId)) {
			parent.removeChild(nextSibling);
		}
	}

	/**
	 * Tests whether the given element is contained in an editable for
	 * which the block dragdrop feature is enabled.
	 *
	 * @param {!jQuery} $element
	 *        The element that may or may not be contained in an editable.
	 * @return {boolean}
	 *        True, unless the given $element is contained in an
	 *        editable for which the dragdrop feature has been disabled.
	 */
	function isDragdropEnabledForElement($element) {
		var editable = $element.closest(".aloha-editable");
		if (editable.length) {
			return !!editable.data("block-dragdrop");
		} else {
			// no editable specified, let's make drag & drop enabled by default.
			return true;
		}
	}

	return {
		addWhiteSpacesAfterAndBefore: addWhiteSpacesAfterAndBefore,
		removeWhiteSpacesAfterAndBefore: removeWhiteSpacesAfterAndBefore,
		isDragdropEnabledForElement: isDragdropEnabledForElement
	}
});