/* range-context.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'util/dom2',
	'util/arrays',
	'util/trees',
	'util/functions',
	'util/html'
], function (
	Dom,
	Arrays,
	Trees,
	Fn,
	Html
) {
	'use strict';

	/**
	 * Walks the siblings of the given child, calling before for
	 * siblings before the given child, after for siblings after the
	 * given child, and at for the given child.
	 */
	function walkSiblings(parent, beforeAfterChild, before, at, after, arg) {
		var fn = before;
		Dom.walk(parent.firstChild, function (child) {
			if (child !== beforeAfterChild) {
				return fn(child, arg);
			} else {
				fn = after;
				return at(child, arg);
			}
		});
	}

	/**
	 * Walks the siblings of each node in the given array (see
	 * walkSiblings()).
	 *
	 * @param ascendNodes from lowest descendant to topmost parent. The
	 * topmost parent and its siblings will not be walked over.
	 *
	 * @param atEnd indicates that the position to ascend from is not at
	 * ascendNodes[0], but at the end of ascendNodes[0] (meaning that
	 * all of ascendNodes[0]'s children will be walked over as well).
	 *
	 * @param carryDown is invoked on each node in the given array,
	 * allowing the carrying down of a context value. May return null
	 * to return the carryDown value from above.
	 */
	function ascendWalkSiblings(ascendNodes, atEnd, carryDown, before, at, after, arg) {
		var i;
		var args = [];
		i = ascendNodes.length;
		while (i--) {
			arg = carryDown(ascendNodes[i], arg) || arg;
			args.push(arg);
		}
		args.reverse();
		// Because with end positions like
		// <elem>text{</elem> or <elem>text}</elem>
		// ascendecending would start at <elem> ignoring "text".
		if (ascendNodes.length && atEnd) {
			Dom.walk(ascendNodes[0].firstChild, before, args[0]);
		}
		for (i = 0; i < ascendNodes.length - 1; i++) {
			var child = ascendNodes[i];
			var parent = ascendNodes[i + 1];
			walkSiblings(parent, child, before, at, after, args[i + 1]);
		}
	}

	/**
	 * Walks the boundary of the range.
	 *
	 * The range's boundary starts at startContainer/startOffset, goes
	 * up to to the commonAncestorContainer's child above or equal
	 * startContainer/startOffset, continues to the
	 * commonAnestorContainer's child above or equal to
	 * endContainer/endOffset, and goes down again to
	 * endContainer/endOffset.
	 *
	 * Requires range's boundary points to be between nodes
	 * (Dom.splitTextContainers).
	 */
	function walkBoundary(liveRange, carryDown, stepOutside, stepPartial, stepInside, arg) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		var sc  = liveRange.startContainer;
		var ec  = liveRange.endContainer;
		var so  = liveRange.startOffset;
		var eo  = liveRange.endOffset;
		var start    = Dom.nodeAtOffset(sc, so);
		var end      = Dom.nodeAtOffset(ec, eo);
		var startEnd = Dom.isAtEnd(sc, so);
		var endEnd   = Dom.isAtEnd(ec, eo);
		var uptoCacChildStart = Dom.childAndParentsUntilNode(start, cac);
		var uptoCacChildEnd   = Dom.childAndParentsUntilNode(end,   cac);
		var cacChildStart = uptoCacChildStart.length ? uptoCacChildStart[uptoCacChildStart.length - 1] : null;
		var cacChildEnd   = uptoCacChildEnd.length   ? uptoCacChildEnd[uptoCacChildEnd.length - 1] : null;
		arg = carryDown(cac, arg) || arg;
		// Because the start node is inside the range, the end node is
		// outside, and all ancestors of start and end are partially
		// inside/outside (for startEnd/endEnd positions the nodes are
		// also ancestors of the position).
		function stepAtStart(node, arg) {
			return node === start && !startEnd
				? stepInside(node, arg)
				: stepPartial(node, arg);
		}
		function stepAtEnd(node, arg) {
			return node === end && !endEnd
				? stepOutside(node, arg)
				: stepPartial(node, arg);
		}
		ascendWalkSiblings(uptoCacChildStart, startEnd, carryDown, stepOutside, stepAtStart, stepInside, arg);
		ascendWalkSiblings(uptoCacChildEnd, endEnd, carryDown, stepInside, stepAtEnd, stepOutside, arg);
		if (cacChildStart && cacChildStart !== cacChildEnd) {
			var next;
			Dom.walkUntilNode(cac.firstChild, stepOutside, cacChildStart, arg);
			next = stepAtStart(cacChildStart, arg);
			Dom.walkUntilNode(next, stepInside, cacChildEnd, arg);
			if (cacChildEnd) {
				next = stepAtEnd(cacChildEnd, arg);
				Dom.walk(next, stepOutside, arg);
			}
		}
	}

	/**
	 * Pushes down a context to the given range by clearing all
	 * overrides between pushDownFrom and range.commonAncestorContainer,
	 * and clearing all overrides inside and along the range's boundary
	 * (see walkBoundary()), invoking pushDownOverride on all siblings
	 * of the range boundary that are not contained in it.
	 *
	 * Requires range's boundary points to be between nodes
	 * (Dom.splitTextContainers).
	 */
	function pushDownContext(liveRange, pushDownFrom, cacOverride, getOverride, clearOverride, clearOverrideRec, pushDownOverride) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		walkBoundary(liveRange, getOverride, pushDownOverride, clearOverride, clearOverrideRec, cacOverride);
		var fromCacToTop = Dom.childAndParentsUntilInclNode(cac, pushDownFrom);
		ascendWalkSiblings(fromCacToTop, false, getOverride, pushDownOverride, clearOverride, pushDownOverride, null);
		clearOverride(pushDownFrom);
	}

	/**
	 * Walks around the boundary of range and invokes the given
	 * functions with the nodes it encounters.
	 *
	 * clearOverride    - invoked for partially contained nodes.
	 * clearOverrideRec - invoked for top-level contained nodes.
	 * pushDownOverride - invoked for left siblings of ancestors
	 *   of startContainer[startOffset], and for right siblings of
	 *   ancestors of endContainer[endOffset].
	 * setContext       - invoked for top-level contained nodes.
	 *
	 * The purpose of the walk is to either push-down or set a context
	 * on all nodes within the range, and push-down any overrides that
	 * exist along the bounderies of the range.
	 *
	 * An override is a context that overrides the context to set.
	 *
	 * Pushing-down a context means that an existing context-giving
	 * ancestor element will be reused, if available, and setContext()
	 * will not be invoked.
	 *
	 * Pushing-down an override means that ancestors of the range's
	 * start or end containers will have their overrides cleared and the
	 * subset of the ancestors' children that is not contained by the
	 * range will have the override applied via pushDownOverride().
	 *
	 * This algorithm will not by itself mutate anything, or depend on
	 * any mutations by the given functions.
	 *
	 * clearOverride, clearOverideRec, setContext, pushDownContext may
	 * mutate the given node and it's previous siblings, and may insert
	 * nextSiblings, but must not mutate the next sibling of the given
	 * node, and must return the nextSibling of the given node (the
	 * nextSibling before any mutations).
	 *
	 * When setContext is invoked with hasOverrideAncestor, it is for
	 * example when a bold element is at the same time the upper
	 * boundary (for example when the bold element itself is the editing
	 * host) and an attempt is made to set a non-bold context inside the
	 * bold element. To work around this, setContext() could force a
	 * non-bold context by wrapping the node with a <span
	 * style="font-weight: normal">. See hasOverrideAncestor below.
	 *
	 * @param liveRange range's boundary points should be between nodes
	 * (Dom.splitTextContainers).
	 *
	 * @param isUpperBoundary args (node). Identifies exclusive upper
	 * boundary element, only elements below which will be modified.
	 *
	 * @param getOverride(node). Returns a node's override, or
	 * null if the node does not provide an override. The topmost node
	 * for which getOverride returns a non-null value is the topmost
	 * override. If there is a topmost override, and it is below the
	 * upper boundary element, it will be cleared and pushed down.
	 *
	 * @param clearOverride(node). Should clear the given node of an
	 * override. The given node may or may not have an override
	 * set. Will be invoked shallowly for all ancestors of start and end
	 * containers (up to isUpperBoundary or hasContext). May perform
	 * mutations as explained above.
	 *
	 * @parma clearOverrideRec(node). Like clearOverride but
	 * should clear the override recursively.
	 *
	 * @param pushDownOverride(node, override). Applies the given
	 * override to node. Should check whether the given node doesn't
	 * already provide its own override, in which case the given
	 * override should not be applied. May perform mutations as
	 * explained above.
	 *
	 * @param hasContext(node). Returns true if the given node
	 * already provides the context to set.
	 *
	 * @param setContext(node, hasOverrideAncestor). Applies the context
	 * to the given node. Should clear overrides recursively. Should
	 * also clear context recursively to avoid unnecessarily nested
	 * contexts. hasOverrideAncestor is true if an override is in effect
	 * above the given node (see explanation above). May perform
	 * mutations as explained above.
	 */
	function mutate(liveRange, isUpperBoundary, getOverride, clearOverride, clearOverrideRec, pushDownOverride, hasContext, setContext, rootHasContext) {
		if (liveRange.collapsed) {
			return;
		}
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		var topmostOverrideNode = null;
		var bottommostOverrideNode = null;
		var isNonClearableOverride = false;
		var upperBoundaryAndBeyond = false;
		var fromCacToContext = Dom.childAndParentsUntilIncl(cac, hasContext);
		Arrays.forEach(fromCacToContext, function (node) {
			upperBoundaryAndBeyond = upperBoundaryAndBeyond || isUpperBoundary(node);
			if (getOverride(node)) {
				topmostOverrideNode = node;
				isNonClearableOverride = upperBoundaryAndBeyond;
				bottommostOverrideNode = bottommostOverrideNode || node;
			}
		});
		if ((rootHasContext || hasContext(fromCacToContext[fromCacToContext.length - 1]))
			    && !isNonClearableOverride) {
			var pushDownFrom = topmostOverrideNode || cac;
			var cacOverride = getOverride(bottommostOverrideNode || cac);
			pushDownContext(liveRange, pushDownFrom, cacOverride, getOverride, clearOverride, clearOverrideRec, pushDownOverride);
		} else {
			walkBoundary(liveRange, getOverride, pushDownOverride, clearOverride, function (node) {
				return setContext(node, isNonClearableOverride);
			});
		}
	}

	function adjustPointShallowRemove(point, left, node) {
		if (point.node === node) {
			point.next();
		}
	}

	function adjustPointMoveBackWithinRange(point, left, node, ref, atEnd) {
		if (point.node === node) {
			// Because Left positions will be moved back with the node,
			// which is correct, while right positions must stay where
			// they are.
			// Because right positions with point.atEnd == true/false
			// must both stay where they are, we don't need an extra
			// check for point.atEnd.
			if (!left) {
				point.next();
			}
		}
		// Because trimRangeClosingOpening will ensure that the boundary
		// points will be next to a node that is moved, we don't need
		// any special handling for ref.
	}

	function adjustPointWrap(point, left, node, wrapper) {
		// Because we prefer the range to be outside the wrapper (no
		// particular reason though).
		if (point.node === node && !point.atEnd) {
			point.node = wrapper;
		}
	}

	function shallowRemoveAdjust(node, leftPoint, rightPoint) {
		adjustPointShallowRemove(leftPoint, true, node);
		adjustPointShallowRemove(rightPoint, false, node);
		Dom.shallowRemove(node);
	}

	function wrapAdjust(node, wrapper, leftPoint, rightPoint) {
		if (wrapper.parentNode) {
			shallowRemoveAdjust(wrapper, leftPoint, rightPoint);
		}
		adjustPointWrap(leftPoint, true, node, wrapper);
		adjustPointWrap(rightPoint, false, node, wrapper);
		Dom.wrap(node, wrapper);
	}

	function insertAdjust(node, ref, atEnd, leftPoint, rightPoint) {
		adjustPointMoveBackWithinRange(leftPoint, true, node, ref, atEnd);
		adjustPointMoveBackWithinRange(rightPoint, false, node, ref, atEnd);
		Dom.insert(node, ref, atEnd);
	}

	function nextSibling(node) {
		return node.nextSibling;
	}

	// TODO when restacking the <b> that wraps "z" in
	// <u><b>x</b><s><b>z</b></s></u>, join with the <b> that wraps "x".
	function restackRec(node, hasContext, notIgnoreHorizontal, notIgnoreVertical) {
		if (1 !== node.nodeType || notIgnoreVertical(node)) {
			return null;
		}
		var maybeContext = Dom.walkUntil(node.firstChild, nextSibling, notIgnoreHorizontal);
		if (!maybeContext) {
			return null;
		}
		var notIgnorable = Dom.walkUntil(maybeContext.nextSibling, nextSibling, notIgnoreHorizontal);
		if (notIgnorable) {
			return null;
		}
		if (hasContext(maybeContext)) {
			return maybeContext;
		}
		return restackRec(maybeContext, hasContext, notIgnoreHorizontal, notIgnoreVertical);
	}

	function restack(node, hasContext, ignoreHorizontal, ignoreVertical, leftPoint, rightPoint) {
		var notIgnoreHorizontal = function (node) {
			return hasContext(node) || !ignoreHorizontal(node);
		};
		var notIgnoreVertical = Fn.complement(ignoreVertical);
		if (hasContext(node)) {
			return true;
		}
		var context = restackRec(node, hasContext, notIgnoreHorizontal, notIgnoreVertical);
		if (!context) {
			return false;
		}
		wrapAdjust(node, context, leftPoint, rightPoint);
		return true;
	}

	function format(liveRange, nodeName, unformat) {
		var leftPoint;
		var rightPoint;

		function hasContext(node) {
			if (unformat) {
				// Because we pass rootHasContext=true to mutate.
				return false;
			}
			return nodeName === node.nodeName;
		}

		function getOverride(node) {
			if (!unformat) {
				return false;
			}
			return nodeName === node.nodeName;
		}

		function hasOverride(node) {
			return !!getOverride(node);
		}

		function clearOverride(node) {
			var next = node.nextSibling;
			if (unformat && nodeName === node.nodeName) {
				shallowRemoveAdjust(node, leftPoint, rightPoint);
			}
			return next;
		}

		function clearOverrideRec(node) {
			return Dom.walkRec(node, clearOverride);
		}

		function clearContext(node) {
			var next = node.nextSibling;
			if (!unformat && nodeName === node.nodeName) {
				shallowRemoveAdjust(node, leftPoint, rightPoint);
			}
			return next;
		}

		function clearContextRec(node) {
			return Dom.walkRec(node, clearContext);
		}

		function ensureWrapper(node, hasWrapper) {
			if (node.previousSibling && !hasWrapper(node.previousSibling)) {
				// Because restacking here solves two problems: one the
				// case where the context was unnecessarily pushed down
				// on the left of the range, and two to join with a
				// context node that already exists to the left of the
				// range.
				restack(node.previousSibling,
						hasWrapper,
						Html.isIgnorableWhitespace,
						Html.isInlineFormattable,
						leftPoint, rightPoint);
			}
			if (node.previousSibling && hasWrapper(node.previousSibling)) {
				insertAdjust(node, node.previousSibling, true, leftPoint, rightPoint);
				return true;
			} else if (!hasWrapper(node)) {
				var wrapper = document.createElement(nodeName);
				wrapAdjust(node, wrapper, leftPoint, rightPoint);
				return true;
			}
			return false;
		}

		function pushDownOverride(node, override) {
			if (!override) {
				return node.nextSibling;
			}
			if (!unformat) {
				throw "not implemented";
			}
			var next = node.nextSibling;
			ensureWrapper(node, hasOverride);
			return next;
		}

		function setContext(node) {
			if (unformat) {
				throw "not implemented";
			}
			var next = node.nextSibling;
			if (ensureWrapper(node, hasContext)) {
				// Because the node was wrapped with a context, and if
				// the node itself has the context, it should be cleared
				// to avoid nested contexts.
				clearContextRec(node);
			} else {
				// Because the node itself has the context and was not
				// wrapped, we must only clear its children.
				Dom.walk(node.firstChild, clearContextRec);
			}
			clearOverrideRec(node);
			return next;
		}

		function isUpperBoundary(node) {
			return 'BODY' === node.nodeName;
		}

		// Because we are mutating the range several times and don't
		// want the caller to see the in-between updates, and because we
		// are using trimRange() below to adjust the range's boundary
		// points, which we don't want the browser to re-adjust (which
		// some browsers do).
		var range = Dom.stableRange(liveRange);

		// Because we should avoid splitTextContainers() if this call is a noop.
		if (range.collapsed) {
			return;
		}

		// Because trimRangeClosingOpening(), mutate() and
		// adjustPointMoveBackWithinRange() require boundary points to
		// be between nodes.
		Dom.splitTextContainers(range);

		// Because we want unbolding
		// <b>one<i>two{</i>three}</b>
		// to result in
		// <b>one<i>two</i></b>three
		// and not in
		// <b>one</b><i><b>two</b></i>three
		// and because adjustPointMoveBackWithinRange() requires the
		// left boundary point to be next to a non-ignorable node.
		Dom.trimRangeClosingOpening(range, Html.isIgnorableWhitespace);

		// Because mutation needs to keep track and adjust boundary
		// points.
		leftPoint = Dom.cursorFromBoundaryPoint(range.startContainer, range.startOffset);
		rightPoint = Dom.cursorFromBoundaryPoint(range.endContainer, range.endOffset);

		mutate(range, isUpperBoundary, getOverride, clearOverride, clearOverrideRec, pushDownOverride, hasContext, setContext, unformat);

		// Because we must reflect the adjusted boundary points in the
		// given range.
		Dom.setRangeStartFromCursor(liveRange, leftPoint);
		Dom.setRangeEndFromCursor(liveRange, rightPoint);
	}

	return {
		mutate: mutate,
		format: format
	};
});
