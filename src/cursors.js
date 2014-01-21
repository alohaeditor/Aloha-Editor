/**
 * cursors.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'boundaries'
], function Cursors(
	Dom,
	Boundaries
) {
	'use strict';

	/**
	 * Cursor abstraction of the startContainer/startOffset and
	 * endContainer/endOffset range boundary points.
	 *
	 * @type {Cursor}
	 */
	function Cursor(node, atEnd) {
		this.node = node;
		this.atEnd = atEnd;
	}

	/**
	 * Creates a cursor instance.
	 *
	 * A cursor has the added utility over other iteration methods of iterating
	 * over the end position of an element. The start and end positions of an
	 * element are immediately before the element and immediately after the last
	 * child respectively. All node positions except end positions can be
	 * identified just by a node. To distinguish between element start and end
	 * positions, the additional atEnd boolean is necessary.
	 *
	 * @param {DOMElement} node
	 *        The container in which the cursor is in.
	 * @param {Boolean} atEnd
	 *        Whether or not the cursor is at the end of the container.
	 * @return {Cursor}
	 */
	function create(node, atEnd) {
		return new Cursor(node, atEnd);
	}

	/**
	 * Creates a new cursor from the given container and offset.
	 *
	 * @param {DOMElement} container
	 *        If a text node, should have a parent node.
	 * @param {Number} offset
	 *        If container is a text node, the offset will be ignored.
	 * @return {Cursor}
	 */
	function createFromBoundary(container, offset) {
		return create(
			Dom.nodeAtOffset(container, offset),
			Boundaries.isAtEnd(Boundaries.raw(container, offset))
		);
	}

	Cursor.prototype.next = function () {
		var node = this.node;
		var next;
		if (this.atEnd || !Dom.isElementNode(node)) {
			next = node.nextSibling;
			if (next) {
				this.atEnd = false;
			} else {
				next = node.parentNode;
				if (!next) {
					return false;
				}
				this.atEnd = true;
			}
			this.node = next;
		} else {
			next = node.firstChild;
			if (next) {
				this.node = next;
			} else {
				this.atEnd = true;
			}
		}
		return true;
	};

	Cursor.prototype.prev = function () {
		var node = this.node;
		var prev;
		if (this.atEnd) {
			prev = node.lastChild;
			if (prev) {
				this.node = prev;
				if (!Dom.isElementNode(prev)) {
					this.atEnd = false;
				}
			} else {
				this.atEnd = false;
			}
		} else {
			prev = node.previousSibling;
			if (prev) {
				if (Dom.isElementNode(prev)) {
					this.atEnd = true;
				}
			} else {
				prev = node.parentNode;
				if (!prev) {
					return false;
				}
			}
			this.node = prev;
		}
		return true;
	};

	Cursor.prototype.skipPrev = function (cursor) {
		var prev = this.prevSibling();
		if (prev) {
			this.node = prev;
			this.atEnd = false;
			return true;
		}
		return this.prev();
	};

	Cursor.prototype.skipNext = function (cursor) {
		if (this.atEnd) {
			return this.next();
		}
		this.atEnd = true;
		return this.next();
	};

	Cursor.prototype.nextWhile = function (cond) {
		while (cond(this)) {
			if (!this.next()) {
				return false;
			}
		}
		return true;
	};

	Cursor.prototype.prevWhile = function (cond) {
		while (cond(this)) {
			if (!this.prev()) {
				return false;
			}
		}
		return true;
	};

	Cursor.prototype.parent = function () {
		return this.atEnd ? this.node : this.node.parentNode;
	};

	Cursor.prototype.prevSibling = function () {
		return this.atEnd ? this.node.lastChild : this.node.previousSibling;
	};

	Cursor.prototype.nextSibling = function () {
		return this.atEnd ? null : this.node.nextSibling;
	};

	Cursor.prototype.equals = function (cursor) {
		return cursor.node === this.node && cursor.atEnd === this.atEnd;
	};

	Cursor.prototype.setFrom = function (cursor) {
		this.node = cursor.node;
		this.atEnd = cursor.atEnd;
	};

	Cursor.prototype.clone = function () {
		return create(this.node, this.atEnd);
	};

	Cursor.prototype.insert = function (node) {
		return Dom.insert(node, this.node, this.atEnd);
	};

	Cursor.prototype['next'] = Cursor.prototype.next;
	Cursor.prototype['prev'] = Cursor.prototype.prev;
	Cursor.prototype['skipPrev'] = Cursor.prototype.skipPrev;
	Cursor.prototype['skipNext'] = Cursor.prototype.skipNext;
	Cursor.prototype['nextWhile'] = Cursor.prototype.nextWhile;
	Cursor.prototype['prevWhile'] = Cursor.prototype.prevWhile;
	Cursor.prototype['parent'] = Cursor.prototype.parent;
	Cursor.prototype['prevSibling'] = Cursor.prototype.prevSibling;
	Cursor.prototype['nextSibling'] = Cursor.prototype.nextSibling;
	Cursor.prototype['equals'] = Cursor.prototype.equals;
	Cursor.prototype['setFrom'] = Cursor.prototype.setFrom;
	Cursor.prototype['clone'] = Cursor.prototype.clone;
	Cursor.prototype['insert'] = Cursor.prototype.insert;

	/**
	 * Sets the start boundary of a given range from the given range position.
	 *
	 * @param {Cursor} pos
	 * @param {Range} range
	 * @return {Range}
	 *         The modified range.
	 */
	function setRangeStart(range, pos) {
		if (pos.atEnd) {
			range.setStart(pos.node, Dom.nodeLength(pos.node));
		} else {
			range.setStart(pos.node.parentNode, Dom.nodeIndex(pos.node));
		}
		return range;
	}

	/**
	 * Sets the end boundary of a given range from the given range position.
	 *
	 * @param {Range} range
	 * @param {Cursor} pos
	 * @return {Range}
	 *         The given range, having been modified.
	 */
	function setRangeEnd(range, pos) {
		if (pos.atEnd) {
			range.setEnd(pos.node, Dom.nodeLength(pos.node));
		} else {
			range.setEnd(pos.node.parentNode, Dom.nodeIndex(pos.node));
		}
		return range;
	}

	/**
	 * Transforms a cursor to a boundary.
	 * @param {Cursor} cursor
	 * @return {Boundary}
	 */
	function toBoundary(cursor) {
		if (cursor.atEnd) {
			return Boundaries.create(cursor.node, Dom.nodeLength(cursor.node));
		}
		return Boundaries.create(cursor.node.parentNode, Dom.nodeIndex(cursor.node));
	}

	/**
	 * Sets the startContainer/startOffset and endContainer/endOffset boundary
	 * points of the given range, based on the given start and end Cursors.
	 *
	 * @param {Range} range
	 * @param {Cursor} start
	 * @param {Cursor} end
	 * @return {Range}
	 *         The given range, having had its boundary points modified.
	 */
	function setToRange(range, start, end) {
		if (start) {
			setRangeStart(range, start);
		}
		if (end) {
			setRangeEnd(range, end);
		}
		return range;
	}

	return {
		cursor                  : create,
		cursorFromBoundaryPoint : createFromBoundary,
		create                  : create,
		createFromBoundary      : createFromBoundary,
		setToRange              : setToRange,
		setRangeStart           : setRangeStart,
		setRangeEnd             : setRangeEnd,
		toBoundary              : toBoundary
	};
});
