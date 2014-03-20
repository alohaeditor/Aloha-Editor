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
], function HtmlMutation(
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
	 * @return {Arrays.<Array.<string, boolean|string>>} Overrides
	 */
	function removeBreak(above, below) {
		var right = Boundaries.nextNode(below);
		var overrides = Overrides.harvest(right);
		if (!isVisuallyAdjacent(above, below)) {
			return overrides;
		}
		var linebreak = nextLineBreak(above, below);
		var isVisibleNode = function (node) {
			return Boundaries.container(above) === node || hasRenderedContent(node);
		};
		if (Boundaries.equals(linebreak, below)) {
			Dom.climbUntil(right, Dom.remove, isVisibleNode);
			return overrides;
		}
		var parent = right.parentNode;
		var nodes = Dom.nextSiblings(right, Styles.hasLinebreakingStyle);
		if (0 === nodes.length) {
			parent = right;
		}
		var moveNodeBeforeBoundary = function (boundary, node) {
			return insertNodeBeforeBoundary(node, boundary);
		};
		var boundary = nodes.reduce(moveNodeBeforeBoundary, linebreak);
		if (parent) {
			Dom.climbUntil(parent, Dom.remove, isVisibleNode);
		}
		return overrides;
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
	function insertLineBreak(boundary, context) {
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
	 * Determine which element to use to create a visual break.
	 *
	 * @private
	 * @param  {Object}  context
	 * @param  {Element} container
	 * @return {boolean}
	 */
	function determineBreakingNode(context, container) {
		var name;
		if (context && context.settings && context.settings.defaultBlockNodeName) {
		    name = context.settings.defaultBlockNodeName;
		} else {
			name = 'div';
		}
		return Content.allowsNesting(container.nodeName, name) ? name : null;
	}

	/**
	 * Inserts a breaking node behind the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function insertBreakAtBoundary(boundary, context) {
		var next = Boundaries.nextNode(boundary);
		var name = determineBreakingNode(context, next.parentNode);
		if (!name) {
			return insertLineBreak(boundary, context);
		}
		var node = next.ownerDocument.createElement(name);
		Mutation.insertNodeAtBoundary(node, boundary);
		return Boundaries.create(node, 0);
	}

	/**
	 * Splits the given boundary's ancestors until the boundary position
	 * returns true when applyied to the given predicate.
	 *
	 * @private
	 * @param  {Boundary}                    boundary
	 * @param  {function(Boundary):Boundary} until
	 * @return {Boundary}
	 */
	function splitBoundaryUntil(boundary, until) {
		boundary = Boundaries.normalize(boundary);
		if (until && until(boundary)) {
			return boundary;
		}
		if (Boundaries.isTextBoundary(boundary)) {
			return splitBoundaryUntil(Mutation.splitBoundary(boundary), until);
		}
		var container = Boundaries.container(boundary);
		var duplicate = Dom.cloneShallow(container);
		var node = Boundaries.nodeAfter(boundary);
		if (node) {
			Dom.move(Dom.nextSiblings(node), duplicate);
		}
		Dom.insertAfter(duplicate, container);
		return splitBoundaryUntil(Traversing.stepForward(boundary), until);
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
		return splitBoundaryUntil(boundary, function (boundary) {
			var node = Boundaries.container(boundary);
			return !node
			    || Styles.hasLinebreakingStyle(node)
			    || Dom.isEditingHost(node);
		});
	}

	/**
	 * Checks whether that the given node is a line breaking node.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function isBreakingContainer(node) {
		return !Predicates.isVoidNode(node)
		    && (Styles.hasLinebreakingStyle(node) || Dom.isEditingHost(node));
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

	function insertBr(boundary) {
		var before = Boundaries.nodeBefore(boundary);
		var after = Boundaries.nodeAfter(boundary);
		var br = (before && isRenderedBr(before)) ? before
		       : (after && isRenderedBr(after)) ? after
		       : null;
		return br ? insertNodeBeforeBoundary(
			br.ownerDocument.createElement('br'),
			boundary
		) : boundary;
	}

	/**
	 * Inserts a visual line break after the given boundary position.
	 *
	 * @param  {Boundary} boundary
	 * @param  {Object}   context
	 * @return {Boundary}
	 */
	function insertBreak(boundary, context) {
		context.overrides = Overrides.harvest(Boundaries.container(boundary));

		var split     = splitToBreakingContainer(insertBr(boundary));
		var container = Boundaries.container(split);
		var next      = Boundaries.nodeAfter(split);
		var siblings  = next ? Dom.nextSiblings(next) : [];
		var last      = Arrays.last(siblings);
		var breaker;

		// Because if the boundary is right before a breaking container, then a
		// default new break element should be inserted right before this
		// position:
		//
		// <b>foo</b>|<p>bar</p>
		var isBreakPoint = next && !Elements.isVoidType(next)
			&& (Styles.hasLinebreakingStyle(next) || Dom.isEditingHost(next));

		if (isBreakPoint) {
			return insertBreakAtBoundary(split, context);
		}

		// Because if there are no breaking containers below the editing host,
		// then we need to wrap the inline nodes adjacent to the boundary with
		// the default breaking container instead of attempting to split it:
		//
		// <host>foo|bar</host>
		if (Dom.isEditingHost(container)) {
			var name = determineBreakingNode(context, container);
			if (!name) {
				return insertLineBreak(split, context);
			}
			breaker = container.ownerDocument.createElement(name);
			if (last) {
				// <host>|<b>foo</b></host>
				Dom.insertAfter(breaker, last);
			} else {
				// <host><b>foo</b>|</host>
				Dom.insert(breaker, container, true);
			}
		} else {
			breaker = Dom.cloneShallow(container);
			Dom.insertAfter(breaker, container);
		}

		Dom.move(siblings, breaker);

		var left = Boundaries.prevWhile(split, function (boundary) {
			var node = Boundaries.prevNode(boundary);
			return !(Boundaries.isAtStart(boundary)
			    || Elements.isVoidType(node)
			    || Dom.isTextNode(node));
		});

		var right = Boundaries.nextWhile(
			Boundaries.create(breaker, 0),
			function (boundary) {
				var node = Boundaries.nextNode(boundary);
				return !(Boundaries.isAtEnd(boundary)
					|| Elements.isVoidType(node)
					|| Dom.isTextNode(node));
			}
		);

		//             split
		//               |
		//       left    |   right
		//          |    |   |
		//          v    v   v
		// <p><b>one|</b>|<b>|two</b></p>
		var boundaries = [left, right];

		boundaries = removeInvisibleContainers(boundaries[0], boundaries);
		boundaries = removeInvisibleContainers(boundaries[1], boundaries);
		prop(Boundaries.container(boundaries[0]));
		prop(Boundaries.container(boundaries[1]));

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
