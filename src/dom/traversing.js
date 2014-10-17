/* dom/traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference:
 * 	http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 *	https://en.wikipedia.org/wiki/Tree_traversal#Pre-order
 */
define([
	'dom/nodes',
	'functions',
	'arrays'
], function (
	Nodes,
	Fn,
	Arrays
) {
	'use strict';

	/**
	 * Given a node, will return the node that succeeds it in the document order.
	 *
	 * For example, if this function is called recursively, starting from the
	 * DIV root node in the following DOM tree:
	 *<pre>
	 *	<div>
	 *		"one"
	 *		<b>
	 *			"two"
	 *			<u>
	 *				<i>
	 *					"three"
	 *				</i>
	 *			</u>
	 *			"four"
	 *		</b>
	 *		"five"
	 *	</div>
	 *</pre>
	 * forward() will return nodes in the following order:
	 *
	 * "one" <b>, "two", <u>, <i>, "three", "four", "five"
	 *
	 * This is depth-first pre-order traversal:
	 * https://en.wikipedia.org/wiki/Tree_traversal#Pre-order
	 *<pre>
	 *      <div>
	 *      / | \
	 *    /   |   \
	 *  one  <b>  five
	 *      / | \
	 *    /   |   \
	 *  two  <u>  four
	 *        |
	 *       <i>
	 *        |
	 *      three
	 *</pre>
	 * @param  {!Node} node
	 * @return {?Node}
	 * @memberOf dom
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
	 * This backwards depth-first in-order traversal:
	 * https://en.wikipedia.org/wiki/Tree_traversal#In-order
	 *
	 * For example, if this function is called recursively, starting from the
	 * DIV root node in the DOM tree below:
	 *<pre>
	 *	<div>
	 *		"one"
	 *		<b>
	 *			"two"
	 *			<u>
	 *				<i>
	 *					"three"
	 *				</i>
	 *			</u>
	 *			"four"
	 *		</b>
	 *		"five"
	 *	</div>
	 *</pre>
	 * backward() will return nodes in the following order:
	 *
	 * "five", "four", "three", <i>, <u>, "two", <b>, "one"
	 *<pre>
	 *      <div>
	 *      / | \
	 *    /   |   \
	 *  one  <b>  five
	 *      / | \
	 *    /   |   \
	 *  two  <u>  four
	 *        |
	 *       <i>
	 *        |
	 *      three
	 *</pre>
	 * @param  {!Node} node
	 * @return {?Node}
	 * @memberOf dom
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
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} match
	 * @param  {function(Node):boolean} until
	 * @param  {function(Node):Node}    step
	 * @return {Node}
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
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} match
	 * @param  {function(Node):boolean} until
	 * @return {Node}
	 * @memberOf dom
	 */
	function findForward(node, match, until) {
		return find(node, match, until, forward);
	}

	/**
	 * Finds the first DOM object, behind the given node which matches the
	 * predicate `match`.  If `until` returns true the given node, for any other
	 * node during traversal, null is returned.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} match
	 * @param  {function(Node):boolean} until
	 * @return {Node}
	 * @memberOf dom
	 */
	function findBackward(node, match, until) {
		return find(node, match, until, backward);
	}

	/**
	 * Walk backward in pre-order-backtracing traversal until the given
	 * predicate returns true.
	 *
	 * Given the following tree structure:
	 * <pre>
	 *		<div><b>one<i>two</i><b>three</div>
	 * </pre>
	 *
	 * Will encounter the nodes in the following order:
	 * div, three, b, i, two, i, one, b, div
	 *
	 * @see    https://en.wikipedia.org/wiki/Depth-first_search#Vertex_orderings
	 * @param  {!Node}                   node
	 * @param  {!function(Node):boolean} pred
	 * return  {Node}
	 */
	function backwardPreorderBacktraceUntil(node, pred) {
		var backtracing = true;
		do {
			if (!backtracing && node.lastChild) {
				node = node.lastChild;
			} else if (node.previousSibling) {
				node = node.previousSibling;
				backtracing = false;
			} else {
				node = node.parentNode;
				backtracing = true;
			}
		} while (!pred(node, backtracing));
		return node;
	}

	/**
	 * Walk forward in pre-order-backtracing traversal until the given
	 * predicate returns true.
	 *
	 * @see    https://en.wikipedia.org/wiki/Depth-first_search#Vertex_orderings
	 * @param  {!Node}                   node
	 * @param  {!function(Node):boolean} pred
	 * return  {Node}
	 */
	function forwardPreorderBacktraceUntil(node, pred) {
		var backtracing = false;
		do {
			if (!backtracing && node.firstChild) {
				node = node.firstChild;
			} else if (node.nextSibling) {
				node = node.nextSibling;
				backtracing = false;
			} else {
				node = node.parentNode;
				backtracing = true;
			}
		} while (!pred(node, backtracing));
		return node;
	}

	/**
	 * Returns the given node's next sibling.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 * @memberOf dom
	 */
	function nextSibling(node) {
		return node.nextSibling;
	}

	/**
	 * Returns the given node's previous sibling.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 * @memberOf dom
	 */
	function prevSibling(node) {
		return node.previousSibling;
	}

	/**
	 * Returns the given node's parent element.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {Element}
	 * @memberOf dom
	 */
	function parent(node) {
		return node.parentNode;
	}

	/**
	 * Returns the given node's parent element.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):Node}    step
	 * @param  {function(Node):boolean} cond
	 * @param  {*}                      arg
	 * @return {Element}
	 */
	function stepWhile(node, step, cond, arg) {
		while (node && cond(node, arg)) {
			node = step(node, arg);
		}
		return node;
	}

	/**
	 * Steps through the node tree according to `step` and `next` while the
	 * given condition is true.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node, *?)}     step
	 * @param  {function(Node):Node}    next
	 * @param  {function(Node):boolean} cond
	 * @param  {*}                      arg
	 * @return {Node}
	 */
	function stepNextWhile(node, step, next, cond, arg) {
		return stepWhile(node, function (node) {
			var n = next(node);
			step(node, arg);
			return n;
		}, cond, arg);
	}

	/**
	 * Steps through the node tree acording to `step` and `next` until the
	 * given condition is true.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node, *?)}     step
	 * @param  {function(Node):Node}    next
	 * @param  {function(Node):boolean} cond
	 * @param  {*}                      arg
	 * @return {Node}
	 * @memberOf dom
	 */
	function stepNextUntil(node, step, next, until, arg) {
		return stepNextWhile(node, step, next, Fn.complement(until), arg);
	}

	/**
	 * Starting from the given node and moving forward, traverses the set of
	 * `node`'s sibiling nodes until either the predicate `cond` returns false
	 * or the last sibling of `node`'s parent element is reached.
	 *
	 * @param  {Node}                       node
	 * @param  {function(Node, *?):boolean} cond
	 * @param  {*}                          arg Optional arbitrary value that
	 *                                          will be passed to `cond()`
	 * @return {Node}
	 * @memberOf dom
	 */
	function nextWhile(node, cond, arg) {
		return stepWhile(node, nextSibling, cond, arg);
	}

	/**
	 * Starting from the given node and moving backwards, traverses the set of
	 * `node`'s sibilings until either the predicate `cond` returns false or we
	 * reach the last sibling of `node`'s parent element.
	 *
	 * @param {Node}                       node
	 * @param {function(Node, *?):boolean} cond
	 * @param {*}                          arg Optional arbitrary value that
	 *                                         will be passed to the `cond()`
	 *                                         predicate.
	 * @return {Node}
	 * @memberOf dom
	 */
	function prevWhile(node, cond, arg) {
		return stepWhile(node, prevSibling, cond, arg);
	}

	/**
	 * Traverse up node's ancestor chain while the given condition is true.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} cond
	 * @return {Node}
	 * @memberOf dom
	 */
	function upWhile(node, cond) {
		return stepWhile(node, parent, cond);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and
	 * it's next siblings, until the given `until()` function retuns `true` or
	 * all next siblings have been walked.
	 *
	 * @param {Node} node
	 * @param {function(Node, *?)} func
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {function(Node, *?):boolean} until
	 *        Predicate function to test each traversed nodes.  Walking will be
	 *        terminated when this function returns `true`.  Will receive the
	 *        each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 * @memberOf dom
	 */
	function nextUntil(node, func, until, arg) {
		stepNextUntil(node, func, nextSibling, until, arg);
	}

	/**
	 * Like nextUntil() but in reverse.
	 * @memberOf dom
	 */
	function prevUntil(node, func, until, arg) {
		stepNextUntil(node, func, prevSibling, until, arg);
	}

	/**
	 * Climbs up the given node's ancestors until the predicate until() returns
	 * true.  Starting with the given node, applies func() to each node in the
	 * traversal.
	 *
	 * @param {Node}                   node
	 * @param {function(Node, *?)}     func
	 * @param {function(Node):boolean} until
	 * @param {*} arg
	 *        A value that will be passed to `func()` as the second argument.
	 * @memberOf dom
	 */
	function climbUntil(node, func, until, arg) {
		stepNextUntil(node, func, parent, until, arg);
	}

	/**
	 * Applies the given function `func()`, to the the given node `node` and all
	 * it's next siblings.
	 *
	 * @param {Node}               node
	 * @param {function(Node, *?)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {*}                  arg
	 *        A value that will be passed to `func()` as the second argument.
	 * @memberOf dom
	 */
	function walk(node, func, arg) {
		nextUntil(node, func, Fn.returnFalse, arg);
	}

	/**
	 * Depth-first postwalk of the given DOM node.
	 *
	 * @param  {Node}               node
	 * @param  {function(Node, *?)} func
	 * @return {*}                  arg
	 * @memberOf dom
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
	 * @param {Node}              node
	 * @param {function(Node, *)} fn
	 *        Callback function to apply to the traversed nodes.  Will receive
	 *        the each node as the first argument, and the value of `arg` as the
	 *        second argument.
	 * @param {Node} untilNode
	 *        Terminal node.
	 * @param {*}                  arg
	 *        A value that will be passed to `func()` as the second argument.
	 * @memberOf dom
	 */
	function walkUntilNode(node, func, untilNode, arg) {
		nextUntil(node, func, function (nextNode) {
			return nextNode === untilNode;
		}, arg);
	}

	/**
	 * Traverses up the given node's ancestors, collecting all parent nodes,
	 * until the given predicate returns true.
	 *
	 * @param {Node} node
	 * @param {function(Node):boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array.<Node>}
	 *         A set of parent elements of the given node.
	 * @memberOf dom
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
	 * given predicate function to return true. The given node is *not* passed
	 * to the predicate (@see childAndParents).
	 *
	 * @param {Node} node
	 * @param {function(Node):boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array.<Node>}
	 *         A set of parent element of the given node.
	 * @memberOf dom
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
	 * @param {Node} node
	 * @param {function(Node):boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array.<Node>}
	 *         A set of parent element of the given node.
	 * @memberOf dom
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
	 * @param {Node} node
	 * @param {function(Node):boolean} pred
	 *        Predicate function which will receive nodes as they are traversed.
	 *        This function returns `true`, it will terminate the traversal.
	 * @return {Array.<Node>}
	 *         A set of parent element of the given node.
	 * @memberOf dom
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
	 * @param {Node}   node
	 * @param {Node}   untilNode Terminal ancestor.
	 * @return {Array<Node>} A set of parent element of the given node.
	 * @memberOf dom
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
	 * @param {Node} node
	 * @param {Node} untilInclNode
	 *        Terminal ancestor.  Will be included in results.
	 * @return {Array.<Node>}
	 *         A set of parent element of the given node.
	 * @memberOf dom
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
	 * @param  {Node} start
	 * @param  {boolean} previous
	 *         If true, will look for the nearest preceding node, otherwise the
	 *         nearest subsequent node.
	 * @param  {function(Node):boolean} match
	 * @param  {function(Node):boolean} until
	 *         (Optional) Predicate, which will be applied to each node in the
	 *         traversal step.  If this function returns true, traversal will
	 *         terminal and will return null.
	 * @return {Node}
	 * @memberOf dom
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
	 * @param  {string}  selector
	 * @param  {Element} context
	 * @return {Array.<Node>}
	 * @memberOf dom
	 */
	function query(selector, context) {
		return Arrays.coerce(context.querySelectorAll(selector));
	}

	/**
	 * Returns a non-live list of the given node's preceeding siblings until the
	 * predicate returns true. The node one which `until` terminates is not
	 * included.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Node>}
	 * @memberOf dom
	 */
	function prevSiblings(node, until) {
		if (!node.previousSibling) {
			return [];
		}
		var nodes = [];
		prevUntil(node.previousSibling, function (next) {
			nodes.push(next);
		}, until || Fn.returnFalse);
		return nodes.reverse();
	}

	/**
	 * Returns a non-live list of the given node's subsequent siblings until the
	 * predicate returns true. The node one which `until` terminates is not
	 * included.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Node>}
	 * @memberOf dom
	 */
	function nextSiblings(node, until) {
		if (!node.nextSibling) {
			return [];
		}
		var nodes = [];
		nextUntil(node.nextSibling, function (next) {
			nodes.push(next);
		}, until || Fn.returnFalse);
		return nodes;
	}

	/**
	 * Returns a non-live list of any of the given node and it's preceeding
	 * siblings until the predicate returns true. The node one which `until`
	 * terminates is not included.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Node>}
	 * @memberOf dom
	 */
	function nodeAndPrevSiblings(node, until) {
		return (until && until(node)) ? [] : prevSiblings(node, until).concat(node);
	}

	/**
	 * Returns a non-live list of any of the given node and it's subsequent
	 * siblings until the predicate returns true. The node one which `until`
	 * terminates is not included.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Node>}
	 * @memberOf dom
	 */
	function nodeAndNextSiblings(node, until) {
		return (until && until(node)) ? [] : [node].concat(nextSiblings(node, until));
	}

	return {
		query                        : query,

		nextNonAncestor              : nextNonAncestor,

		nextUntil                    : nextUntil,
		nextWhile                    : nextWhile,
		nextSibling                  : nextSibling,
		nextSiblings                 : nextSiblings,

		prevUntil                    : prevUntil,
		prevWhile                    : prevWhile,
		prevSibling                  : prevSibling,
		prevSiblings                 : prevSiblings,

		nodeAndPrevSiblings          : nodeAndPrevSiblings,
		nodeAndNextSiblings          : nodeAndNextSiblings,

		walk                         : walk,
		walkRec                      : walkRec,
		walkUntilNode                : walkUntilNode,

		forward                      : forward,
		backward                     : backward,
		findForward                  : findForward,
		findBackward                 : findBackward,

		upWhile                      : upWhile,
		climbUntil                   : climbUntil,
		childAndParentsUntil         : childAndParentsUntil,
		childAndParentsUntilIncl     : childAndParentsUntilIncl,
		childAndParentsUntilNode     : childAndParentsUntilNode,
		childAndParentsUntilInclNode : childAndParentsUntilInclNode,
		parentsUntil                 : parentsUntil,
		parentsUntilIncl             : parentsUntilIncl,

		forwardPreorderBacktraceUntil  : forwardPreorderBacktraceUntil,
		backwardPreorderBacktraceUntil : backwardPreorderBacktraceUntil
	};
});
