/**
 * html/mutation.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html/elements',
	'html/styles',
	'html/traversing',
	'html/predicates',
	'dom',
	'mutation',
	'arrays',
	'content',
	'boundaries',
	'overrides',
	'functions',
	'browsers'
], /** @exports HtmlMutation */ function HtmlMutation(
	Elements,
	Styles,
	Traversing,
	Predicates,
	Dom,
	Mutation,
	Arrays,
	Content,
	Boundaries,
	Overrides,
	Fn,
	Browsers
) {
	'use strict';

	/**
	 * Get the first ancestor element that is editable, beginning at the given
	 * node and climbing up through the ancestors tree.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function closestEditable(node) {
		return Dom.upWhile(node, Fn.complement(Dom.isContentEditable));
	}

	/**
	 * "Props up" the given element if needed.
	 *
	 * The HTML specification specifies that empty block-level elements be not
	 * rendered.  This becomes a problem if an editing operation results in one
	 * of these elements being emptied of all its child nodes.  If this were to
	 * happen, standard conformant browsers will no longer render that empty
	 * block element even though it will remain in the document.  Because the
	 * element is invisible, it will no longer be possible for the caret to be
	 * placed into it.
	 *
	 * In order to prevent littering the editable with invisible block-level
	 * elements, we prop them up by ensuring the empty block-level elements are
	 * given a <br> child node to force them to be rendered with one line
	 * height.
	 *
	 * The notable exception to this rule are the Microsoft's non-standard
	 * conformant Trident engines which render empty editable block level
	 * elements with one line height.
	 *
	 * @param {Element} elem
	 */
	function prop(elem) {
		if (!Predicates.isBlockNode(elem) || (Browsers.msie && closestEditable(elem))) {
			return;
		}
		if (!elem.firstChild || !Dom.nextWhile(elem.firstChild, Elements.isUnrenderedWhitespace)) {
			Dom.insert(elem.ownerDocument.createElement('br'), elem, true);
		}
	}

	/**
	 * Finds the closest line-breaking node between `above` and `below` in
	 * document order.
	 *
	 * @private
	 * @param  {Boundary} above
	 * @param  {Boundary} below
	 * @return {Boundary}
	 */
	function nextLineBreak(above, below) {
		return Boundaries.nextWhile(above, function (boundary) {
			if (Boundaries.equals(boundary, below)) {
				return false;
			}
			if (Styles.hasLinebreakingStyle(Boundaries.nextNode(boundary))) {
				return false;
			}
			if (!Boundaries.isAtEnd(boundary)) {
				return true;
			}
			return !Dom.isEditingHost(Boundaries.container(boundary));
		});
	}

	/**
	 * Determine whether the boundary `left` is visually adjacent to `right`.
	 *
	 * @private
	 * @param  {Boundary} left
	 * @param  {Boundary} right
	 * @return {boolean}
	 */
	function isVisuallyAdjacent(left, right) {
		var adjacent = false;
		Boundaries.prevWhile(right, function (pos) {
			if (Boundaries.equals(left, pos)) {
				adjacent = true;
				return false;
			}
			if (Boundaries.offset(pos) > 0) {
				// TODO:
				// var node = Boundaries.nodeBefore(pos);
				var node = Dom.nodeAtOffset(
					Boundaries.container(pos),
					Boundaries.offset(pos) - 1
				);
				if ((Dom.isTextNode(node) || Predicates.isVoidNode(node)) && Elements.isRendered(node)) {
					adjacent = false;
					return false;
				}
			}
			return true;
		});
		return adjacent;
	}

	/**
	 * Checks whether the given node has any rendered children inside of it.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function hasRenderedContent(node) {
		if (Dom.isTextNode(node)) {
			return Elements.isRendered(node);
		}
		var children = Dom.children(node).filter(function (node) {
			return Predicates.isListItem(node) || Elements.isRendered(node);
		});
		return children.length > 0;
	}

	function insertNodeBeforeBoundary(node, boundary) {
		return Mutation.insertNodeAtBoundary(node, boundary, true);
	}

	/**
	 * Removes the visual line break between the adjacent boundaries `above`
	 * and `below` by moving the nodes after `below` over to before `above`.
	 *
	 * @param  {Boundary} above
	 * @param  {Boundary} below
	 * @return {Array.<Boundary>}
	 */
	function removeBreak(above, below) {
		if (!isVisuallyAdjacent(above, below)) {
			return [above, below];
		}
		var right         = Boundaries.nextNode(below);
		var container     = Boundaries.container(above);
		var linebreak     = nextLineBreak(above, below);
		var isVisibleNode = function (node) {
			return container === node || hasRenderedContent(node);
		};
		if (Boundaries.equals(linebreak, below)) {
			Dom.climbUntil(right, Dom.remove, isVisibleNode);
			return [above, above];
		}
		var parent = right.parentNode;
		var siblings = Dom.nextSiblings(right, Styles.hasLinebreakingStyle);
		if (0 === siblings.length) {
			parent = right;
		}
		siblings.reduce(function (boundary, node) {
			return Mutation.insertNodeAtBoundary(node, boundary);
		}, linebreak);
		if (parent) {
			Dom.climbUntil(parent, Dom.remove, isVisibleNode);
		}
		return [above, above];
	}

	/**
	 * Checks whether or not the given node is a significant BR element.
	 *
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isRenderedBr(node) {
		if ('BR' !== node.nodeName) {
			return false;
		}

		var ignorable = function (node) {
			return 'BR' !== node.nodeName && Elements.isUnrendered(node);
		};

		var prev = node.previousSibling
		        && Dom.prevWhile(node.previousSibling, ignorable);

		var next = node.nextSibling
		        && Dom.nextWhile(node.nextSibling, ignorable);

		// Because a br between two visible siblings in an inline node is
		// rendered
		if (prev && next && Predicates.isInlineNode(node.parentNode)) {
			return true;
		}

		// Because a br between two br or inline nodes is rendered
		if ((prev && ('BR' === prev.nodeName || !Styles.hasLinebreakingStyle(prev)))
				&&
				(next && ('BR' === next.nodeName || !Styles.hasLinebreakingStyle(next)))) {
			return true;
		}

		// Because a br next to another br will mean that both are rendered
		if ((prev && ('BR' === prev.nodeName))
				||
				(next && ('BR' === next.nodeName))) {
			return true;
		}

		// Because a br is the first space-consuming *tag* inside of a
		// line-breaking element is rendered
		var boundary = Boundaries.fromNode(node);
		while (Traversing.isAtStart(boundary)) {
			if (Styles.hasLinebreakingStyle(Boundaries.container(boundary))) {
				return true;
			}
			boundary = Boundaries.prev(boundary);
		}

		boundary = Boundaries.jumpOver(Boundaries.fromNode(node));
		while (Traversing.isAtEnd(boundary)) {
			if (Styles.hasLinebreakingStyle(Boundaries.container(boundary))) {
				return false;
			}
			boundary = Boundaries.next(boundary);
		}

		return !Styles.hasLinebreakingStyle(Traversing.nextNode(boundary));
	}

	/**
	 * Inserts a <br> element behind the given boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @param  {object}
	 * @return {Boundary}
	 */
	function insertLineBreak(boundary) {
		var container = Boundaries.container(boundary);
		var doc = container.ownerDocument;
		var br = doc.createElement('br');
		boundary = insertNodeBeforeBoundary(br, boundary);
		if (!isRenderedBr(br)) {
			return insertNodeBeforeBoundary(doc.createElement('br'), boundary);
		}
		return boundary;
	}

	/**
	 * Inserts a breaking node behind the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function insertBreakAtBoundary(boundary, defaultBreakingElement) {
		var container = Boundaries.container(boundary);
		var name = defaultBreakingElement || 'div';
		if (!Content.allowsNesting(container.nodeName, name)) {
			return insertLineBreak(boundary);
		}
		var breaker = container.ownerDocument.createElement(name);
		Mutation.insertNodeAtBoundary(breaker, boundary);
		return Boundaries.create(breaker, 0);
	}

	/**
	 * Checks whether that the given node is a line breaking node.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isBreakingContainer(node) {
		return !Elements.isVoidType(node)
		    && (Styles.hasLinebreakingStyle(node) || Dom.isEditingHost(node));
	}

	/**
	 * Splits the given boundary's ancestors up to the first linebreaking
	 * element which will not be split.
	 *
	 * @example
	 * <div><p><b>one<i><u>t¦wo</u></i></b></p></div>
	 * will be split to...
	 * <div><p><b>one<i><u>t</u></i></b>|<b><i><u>wo</u></i></b></p></div>
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function splitToBreakingContainer(boundary) {
		return Mutation.splitBoundaryUntil(boundary, function (boundary) {
			var node = Boundaries.container(boundary);
			return !node || isBreakingContainer(node);
		});
	}

	/**
	 * Recursively removes the given boundary's invisible containers.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Array.<Boundary>}
	 */
	function removeInvisibleContainers(boundary, boundaries) {
		Dom.climbUntil(
			Boundaries.container(boundary),
			function (node) {
				boundaries = Mutation.removeNode(node, boundaries);
			},
			function (node) {
				return Styles.hasLinebreakingStyle(node)
				    || Dom.isEditingHost(node)
				    || Elements.isRendered(node);
			}
		);
		return boundaries;
	}

	function adjacentBr(boundary) {
		var before = Boundaries.nodeBefore(boundary);
		var after = Boundaries.nodeAfter(boundary);
		if (before && isRenderedBr(before)) {
			return before;
		}
		if (after && isRenderedBr(after)) {
			return after;
		}
		return null;
	}

	/**
	 * Inserts a visual line break after the given boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string}   defaultBreakingElement
	 * @return {Boundary}
	 */
	function insertBreak(boundary, defaultBreakingElement) {
		var br = adjacentBr(boundary);
		if (br) {
			boundary = insertNodeBeforeBoundary(
				br.ownerDocument.createElement('br'),
				boundary
			);
		}

		var split     = splitToBreakingContainer(boundary);
		var container = Boundaries.container(split);
		var next      = Boundaries.nodeAfter(split);
		var children  = next ? Dom.nextSiblings(next) : [];

		// ...foo</p>|<h1>bar...
		if (next && isBreakingContainer(next)) {
			split = insertBreakAtBoundary(split, defaultBreakingElement);

		// <host>foo|bar</host>
		} else if (Dom.isEditingHost(container)) {
			split = insertBreakAtBoundary(split, defaultBreakingElement);
			var breaker = Boundaries.container(split);
			var remainder = Dom.move(children, breaker, isBreakingContainer);
			Dom.moveAfter(remainder, breaker);

		// <host><p>foo|bar</p></host>
		} else {
			split = Mutation.splitBoundaryUntil(split, function (boundary) {
				return Boundaries.container(boundary) === container.parentNode;
			});
		}

		var left = Boundaries.prevWhile(split, function (boundary) {
			var node = Boundaries.prevNode(boundary);
			return !(Boundaries.isAtStart(boundary)
			    || Elements.isVoidType(node)
			    || Dom.isTextNode(node));
		});

		var right = Boundaries.nextWhile(split, function (boundary) {
			var node = Boundaries.nextNode(boundary);
			return !(Boundaries.isAtEnd(boundary)
			    || Elements.isVoidType(node)
			    || Dom.isTextNode(node));
		});

		//             split
		//       left    |   right
		//          |    |   |
		//          v    v   v
		// <p><b>one|</b>|<b>|two</b></p>
		var boundaries = [left, right];

		boundaries = removeInvisibleContainers(boundaries[0], boundaries);
		boundaries = removeInvisibleContainers(boundaries[1], boundaries);
		prop(Boundaries.container(boundaries[0]));
		prop(Boundaries.container(boundaries[1]));

		var node = Boundaries.nodeAfter(boundaries[1]);
		var visible = node && Dom.nextWhile(node, function (node) {
			return !isRenderedBr(node) && Elements.isUnrendered(node);
		});

		// <li>|<ul>...
		if (visible && isBreakingContainer(visible)) {
			return Mutation.insertNodeAtBoundary(
				visible.ownerDocument.createElement('br'),
				boundaries[1]
			);
		}

		return boundaries[1];
	}

	return {
		prop               : prop,
		removeBreak        : removeBreak,
		insertBreak        : insertBreak,
		insertLineBreak    : insertLineBreak,
		nextLineBreak      : nextLineBreak,
		isRenderedBr       : isRenderedBr,
		isVisuallyAdjacent : isVisuallyAdjacent
	};
});
