/**
 * dom/mutation.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom/nodes',
	'functions',
	'arrays'
], function DomMutation(
	Nodes,
	Fn,
	Arrays
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
	 * Insert node at end of destination.
	 *
	 * @param {Element} destination
	 * @param {Node}    node
	 */
	function append(node, destination) {
		insert(node, destination, true);
	}

	/**
	 * Moves the list of nodes into the end of destination element, until
	 * `until` returns true.
	 *
	 * @param  {Element}                destination
	 * @param  {Array.<Nodes>}          nodes
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Nodes>}          The nodes that were not moved
	 */
	function move(nodes, destination, until) {
		var end = Arrays.someIndex(nodes, until || Fn.returnFalse);
		end = -1 === end ? nodes.length : end + 1;
		nodes.slice(0, end).forEach(function (node) {
			append(node, destination);
		});
		return nodes.slice(end);
	}

	/**
	 * Copies the list of nodes into a destination element, until `until`
	 * returns true.
	 *
	 * @param  {Element}                destination
	 * @param  {Array.<Nodes>}          nodes
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Nodes>}          The nodes that were not moved
	 */
	function copy(nodes, destination, until) {
		var end = Arrays.someIndex(nodes, until || Fn.returnFalse);
		end = -1 === end ? nodes.length : end + 1;
		nodes.slice(0, end).forEach(function (node) {
			append(Nodes.clone(node), destination);
		});
		return nodes.slice(end);
	}

	/**
	 * Moves the list of nodes before the reference element, until `until`
	 * returns true.
	 *
	 * @param  {Element}                reference
	 * @param  {Array.<Nodes>}          nodes
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Nodes>}          The nodes that were not moved
	 */
	function moveBefore(reference, nodes, until) {
		var end = Arrays.someIndex(nodes, until || Fn.returnFalse);
		end = -1 === end ? nodes.length : end + 1;
		nodes.slice(0, end).forEach(function (node) {
			insert(node, reference, false);
		});
		return nodes.slice(end);
	}

	/**
	 * Replaces the given node with `replacement`.
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
	 * The element that replaces `element` will receive all of the given
	 * element's content.
	 *
	 * @param  {Element} element
	 * @param  {Element} replacement
	 */
	function replaceShallow(element, replacement) {
		move(Nodes.children(element), replacement);
		replace(element, replacement);
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
		moveBefore(node, Nodes.children(node));
		remove(node);
	}

	/**
	 * Wraps `node` in given `wrapper` element.
	 *
	 * @param {Node}    node
	 * @param {Element} wrapper
	 */
	function wrap(node, wrapper) {
		append(replace(node, wrapper), wrapper);
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

	return {
		append            : append,
		merge             : merge,
		moveNextAll       : moveNextAll,
		moveBefore        : moveBefore,
		move              : move,
		copy              : copy,
		wrap              : wrap,
		wrapWith          : wrapWith,
		insert            : insert,
		insertAfter       : insertAfter,
		replace           : replace,
		replaceShallow    : replaceShallow,
		remove            : remove,
		removeShallow     : removeShallow
	};
});
