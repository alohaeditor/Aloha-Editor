/* cursors.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['dom'], function Cursors(dom) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('cursors');
	}

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
	function cursor(node, atEnd) {
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
	function cursorFromBoundaryPoint(container, offset) {
		return cursor(
			dom.nodeAtOffset(container, offset),
			dom.isAtEnd(container, offset)
		);
	}

	Cursor.prototype.next = function () {
		var node = this.node;
		var next;
		if (this.atEnd || dom.Nodes.ELEMENT !== node.nodeType) {
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
				if (dom.Nodes.ELEMENT !== prev.nodeType) {
					this.atEnd = false;
				}
			} else {
				this.atEnd = false;
			}
		} else {
			prev = node.previousSibling;
			if (prev) {
				if (dom.Nodes.ELEMENT === prev.nodeType) {
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
		return dom.insert(node, this.node, this.atEnd);
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
	 * Functions for creating Cursors.  A Cursor is an abstraction of the
	 * startContainer/startOffset and endContainer/endOffset range boundary
	 * points.
	 *
	 * cursors.cursor()
	 * cursors.cursorFromBoundaryPoint()
	 */
	var exports = {
		cursor: cursor,
		cursorFromBoundaryPoint: cursorFromBoundaryPoint
	};

	exports['cursor'] = exports.cursor;
	exports['cursorFromBoundaryPoint'] = exports.cursorFromBoundaryPoint;

	return exports;
});
