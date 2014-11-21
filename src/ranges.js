/**
 * ranges.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @see
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#deleting-the-selection
 */
define(['dom', 'arrays'], function (Dom, Arrays) {
	'use strict';

	/**
	 * Creates a range object with boundaries defined by containers, and offsets
	 * in those containers.
	 *
	 * @param  {!Element} sc
	 * @param  {number}   so
	 * @param  {!Element} ec
	 * @param  {number}   eo
	 * @return {Range}
	 */
	function create(sc, so, ec, eo) {
		var range = sc.ownerDocument.createRange();
		range.setStart(sc, so || 0);
		if (ec) {
			range.setEnd(ec, eo || 0);
		} else {
			range.setEnd(sc, so || 0);
		}
		return range;
	}

	/**
	 * Creates a range from the horizontal and vertical offset pixel positions
	 * relative to upper-left corner the document body.
	 *
	 * Returns a collapsed range for the position where the text insertion
	 * indicator would be rendered.
	 *
	 * @see
	 * http://dev.w3.org/csswg/cssom-view/#dom-document-caretpositionfrompoint
	 * http://stackoverflow.com/questions/3189812/creating-a-collapsed-range-from-a-pixel-position-in-ff-webkit
	 * http://jsfiddle.net/timdown/ABjQP/8/
	 * http://lists.w3.org/Archives/Public/public-webapps/2009OctDec/0113.html
	 *
	 * @private
	 * @param  {number}    x
	 * @param  {number}    y
	 * @param  {!Document} doc
	 * @return {?Range}
	 */
	function fromPoint(x, y, doc) {
		if (x < 0 || y < 0) {
			return null;
		}
		if (doc['caretRangeFromPoint']) {
			return doc['caretRangeFromPoint'](x, y);
		}
		if (doc.caretPositionFromPoint) {
			var pos = doc.caretPositionFromPoint(x, y);
			return create(pos.offsetNode, pos.offset);
		}
		if (doc.elementFromPoint) {
			return fromPointIE(x, y, doc);
		}

		throw 'fromPoint() unimplemented for this browser';
	}

	/**
	 * Returns whether x and y are inside or above the given
	 * rectangle as created by range.getClientRects()
	 * @see http://jsfiddle.net/timdown/ABjQP/8/
	 *
	 * @param {int} x
	 * @param {int} y
	 * @param {Rectangle} rect
	 * @return {boolean}
	 */
	function pointIsInOrAboveRect(x, y, rect) {
		return y < rect.bottom && x >= rect.left && x <= rect.right;
	}

	/**
	 * Transforms a collapsed range into mockup
	 * client rectange object, by exchanging the
	 * left property with the provided one.
	 *
	 * @see stepTextNode
	 *
	 * @param  {Range} range
	 * @param  {?int}  left
	 * @return {Object|null}
	 */
	function collapsedRangeToRect(range, left) {
		var clientRect = Arrays.last(range.getClientRects());
		if (!clientRect) {
			return null;
		}
		return {
			left   : left || clientRect.left,
			right  : clientRect.right,
			bottom : clientRect.bottom
		};
	}

	/**
	 * Will extend a range inside node until it covers
	 * x and y and then return an offset object containing
	 * the offset node and the actual offset index.
	 * The method will call itself recursively, using the
	 * lastLeft parameter, which holds the left offset from
	 * the last iteration. Don't pass lastLeft when calling
	 * the function yourself.
	 *
	 * Because client rectangle calculation (range.getClientRects)
	 * is broken in Internet Explorer 11, this function will 
	 * use a collapsed range to match the x and y positions 
	 * and create a rectangle using the lastLeft parameter
	 * internally. Not using this approach will lead to bogus
	 * results for range.getClientRects when clicking inside
	 * an text node thats nested inside an li element.
	 *
	 * @param  {!Node} node
	 * @param  {!Range} range
	 * @param  {!integer} offset
	 * @param  {!integer} x
	 * @param  {!integer} y
	 * @param  {?integer} lastLeft
	 */
	function stepTextNode(node, range, offset, x, y, lastLeft) {
		range.setStart(node, offset);
		range.setEnd(node, offset);
		var rect = collapsedRangeToRect(range, lastLeft);
		if (rect && pointIsInOrAboveRect(x, y, rect)) {
			if (rect.right - x > x - rect.left) {
				offset--;
			}
			return {
				node  : node,
				index : offset
			};
		}
		if (offset < node.length) {
			return stepTextNode(node, range, ++offset, x, y, rect ? rect.left : null);
		} 
		return null;
	}

	/**
	 * Will extend range inside a node until it covers 
	 * the x & y position to return an offset object
	 * that contains an offset node and the offset itself
	 *
	 * @param  {!Node}    node
	 * @param  {!Range}   range
	 * @param  {!integer} x
	 * @param  {!integer} y
	 * @return {Object}
	 */
	function findOffset(node, range, x, y) {
		if (Dom.isTextNode(node)) {
			var offset = stepTextNode(node, range, 0, x, y);
			if (offset) {
				return offset;
			}
		} else {
			range.setEndAfter(node);
			var rect = Arrays.last(range.getClientRects());
			if (rect && pointIsInOrAboveRect(x, y, rect)) {
				return {
					node  : node.parentNode,
					index : Dom.nodeIndex(node)
				};
			}
		}

		if (node.nextSibling) {
			return findOffset(node.nextSibling, range, x, y);
		}

		return {
			node  : node.parentNode,
			index : Dom.nodeIndex(node)
		};
	}

	/**
	 * Creates a Range object from click coordinates 
	 * x and y on the document. Meant to be a drop-in
	 * replacement for @see fromPoint which works in
	 * Internet Explorer
	 *
	 * Based on http://jsfiddle.net/timdown/ABjQP/8/
	 *
	 * @param  {!integer}  x
	 * @param  {!integer}  y
	 * @param  {!Document} doc
	 * @return {Range}
	 */
	function fromPointIE(x, y, doc) {
		var el = doc.elementFromPoint(x, y);
		var range = doc.createRange();
		var offset = {
			node  : el.firstChild,
			index : -1
		};

		range.selectNodeContents(el);
		range.collapse(true);

		if (!offset.node) {
			offset = {
				node  : el.parentNode,
				index : Dom.nodeIndex(el)
			};
		} else {
			offset = findOffset(offset.node, range, x, y);
		}
		return create(offset.node, offset.index);
	}


	/**
	 * Gets the given node's nearest non-editable parent.
	 *
	 * @private
	 * @param  {!Node} node
	 * @return {?Element}
	 */
	function parentBlock(node) {
		var block = Dom.isEditable(node) ? Dom.editingHost(node) : node;
		var parent = Dom.upWhile(block, function (node) {
			return node.parentNode && !Dom.isEditable(node.parentNode);
		});
		return (Dom.Nodes.DOCUMENT === parent.nodeType) ? null : parent;
	}

	/**
	 * Derives a range from the horizontal and vertical offset pixel positions
	 * relative to upper-left corner of the document that is visible within the
	 * view port.
	 *
	 * It is important that the x, y coordinates given are not only within the
	 * dimensions of the document, but also viewport (ie: they are visible on
	 * the screen).
	 *
	 * Returns null if no suitable range can be determined from within an
	 * editable.
	 *
	 * @param  {number}    x
	 * @param  {number}    y
	 * @param  {!Document} doc
	 * @return {?Range}
	 */
	function fromPosition(x, y, doc) {
		x -= Dom.scrollLeft(doc);
		y -= Dom.scrollTop(doc);
		var range = fromPoint(x, y, doc);
		if (!range) {
			return null;
		}
		if (Dom.isEditableNode(range.commonAncestorContainer)) {
			return range;
		}
		var block = parentBlock(range.commonAncestorContainer);
		if (!block || !block.parentNode) {
			return null;
		}
		var body = doc.body;
		var offsets = Dom.offset(block);
		var offset = Dom.nodeIndex(block);
		var pointX = x + body.scrollLeft;
		var blockX = offsets.left + body.scrollLeft + block.offsetWidth;
		if (pointX > blockX) {
			offset += 1;
		}
		return create(block.parentNode, offset);
	}

	/**
	 * Checks whether two ranges are equal. Ranges are equal if their
	 * corresponding boundary containers and offsets are strictly equal.
	 *
	 * @param  {Range} a
	 * @param  {Range} b
	 * @return {boolean}
	 */
	function equals(a, b) {
		return a.startContainer === b.startContainer
			&& a.startOffset    === b.startOffset
			&& a.endContainer   === b.endContainer
			&& a.endOffset      === b.endOffset;
	}

	/**
	 * returns true if obj is a Range as created by document.createRange()
	 *
	 * @param  {*} obj
	 * @return {boolean}
	 * @memberOf selections
	 */
	function is(obj) {
		if (obj &&
			obj.hasOwnProperty &&
			obj.hasOwnProperty('commonAncestorContainer') &&
			obj.hasOwnProperty('collapsed') &&
			obj.hasOwnProperty('startContainer') &&
			obj.hasOwnProperty('startOffset')) {
			return true;
		}
		return false;
	}

	return {
		is           : is,
		equals       : equals,
		create       : create,
		fromPosition : fromPosition
	};
});
