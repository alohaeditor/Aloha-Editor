define([
], function(

	) {
	return {
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
		addWhiteSpacesAfterAndBefore: function($block) {
			var whiteSpaces = '\u00A0';
			var emptySpaces = '\u200B';

			var prevSibling = $block[0].previousSibling;
			var nextSibling = $block[0].nextSibling;

			var whiteSpaceNodeCompare = document.createTextNode(whiteSpaces);

			if (prevSibling === null || prevSibling.nodeValue.trim().length === 0 && !prevSibling.isEqualNode(whiteSpaceNodeCompare) ) {
				if (prevSibling !== null) {
					//prevSibling contains blank space, we delete it
					prevSibling.parentNode.removeChild(prevSibling);
				}
				// Separate the node to compare from other node.
				$block.before(document.createTextNode(emptySpaces));
				$block.before(document.createTextNode(whiteSpaces));
			}

			if (nextSibling === null || nextSibling.nodeValue.trim().length === 0 && !nextSibling.isEqualNode(whiteSpaceNodeCompare) ) {
				if (nextSibling !== null) {
					//nextSibling contains blank space, we delete it
					nextSibling.parentNode.removeChild(nextSibling);
				}
				// Separate the node to compare from other node.
				$block.after(document.createTextNode(emptySpaces));
				$block.after(document.createTextNode(whiteSpaces));
			}
		},

		/**
		 * Check if the node is null or contains empty string
		 *
		 * @param {DOMElement} node
		 * @returns {boolean} true is node is empty or is null
		 */
		isNodeEmptyOrNull: function(node) {
			if (node === null || node.nodeValue.trim().length === 0)
				return true;
			return false;
		},

		/**
		 * Removes the white space inserted by the function _addWhiteSpacesAfterAndBeforeBlock.
		 * It removes the white space only if there is nothing after of before the white space
		 *
		 * @private
		 * @param {jQuery<DOMElement>} $block
		 */
		removeWhiteSpacesAfterAndBefore: function($block) {
			var whiteSpaces = '\u00A0';
			var whiteSpaceNodeCompare = document.createTextNode(whiteSpaces);

			var prevSibling = $block[0].previousSibling;
			var nextSibling = $block[0].nextSibling;

			var parent = prevSibling.parentNode;
			if (prevSibling.isEqualNode(whiteSpaceNodeCompare) &&
				this.isNodeEmptyOrNull(prevSibling.previousSibling)) {
				parent.removeChild(prevSibling);
			}
			if (nextSibling.isEqualNode(whiteSpaceNodeCompare) &&
				this.isNodeEmptyOrNull(nextSibling.nextSibling)) {
				parent.removeChild(nextSibling);
			}
		},

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
		isDragdropEnabledForElement: function ($element) {
			var editable = $element.closest(".aloha-editable");
			if (editable.length) {
				return !!editable.data("block-dragdrop");
			} else {
				// no editable specified, let's make drag & drop enabled by default.
				return true;
			}
		}
	}
});