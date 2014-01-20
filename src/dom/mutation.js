/**
 * dom/mutation.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'functions'
], function DomMutation(
	Nodes,
	Fn
) {
	'use strict';

	/**
	 * Inserts the given node before `ref`, unless `atEnd` is true, in which
	 * case `node` is inserted at the end of `ref` children nodes.
	 *
	 * @param {Node}    node
	 * @param {Node}    ref
	 * @param {boolean} atEnd
	 */
	function insert(node, ref, atEnd) {
		if (atEnd) {
			ref.appendChild(node);
		} else {
			ref.parentNode.insertBefore(node, ref);
		}
	}

	/**
	 * Inserts the given node after `ref`.
	 *
	 * @param {Node} node
	 * @param {Node} ref
	 */
	function insertAfter(node, ref) {
		insert(node, ref.nextSibling || ref.parentNode, !ref.nextSibling);
	}

	/**
	 * Like insertBefore, inserts node `first` into `parent` before
	 * `reference`, except that it also inserts all the following siblings of
	 * `first`.
	 *
	 * @param {Element} parent
	 * @param {Node}    first
	 * @param {Node}    reference
	 */
	function moveNextAll(parent, first, reference) {
		var next;
		while (first) {
			next = first.nextSibling;
			parent.insertBefore(first, reference);
			first = next;
		}
	}

	/**
	 * Moves the given node, and all subsequent nextSiblings until `until` for
	 * any of these sibling, into the end of `container`.
	 *
	 * @param  {Element}                   node
	 * @param  {Element}                   container
	 * @param  {Function(Element):boolean} until
	 * @return {!Element}
	 */
	function moveSiblingsInto(node, container, until) {
		var next;
		until = until || Fn.returnFalse;
		while (node && node !== container && !until(node)) {
			next = node.nextSibling;
			insert(node, container, true);
			node = next;
		}
		return node;
	}

	/**
	 * Moves the given node, and all subsequent nextSiblings until `until` for
	 * any of these sibling, after `ref`.
	 *
	 * @param  {Element}                   node
	 * @param  {Element}                   ref
	 * @param  {Function(Element):boolean} until
	 * @return {Element}
	 */
	function moveSiblingsAfter(node, ref, until) {
		var next;
		until = until || Fn.returnFalse;
		while (node && node !== ref && !until(node)) {
			next = node.nextSibling;
			insertAfter(node, ref);
			// Because endless loop detected.
			if (next === ref) {
				return null;
			}
			ref = node;
			node = next;
		}
		return node;
	}

	/**
	 * Wraps node `node` in given node `wrapper`.
	 *
	 * @param {Node}    node
	 * @param {Element} wrapper
	 */
	function wrap(node, wrapper) {
		node.parentNode.replaceChild(wrapper, node);
		wrapper.appendChild(node);
	}

	/**
	 * Wrap the node with a `nodeName` element.
	 *
	 * @param {Element} node
	 * @param {string}  nodeName
	 */
	function wrapWith(node, nodeName) {
		var wrapper = node.ownerDocument.createElement(nodeName);
		wrap(node, wrapper);
		return wrapper;
	}

	/**
	 * Detaches the given node.
	 *
	 * @param {Node} node
	 */
	function remove(node) {
		node.parentNode.removeChild(node);
	}

	/**
	 * Removes the given node while keeping it's content intact.
	 *
	 * @param {Node} node
	 */
	function removeShallow(node) {
		var parent = node.parentNode;
		moveNextAll(parent, node.firstChild, node);
		parent.removeChild(node);
	}

	/**
	 * Merges all contents of `right` into `left` by appending them to the end
	 * of `left`, and then removing `right`.
	 *
	 * Will not merge text nodes since this would require that ranges be
	 * preserved.
	 *
	 * @param {Node} left
	 * @param {Node} right
	 */
	function merge(left, right) {
		var next;
		while (left && right && (left.nodeName === right.nodeName)) {
			if (Nodes.isTextNode(left)) {
				return;
			}
			next = right.firstChild;
			moveNextAll(left, next, null);
			remove(right);
			if (!next) {
				return;
			}
			right = next;
			left = right.previousSibling;
		}
	}

	/**
	 * Replaces one node with another in the DOM.
	 *
	 * @param  {Node} node
	 * @param  {Node} replacement
	 * @return {Node} Replaced node
	 */
	function replace(node, replacement) {
		return node.parentNode.replaceChild(replacement, node);
	}

	/**
	 * Replaces the given element while preserving its contents.
	 *
	 * This function facilitates re-wrapping of contents from one element to
	 * another.
	 *
	 * The element that replaces `elem` will receive all of the given element's
	 * Content.
	 *
	 * @param {Element} elem 
	 * @param {Element} replacement
	 */
	function replaceShallow(elem, replacement) {
		moveNextAll(replacement, elem.firstChild, null);
		insert(replacement, elem);
		remove(elem);
	}

	return {
		merge             : merge,
		moveNextAll       : moveNextAll,
		moveSiblingsInto  : moveSiblingsInto,
		moveSiblingsAfter : moveSiblingsAfter,
		wrap              : wrap,
		wrapWith          : wrapWith,
		insert            : insert,
		insertAfter       : insertAfter,
		replace           : replace,
		replaceShallow    : replaceShallow,
		remove            : remove,
		removeShallow     : removeShallow,
	};
});
