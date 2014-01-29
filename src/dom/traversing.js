/* dom/traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @refernce: http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 */
define([
	'dom/nodes',
	'functions',
	'arrays'
], function DomTraversing(
	Nodes,
	Fn,
	Arrays
) {
	'use strict';

	/**
	 * Given a node, will return the node that succeeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "one" in the following DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 *			<i>
	 *				"three"
	 *			</i>
	 *		</u>
	 *		"four"
	 *	</b>
	 *	"five"
	 *
	 * forward() will return nodes in the following order:
	 *
	 * <b>, "two", <u>, <i>, "three", "four", "five"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The succeeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function forward(node) {
		if (node.firstChild) {
			return node.firstChild;
		}
		var next = node;
		while (next && !next.nextSibling) {
			next = next.parentNode;
		}
		return next && next.nextSibling;
	}

	/**
	 * Given a node, will return the node that preceeds it in the document
	 * order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * text node "five" in the below DOM tree:
	 *
	 *	"one"
	 *	<b>
	 *		"two"
	 *		<u>
	 *			<i>
	 *				"three"
	 *			</i>
	 *		</u>
	 *		"four"
	 *	</b>
	 *	"five"
	 *
	 * backward() will return nodes in the following order:
	 *
	 * "four", "three", <i>, <u>, "two", <b>, "one"
	 *
	 * @param {DOMObject} node
	 * @return {DOMObject}
	 *         The preceeding node or null if the given node has no previous
	 *         siblings and no parent.
	 */
	function backward(node) {
		var prev = node.previousSibling;
		while (prev && prev.lastChild) {
			prev = prev.lastChild;
		}
		return prev || node.parentNode;
	}

	/**
	 * Finds the first node for which `match` returns true by traversing through
	 * `step`.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 * @param {Function(DOMObject):DOMObject} step
	 * @return {DOMObject}
	 */
	function find(node, match, until, step) {
		until = until || Fn.returnFalse;
		if (until(node)) {
			return null;
		}
		do {
			node = step(node);
			if (!node || until(node)) {
				return null;
			}
			if (match(node)) {
				return node;
			}
		} while (node);
		return null;
	}

	/**
	 * Finds the first DOM object, ahead of the given node which matches the
	 * predicate `match` but before `until` returns true for any node that is
	 * traversed during the search, in which case null is returned.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 * @return {DOMObject}
	 */
	function findForward(node, match, until) {
		return find(node, match, until, forward);
	}

	/**
	 * Finds the first DOM object, behind the given node which matches the
	 * predicate `match`.  If `until` returns true the given node, for any other
	 * node during traversal, null is returned.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 * @return {DOMObject}
	 */
	function findBackward(node, match, until) {
		return find(node, match, until, backward);
	}

	function nextSibling(node) {
		return node.nextSibling;
	}

	function prevSibling(node) {
		return node.previousSibling;
	}

	function parent(node) {
		return node.parentNode;
	}

	function stepWhile(node, step, cond, arg) {
		while (node && cond(node, arg)) {
			node = step(node, arg);
		}
		return node;
	}

	function stepNextWhile(node, step, next, cond, arg) {
		return stepWhile(node, function (node) {
			var n = next(node);
			step(node, arg);
			return n;
		}, cond, arg);
	}

	function stepNextUntil(node, step, next, until, arg) {
		return stepNextWhile(node, step, next, Fn.complement(until), arg);
	}

	/**
	 * Starting from the given node and moving forward, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or the last sibling of `node`'s parent element is reached.
	 *
	 * @param  {Node} node
	 * @param  {Function(Node, *?):boolean} cond
	 * @param  {*} arg Optional arbitrary value that will be passed to `cond()`
	 * @return {Node}
	 */
	function nextWhile(node, cond, arg) {
		return stepWhile(node, nextSibling, cond, arg);
	}

	/**
	 * Starting from the given node and moving backwards, traverses the set of
	 * `node`'s sibilings until either the predicate `cond` returns false or we
	 * reach the last sibling of `node`'s parent element.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *?):Boolean} cond
	 * @param {*} arg
	 *        Optional arbitrary value that will be passed to the `cond()`
	 *        predicate.
	 * @return {DOMObject}
	 *         `node`, or one if it's previous siblings.
	 */
	function prevWhile(node, cond, arg) {
		return stepWhile(node, prevSibling, cond, arg);
	}

	function upWhile(node, cond) {
		return stepWhile(node, parent, cond);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and
	 * it's next siblings, until the given `until()` function retuns `true` or
	 * all next siblings have been walked.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} func
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {Function(DOMObject, *):Boolean} until
	 *        Predicate function to test each traversed nodes.  Walking will be
	 *        terminated when this function returns `true`.  Will receive the
	 *        each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walkUntil(node, func, until, arg) {
		stepNextUntil(node, func, nextSibling, until, arg);
	}

	/**
	 * Climbs up the given node's ancestors until the predicate until() returns
	 * true.  Starting with the given node, applies func() to each node in the
	 * traversal.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject)} func
	 * @param {Function(DOMObject):Boolean} until
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function climbUntil(node, func, until, arg) {
		stepNextUntil(node, func, parent, until, arg);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and all
	 * it's next siblings.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walk(node, func, arg) {
		walkUntil(node, func, Fn.returnFalse, arg);
	}

	/**
	 * Depth-first postwalk of the given DOM node.
	 */
	function walkRec(node, func, arg) {
		if (Nodes.isElementNode(node)) {
			walk(node.firstChild, function (node) {
				walkRec(node, func, arg);
			});
		}
		func(node, arg);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and
	 * it's next siblings, until `untilNode` is encountered or the last sibling
	 * is reached.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject, *)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {DOMObject} untilNode
	 *        Terminal node.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 */
	function walkUntilNode(node, func, untilNode, arg) {
		walkUntil(node, func, function (nextNode) {
			return nextNode === untilNode;
		}, arg);
	}

	/**
	 * Traverses up the given node's ancestors, collecting all parent nodes,
	 * until the given predicate returns true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent elements of the given node.
	 */
	function parentsUntil(node, pred) {
		var parents = [];
		var parent = node.parentNode;
		while (parent && !pred(parent)) {
			parents.push(parent);
			parent = parent.parentNode;
		}
		return parents;
	}

	/**
	 * Starting with the given node, traverses up the given node's ancestors,
	 * collecting each parent node, until the first ancestor that causes the
	 * given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function parentsUntilIncl(node, pred) {
		var parents = parentsUntil(node, pred);
		var topmost = parents.length ? parents[parents.length - 1] : node;
		if (topmost.parentNode) {
			parents.push(topmost.parentNode);
		}
		return parents;
	}

	/**
	 * Collects all ancestors of the given node until the first ancestor that
	 * causes the given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntil(node, pred) {
		if (pred(node)) {
			return [];
		}
		var parents = parentsUntil(node, pred);
		parents.unshift(node);
		return parents;
	}

	/**
	 * Collects the given node, and all its ancestors until the first ancestor
	 * that causes the given predicate function to return true.
	 *
	 * @param {DOMObject} node
	 * @param {Function(DOMObject):Boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilIncl(node, pred) {
		if (pred(node)) {
			return [node];
		}
		var parents = parentsUntilIncl(node, pred);
		parents.unshift(node);
		return parents;
	}

	/**
	 * Collects all ancestors of the given node until `untilNode` is reached.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} untilNode
	 *        Terminal ancestor.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilNode(node, untilNode) {
		return childAndParentsUntil(node, function (nextNode) {
			return nextNode === untilNode;
		});
	}

	/**
	 * Collects the given node, and all its ancestors until `untilInclNode` is
	 * reached.
	 *
	 * @param {DOMObject} node
	 * @param {DOMObject} untilInclNode
	 *        Terminal ancestor.  Will be included in results.
	 * @return {Array[DOMObject]}
	 *         A set of parent element of the given node.
	 */
	function childAndParentsUntilInclNode(node, untilInclNode) {
		return childAndParentsUntilIncl(node, function (nextNode) {
			return nextNode === untilInclNode;
		});
	}

	/**
	 * Returns the nearest node (in the document order) to the given node that
	 * is not an ancestor.
	 *
	 * @param {DOMObject} start
	 * @param {Boolean} previous
	 *        If true, will look for the nearest preceding node, otherwise the
	 *        nearest subsequent node.
	 * @param {Function(DOMObject):Boolean} match
	 * @param {Function(DOMObject):Boolean} until
	 *        (Optional) Predicate, which will be applied to each node in the
	 *        traversal step.  If this function returns true, traversal will
	 *        terminal and will return null.
	 * @return {DOMObject}
	 */
	function nextNonAncestor(start, previous, match, until) {
		match = match || Fn.returnTrue;
		until = until || Fn.returnFalse;
		var next;
		var node = start;
		while (node) {
			next = previous ? node.previousSibling : node.nextSibling;
			if (next) {
				if (until(next)) {
					return null;
				}
				if (match(next)) {
					return next;
				}
				node = next;
			} else {
				if (!node.parentNode || until(node.parentNode)) {
					return null;
				}
				node = node.parentNode;
			}
		}
	}

	/**
	 * Executes a query selection (-all) in the given context and returns a
	 * non-live list of results.
	 *
	 * @param  {string} selector
	 * @param  {Element} context
	 * @return {Array.<Node>}
	 */
	function query(selector, context) {
		return Arrays.coerce(context.querySelectorAll(selector));
	}

	/**
	 * Returns a non-live list of the given node and all it's subsequent
	 * siblings until the predicate returns true.
	 *
	 * @param  {Node} node
	 * @param  {function(Node):boolean}
	 * @return {Array.<Node>}
	 */
	function nextSiblings(node, until) {
		var nodes = [];
		walkUntil(node, function (next) {
			nodes.push(next);
		}, until || Fn.returnFalse);
		return nodes;
	}

	return {
		query                        : query,
		nextSiblings                 : nextSiblings,
		nextWhile                    : nextWhile,
		prevWhile                    : prevWhile,
		upWhile                      : upWhile,
		walk                         : walk,
		walkRec                      : walkRec,
		walkUntil                    : walkUntil,
		walkUntilNode                : walkUntilNode,
		findBackward                 : findBackward,
		findForward                  : findForward,
		climbUntil                   : climbUntil,
		childAndParentsUntil         : childAndParentsUntil,
		childAndParentsUntilIncl     : childAndParentsUntilIncl,
		childAndParentsUntilNode     : childAndParentsUntilNode,
		childAndParentsUntilInclNode : childAndParentsUntilInclNode,
		nextNonAncestor              : nextNonAncestor,
		nextSibling                  : nextSibling
	};
});
