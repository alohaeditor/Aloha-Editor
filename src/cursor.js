define(['../src/dom'], function CursorAPI(Dom) {
	'use strict';

	function Cursor(node, atEnd) {
		this.node = node;
		this.atEnd = atEnd;
	}

	/**
	 * A cursor has the added utility over other iteration methods of iterating
	 * over the end position of an element. The start and end positions of an
	 * element are immediately before the element and immediately after the last
	 * child respectively. All node positions except end positions can be
	 * identified just by a node. To distinguish between element start and end
	 * positions, the additional atEnd boolean is necessary.
	 */
	function cursor(node, atEnd) {
		return new Cursor(node, atEnd);
	}

	/**
	 * Creates a new cursor from the given container and offset.
	 *
	 * @param offset if container is a text node, the offset will be ignored.
	 * @param container if a text node, should have a parent node.
	 */
	function cursorFromBoundaryPoint(container, offset) {
		return cursor(
			Dom.nodeAtOffset(container, offset),
			Dom.isAtEnd(container, offset)
		);
	}

	Cursor.prototype.next = function () {
		var node = this.node;
		var next;
		if (this.atEnd || Dom.Nodes.ELEMENT_NODE !== node.nodeType) {
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
			} else {
				this.atEnd = false;
			}
		} else {
			prev = node.previousSibling;
			if (prev) {
				if (Dom.Nodes.ELEMENT_NODE === node.nodeType) {
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
		return cursor(this.node, this.atEnd);
	};

	Cursor.prototype.insert = function (node) {
		return Dom.insert(node, this.node, this.atEnd);
	};

	return {
		cursor: cursor,
		cursorFromBoundaryPoint: cursorFromBoundaryPoint
	};

});
