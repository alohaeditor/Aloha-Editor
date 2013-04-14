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
/**
 * TODO check contained-in rules when when pushing down or setting a context
 * TODO better handling of the last <br/> in a block and generally of
 *      unrendered whitespace.
 * TODO canonicalize whitespace
 * TODO improve restacking and joining algorithm
 * TODO formatStyle: in the following case the outer "font-family:
 *      arial" span should be removed.  Can be done similar to how
 *      findReusableAncestor() works.
 *      <span style="font-family: arial">
 *         <span style="font-family: times">one</span>
 *         <span style="font-family: helvetica">two<span>
 *      </span>
 */
define([
	'jquery',
	'util/dom2',
	'util/arrays',
	'util/trees',
	'util/strings',
	'util/functions',
	'util/html'
], function (
	$,
	Dom,
	Arrays,
	Trees,
	Strings,
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
				fn(child, arg);
			} else {
				fn = after;
				at(child, arg);
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
			var cd = carryDown(ascendNodes[i], arg);
			if (null != cd) {
				arg = cd;
			}
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

	function makePointNodeStep(pointNode, atEnd, stepOutsideInside, stepPartial) {
		// Because the start node is inside the range, the end node is
		// outside, and all ancestors of start and end are partially
		// inside/outside (for startEnd/endEnd positions the nodes are
		// also ancestors of the position).
		return function (node, arg) {
			if (node === pointNode && !atEnd) {
				stepOutsideInside(node, arg);
			} else {
				stepPartial(node, arg);
			}
		};
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
	function walkBoundaryLeftRightInbetween(liveRange, carryDown, stepLeftStart, stepRightStart, stepLeftEnd, stepRightEnd, stepPartial, stepInbetween, arg) {
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
		var ascStart = Dom.childAndParentsUntilNode(start, cac);
		var ascEnd   = Dom.childAndParentsUntilNode(end,   cac);
		var stepAtStart = makePointNodeStep(start, startEnd, stepRightStart, stepPartial);
		var stepAtEnd   = makePointNodeStep(end, endEnd, stepRightEnd, stepPartial);
		ascendWalkSiblings(ascStart, startEnd, carryDown, stepLeftStart, stepAtStart, stepRightStart, arg);
		ascendWalkSiblings(ascEnd, endEnd, carryDown, stepLeftEnd, stepAtEnd, stepRightEnd, arg);
		var cacChildStart = Arrays.last(ascStart);
		var cacChildEnd   = Arrays.last(ascEnd);
		stepAtStart = makePointNodeStep(start, startEnd, stepInbetween, stepPartial);
		Dom.walkUntilNode(cac.firstChild, stepLeftStart, cacChildStart, arg);
		if (cacChildStart) {
			var next = cacChildStart.nextSibling;
			stepAtStart(cacChildStart, arg);
			Dom.walkUntilNode(next, stepInbetween, cacChildEnd, arg);
			if (cacChildEnd) {
				next = cacChildEnd.nextSibling;
				stepAtEnd(cacChildEnd, arg);
				Dom.walk(next, stepRightEnd, arg);
			}
		}
	}

	function walkBoundary(liveRange, carryDown, stepOutside, stepPartial, stepInside, arg) {
		walkBoundaryLeftRightInbetween(liveRange, carryDown, stepOutside, stepInside, stepInside, stepOutside, stepPartial, stepInside, arg);
	}

	/**
	 * Pushes down an implied context above or at pushDownFrom to the
	 * given range by clearing all overrides from pushDownFrom
	 * (inclusive) to range.commonAncestorContainer, and clearing all
	 * overrides inside and along the range's boundary (see
	 * walkBoundary()), invoking pushDownOverride on all siblings of the
	 * range boundary that are not contained in it.
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
	 * @param formatter a map with the following properties
	 *   isUpperBoundary(node) - identifies exclusive upper
	 *   boundary element, only elements below which will be modified.
	 *
	 *   getOverride(node) - returns a node's override, or null/undefined
	 *   if the node does not provide an override. The topmost node for
	 *   which getOverride returns a non-null value is the topmost
	 *   override. If there is a topmost override, and it is below the
	 *   upper boundary element, it will be cleared and pushed down.
	 *   Should return a non-null value for any node for which
	 *   hasContext(node) returns true.
	 *
	 *   clearOverride(node) - should clear the given node of an
	 *   override. The given node may or may not have an override
	 *   set. Will be invoked shallowly for all ancestors of start and end
	 *   containers (up to isUpperBoundary or hasContext). May perform
	 *   mutations as explained above.
	 *
	 *   clearOverrideRec(node) - like clearOverride but should clear
	 *   the override recursively. If not provided, clearOverride will
	 *   be applied recursively.
	 *
	 *   pushDownOverride(node, override) - applies the given
	 *   override to node. Should check whether the given node doesn't
	 *   already provide its own override, in which case the given
	 *   override should not be applied. May perform mutations as
	 *   explained above.
	 *
	 *   hasContext(node) - returns true if the given node
	 *   already provides the context to set.
	 *
	 *   setContext(node, override, hasOverrideAncestor) - applies the context
	 *   to the given node. Should clear overrides recursively. Should
	 *   also clear context recursively to avoid unnecessarily nested
	 *   contexts. hasOverrideAncestor is true if an override is in effect
	 *   above the given node (see explanation above). May perform
	 *   mutations as explained above.
	 */
	function mutate(liveRange, formatter, rootHasImpliedContext) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;

		var isUpperBoundary = formatter.isUpperBoundary;
		var getOverride = formatter.getOverride;
		var pushDownOverride = formatter.pushDownOverride;
		var hasContext = formatter.hasContext;
		var setContext = formatter.setContext;
		var clearOverride = formatter.clearOverride;
		var clearOverrideRec = formatter.clearOverrideRec  || function (node) {
			Dom.walkRec(node, clearOverride);
		};

		var topmostOverrideNode = null;
		var bottommostOverrideNode = null;
		var isNonClearableOverride = false;
		var upperBoundaryAndBeyond = false;
		var fromCacToContext = Dom.childAndParentsUntilIncl(cac, function (node) {
			// Because we shouldn't expect hasContext to handle the
			// document element (which has nodeType 9).
			return !node.parentNode || 9 === node.parentNode.nodeType || hasContext(node);
		});
		Arrays.forEach(fromCacToContext, function (node) {
			upperBoundaryAndBeyond = upperBoundaryAndBeyond || isUpperBoundary(node);
			// Because we are only interested in non-context overrides.
			if (null != getOverride(node) && !hasContext(node)) {
				topmostOverrideNode = node;
				isNonClearableOverride = upperBoundaryAndBeyond;
				bottommostOverrideNode = bottommostOverrideNode || node;
			}
		});

		if ((rootHasImpliedContext || hasContext(Arrays.last(fromCacToContext)))
			    && !isNonClearableOverride) {
			if (!topmostOverrideNode) {
				walkBoundary(liveRange, getOverride, pushDownOverride, clearOverride, clearOverrideRec);
			} else {
				var pushDownFrom = topmostOverrideNode;
				var cacOverride = getOverride(bottommostOverrideNode || cac);
				pushDownContext(liveRange, pushDownFrom, cacOverride, getOverride, clearOverride, clearOverrideRec, pushDownOverride);
			}
		} else {
			var lastContextNode = null;
			var mySetContext = function (node, override) {
				lastContextNode = node;
				setContext(node, override, isNonClearableOverride);
			};
			walkBoundary(liveRange, getOverride, pushDownOverride, clearOverride, mySetContext);

			// Because we don't have a complete solution for joining nodes
			// yet (TODO at the top of the file) we solve the most common
			// case. We only need to do it on the right side because to the
			// left is already handled by ensureWrapper().
			if (lastContextNode) {
				var contextNode = (hasContext(lastContextNode)
								   ? lastContextNode
								   : (hasContext(lastContextNode.parentNode)
									  ? lastContextNode.parentNode
									  : null));
				if (contextNode && contextNode.nextSibling && hasContext(contextNode.nextSibling)) {
					mySetContext(contextNode.nextSibling);
				}
			}
		}
	}

	function adjustPointShallowRemove(point, node) {
		if (point.node === node) {
			if (!point.node.firstChild) {
				point.skipNext();
			} else {
				point.next();
			}
		}
	}

	// NB depends on trimRangeClosingOpening to move the leftPoint out
	// of an atEnd position to the first node that is to be moved.
	function adjustPointMoveBackWithinRange(point, node, left) {
		if (point.node === node) {
			// Because Left positions will be moved back with the node,
			// which is correct, while right positions must stay where
			// they are.
			// Because right positions with point.atEnd == true/false
			// must both stay where they are, we don't need an extra
			// check for point.atEnd.
			if (!left) {
				point.skipNext();
			}
		}
	}

	function adjustPointWrap(point, node, wrapper) {
		// Because we prefer the range to be outside the wrapper (no
		// particular reason though).
		if (point.node === node && !point.atEnd) {
			point.node = wrapper;
		}
	}

	function removeShallowAdjust(node, leftPoint, rightPoint) {
		adjustPointShallowRemove(leftPoint, node);
		adjustPointShallowRemove(rightPoint, node);
		Dom.removeShallow(node);
	}

	function wrapAdjust(node, wrapper, leftPoint, rightPoint) {
		if (wrapper.parentNode) {
			removeShallowAdjust(wrapper, leftPoint, rightPoint);
		}
		adjustPointWrap(leftPoint, node, wrapper);
		adjustPointWrap(rightPoint, node, wrapper);
		Dom.wrap(node, wrapper);
	}

	function moveAdjust(node, ref, atEnd, leftPoint, rightPoint) {
		adjustPointMoveBackWithinRange(leftPoint, node, true);
		adjustPointMoveBackWithinRange(rightPoint, node, false);
		Dom.insert(node, ref, atEnd);
	}

	function fixupRange(liveRange, mutate) {
		// Because we are mutating the range several times and don't
		// want the caller to see the in-between updates, and because we
		// are using trimRange() below to adjust the range's boundary
		// points, which we don't want the browser to re-adjust (which
		// some browsers do).
		var range = Dom.stableRange(liveRange);

		// Because making the assumption that boundary points are
		// between nodes makes the algorithms generally a bit simpler.
		Dom.splitTextContainers(range);
		var splitStart = Dom.cursorFromBoundaryPoint(range.startContainer, range.startOffset);
		var splitEnd = Dom.cursorFromBoundaryPoint(range.endContainer, range.endOffset);

		// Because we want unbolding
		// <b>one<i>two{</i>three}</b>
		// to result in
		// <b>one<i>two</i></b>three
		// and not in
		// <b>one</b><i><b>two</b></i>three
		// and because adjustPointMoveBackWithinRange() requires the
		// left boundary point to be next to a non-ignorable node.
		Dom.trimRangeClosingOpening(range, Html.isUnrenderedWhitespace);

		// Because mutation needs to keep track and adjust boundary
		// points so we can preserve the range.
		var leftPoint = Dom.cursorFromBoundaryPoint(range.startContainer, range.startOffset);
		var rightPoint = Dom.cursorFromBoundaryPoint(range.endContainer, range.endOffset);

		mutate(range, leftPoint, rightPoint);

		// Because we want to ensure that this algorithm doesn't
		// introduce any additional splits between text nodes.
		Dom.setRangeFromBoundaries(range, leftPoint, rightPoint);
		// TODO we should not only join nodes we split, but also all
		// text nodes that were joined due to wrappers being removed
		// (unformatting for example).
		Dom.joinTextNodeAdjustRange(splitStart.node, range);
		Dom.joinTextNodeAdjustRange(splitEnd.node, range);

		Dom.setRangeFromRef(liveRange, range);
	}

	function restackRec(node, hasContext, ignoreHorizontal, ignoreVertical) {
		if (1 !== node.nodeType || !ignoreVertical(node)) {
			return null;
		}
		var maybeContext = Dom.nextWhile(node.firstChild, ignoreHorizontal);
		if (!maybeContext) {
			return null;
		}
		var notIgnorable = Dom.nextWhile(maybeContext.nextSibling, ignoreHorizontal);
		if (notIgnorable) {
			return null;
		}
		if (hasContext(maybeContext)) {
			return maybeContext;
		}
		return restackRec(maybeContext, hasContext, ignoreHorizontal, ignoreVertical);
	}

	function restack(node, hasContext, ignoreHorizontal, ignoreVertical, leftPoint, rightPoint) {
		function myIgnoreHorizontal(node) {
			return !hasContext(node) && ignoreHorizontal(node);
		}
		if (hasContext(node)) {
			return node;
		}
		var context = restackRec(node, hasContext, myIgnoreHorizontal, ignoreVertical);
		if (!context) {
			return node;
		}
		wrapAdjust(node, context, leftPoint, rightPoint);
		return context;
	}

	function ensureWrapper(node, createWrapper, isWrapper, isMergable, leftPoint, rightPoint) {
		if (node.previousSibling && !isWrapper(node.previousSibling)) {
			// TODO restacking here is a hack. Should be moved into mutate().
			restack(node.previousSibling,
					isWrapper,
					Html.isUnrenderedWhitespace,
					Html.hasInlineStyle,
					leftPoint,
					rightPoint);
		}
		var wrapper = null;
		if (node.previousSibling && isMergable(node.previousSibling)) {
			wrapper = node.previousSibling;
			moveAdjust(node, wrapper, true, leftPoint, rightPoint);
		} else if (!isWrapper(node)) {
			wrapper = createWrapper();
			wrapAdjust(node, wrapper, leftPoint, rightPoint);
		}
		return wrapper;
	}

	function isUpperBoundary_default(node) {
		// Because the body element is an obvious upper boundary, and
		// because, when we are inside an editable, we shouldn't make
		// modifications outside the editable (if we are not inside
		// an editable, we don't care).
		return 'BODY' === node.nodeName || Html.isEditingHost(node);
	}

	function isPrunable_default(node) {
		return Arrays.every(Arrays.map(Dom.attrs(node), Arrays.second),
							Strings.empty);
	}

	function createStyleWrapper_default() {
		return document.createElement('SPAN');
	}

	function isStyleEq_default(styleValueA, styleValueB) {
		return styleValueA === styleValueB;
	}

	function isStyleWrapperReusable_default(node) {
		return 'SPAN' === node.nodeName;
	}

	function isStyleWrapperPrunable_default(node) {
		return 'SPAN' === node.nodeName && isPrunable_default(node);
	}

	function makeFormatter(contextValue, getOverride, hasContext, isContextOverride, hasSomeContextValue, hasContextValue, addContextValue, delContextValue, createWrapper, isReusable, isPrunable, leftPoint, rightPoint) {

		// Because we remember any wrappers we created to optimize reuse.
		var wrappersByContextValue = [];

		function pruneContext(node) {
			if (!hasSomeContextValue(node)) {
				return;
			}
			delContextValue(node);
			if (isPrunable(node)) {
				removeShallowAdjust(node, leftPoint, rightPoint);
			}
		}

		function createContextWrapper(value) {
			var wrapper = createWrapper();
			addContextValue(wrapper, value);
			var key = ':' + value;
			var wrappers = wrappersByContextValue[key] = wrappersByContextValue[key] || [];
			wrappers.push(wrapper);
			return wrapper;
		}

		function isMergableWrapper(value, node) {
			if (!isReusable(node)) {
				return false;
			}
			var key =  ':' + value;
			var wrappers = wrappersByContextValue[key] || [];
			if (Arrays.contains(wrappers, node)) {
				return true;
			}
			if (hasSomeContextValue(node) && !hasContextValue(node, value)) {
				return false;
			}
			// Because we assume something is mergeable if it doesn't
			// provide any context value besides the one we are
			// applying, and something doesn't provide any context value
			// at all if it is prunable.
			var clone = node.cloneNode(false);
			delContextValue(clone);
			return isPrunable(clone);
		}

		function wrapContextValue(node, value) {
			var wrapper = ensureWrapper(
				node,
				Fn.bind(createContextWrapper, null, value),
				isReusable,
				Fn.bind(isMergableWrapper, null, value),
				leftPoint,
				rightPoint
			);
			if (wrapper) {
				// Because the node itself may have the context value
				// set, and wrapping it will not unset it.
				pruneContext(node);
			} else {
				// Because the node wasn't wrapped because it itself is
				// a wrapper, but possibly not with the given context
				// value.
				addContextValue(node, value);
			}
		}

		function clearOverride(node) {
			// TODO Restacking in clearOverride is a hack. Instead we
			//      should support it as an argument of mutate().
			node = restack(node, hasContext, Html.isUnrenderedWhitespace, Html.hasInlineStyle, leftPoint, rightPoint);
			if (hasContext(node) && ensureWrapper(node, createWrapper, hasContext, Fn.bind(isMergableWrapper, null, contextValue), leftPoint, rightPoint)) {
				pruneContext(node);
			}

			// Because we don't want to remove any existing context if
			// not necessary (See pushDownOverride and setContext).
			if (!hasContext(node)) {
				pruneContext(node);
			}
		}

		function clearOverrideRecStep(node) {
			// Different from clearOverride because clearOverride() only
			// clears context overrides, while during a recursive
			// clearing we want to clear the override always regardless
			// of whether it is equal to context.
			pruneContext(node);
		}

		function clearOverrideRec(node) {
			Dom.walkRec(node, clearOverrideRecStep);
		}

		function pushDownOverride(node, override) {
			// Because we don't clear any context overrides, we don't
			// need to push them down either.
			if (null == override || hasSomeContextValue(node) || isContextOverride(override)) {
				return;
			}
			wrapContextValue(node, override);
		}

		function setContext(node, override, isNonClearableOverride) {
			// Because we don't clear any context overrides, we don't
			// need to set them either.
			if (isContextOverride(override)) {
				return;
			}
			Dom.walk(node.firstChild, clearOverrideRec);
			wrapContextValue(node, contextValue);
		}

		return {
			hasContext: hasContext,
			getOverride: getOverride,
			clearOverride: clearOverride,
			pushDownOverride: pushDownOverride,
			setContext: setContext,
			isUpperBoundary: isUpperBoundary_default
		};
	}

	function makeStyleFormatter(styleName, styleValue, createWrapper, isStyleEq, isReusable, isPrunable, leftPoint, rightPoint) {
		function getOverride(node) {
			var override = Dom.getStyle(node, styleName);
			return !Strings.empty(override) ? override : null;
		}
		function hasContext(node) {
			return isStyleEq(Dom.getStyle(node, styleName), styleValue);
		}
		function isContextOverride(value) {
			return isStyleEq(value, styleValue);
		}
		function hasSomeContextValue(node) {
			return !Strings.empty(Dom.getStyle(node, styleName));
		}
		function hasContextValue(node, value) {
			return isStyleEq(Dom.getStyle(node, styleName), value);
		}
		function addContextValue(node, value) {
			Dom.setStyle(node, styleName, value);
		}
		function delContextValue(node) {
			Dom.setStyle(node, styleName, null);
		}
		return makeFormatter(
			styleValue,
			getOverride,
			hasContext,
			isContextOverride,
			hasSomeContextValue,
			hasContextValue,
			addContextValue,
			delContextValue,
			createWrapper,
			isReusable,
			isPrunable,
			leftPoint,
			rightPoint
		);
	}

	function makeNodeFormatter(nodeName, leftPoint, rightPoint, unformat) {
		function createWrapper() {
			return document.createElement(nodeName);
		}
		function getOverride(node) {
			return nodeName === node.nodeName || null;
		}
		function hasContext(node) {
			if (unformat) {
				// Because the only difference between formatter and
				// unformatter is that there isn't for example a no-bold
				// element - the absence of a bold ancestor results in the
				// node having a no-bold context, but there is no element to
				// set a no-bold context explicitly (actually there is,
				// <span style="font-weight: normal">, but that kind of
				// functionality isn't implemented yet).
				return false;
			}
			return nodeName === node.nodeName;
		}
		function isContextOverride(value) {
			if (unformat) {
				// Because unformatting has no context value.
				return false;
			}
			return null != value;
		}
		function isReusable(node) {
			// Because we don't want to merge with a context node that
			// does more than just provide a context (for example a <b>
			// node may have a class which shouldn't also being wrapped
			// around the merged-with node).
			return node.nodeName === nodeName && !Dom.attrs(node).length;
		}
		function hasSomeContextValue(node) {
			return node.nodeName === nodeName;
		}
		var hasContextValue = hasContext;
		var addContextValue = Fn.noop;
		var delContextValue = Fn.noop;
		var isPrunable = isPrunable_default;
		return makeFormatter(
			nodeName,
			getOverride,
			hasContext,
			isContextOverride,
			hasSomeContextValue,
			hasContextValue,
			addContextValue,
			delContextValue,
			createWrapper,
			isReusable,
			isPrunable,
			leftPoint,
			rightPoint
		);
	}

	function format(liveRange, nodeName, remove) {
		// Because we should avoid splitTextContainers() if this call is a noop.
		if (liveRange.collapsed) {
			return;
		}
		fixupRange(liveRange, function (range, leftPoint, rightPoint) {
			mutate(range, makeNodeFormatter(nodeName, leftPoint, rightPoint, remove), remove);
		});
	}

	function findReusableAncestor(range, hasContext, getOverride, isUpperBoundary, isReusable, isObstruction) {
		var obstruction = null;
		function beforeAfter(node) {
			obstruction = (obstruction
						   || (!Html.isUnrenderedWhitespace(node)
							   && !hasContext(node)));
		}
		walkBoundary(range, Fn.noop, beforeAfter, Fn.noop, Fn.noop);
		if (obstruction) {
			return null;
		}
		var cac = range.commonAncestorContainer;
		if (3 === cac.nodeType) {
			cac = cac.parentNode;
		}
		function untilIncl(node) {
			// Because we prefer a node above the cac if possible.
			return (cac !== node && isReusable(node)) || isUpperBoundary(node) || isObstruction(node);
		}
		var cacToReusable = Dom.childAndParentsUntilIncl(cac, untilIncl);
		var reusable = Arrays.last(cacToReusable);
		if (!isReusable(reusable)) {
			// Because, although we preferred a node above the cac, we
			// fall back to the cac.
			return isReusable(cac) ? cac : null;
		}
		ascendWalkSiblings(cacToReusable, false, Fn.noop, beforeAfter, Fn.noop, beforeAfter);
		if (obstruction) {
			return isReusable(cac) ? cac : null;
		}
		return reusable;
	}

	function formatStyle(liveRange, styleName, styleValue, createWrapper, isStyleEq, isReusable, isPrunable, isObstruction) {
		createWrapper = createWrapper || createStyleWrapper_default;
		isStyleEq = isStyleEq || isStyleEq_default;
		isReusable = isReusable || isStyleWrapperReusable_default;
		isPrunable = isPrunable || isStyleWrapperPrunable_default;
		isObstruction = isObstruction || Fn.complement(Html.hasInlineStyle);
		// Because we should avoid splitTextContainers() if this call is a noop.
		if (liveRange.collapsed) {
			return;
		}
		fixupRange(liveRange, function (range, leftPoint, rightPoint) {
			var formatter = makeStyleFormatter(
				styleName,
				styleValue,
				createWrapper,
				isStyleEq,
				isReusable,
				isPrunable,
				leftPoint,
				rightPoint
			);
			var reusableAncestor = findReusableAncestor(
				range,
				formatter.hasContext,
				formatter.getOverride,
				formatter.isUpperBoundary,
				isReusable,
				isObstruction
			);
			if (reusableAncestor) {
				formatter.setContext(reusableAncestor);
			} else {
				mutate(range, formatter, false);
			}
		});
	}

	/**
	 * Ensures that the given boundaries are neither in start nor end
	 * positions. In other words, after this operation, both will have
	 * preceding and following siblings.
	 *
	 * Expansion/trimming can be controlled via expandUntil and
	 * trimUntil, but may cause one or both of the boundaries to remain
	 * in start or end position.
	 */
	function trimExpandBoundaries(startPoint, endPoint, trimUntil, expandUntil, ignore) {
		var collapsed = startPoint.equals(endPoint);
		Dom.trimBoundaries(startPoint, endPoint, trimUntil, ignore);
		Dom.expandBoundaries(startPoint, endPoint, expandUntil, ignore);
		if (collapsed) {
			endPoint.setFrom(startPoint);
		}
	}

	function splitBoundary(liveRange, clone, belowCacUntil, cacAndAboveUntil, boundariesChildrenOfUnsplitNode) {
		fixupRange(liveRange, function (range, leftPoint, rightPoint) {

			var normalizedLeft = boundariesChildrenOfUnsplitNode ? leftPoint : leftPoint.clone();
			var normalizedRight = boundariesChildrenOfUnsplitNode ? rightPoint : rightPoint.clone();
			Html.normalizeBoundary(normalizedLeft);
			Html.normalizeBoundary(normalizedRight);
			Dom.setRangeFromBoundaries(range, normalizedLeft, normalizedRight);

			var cac = range.commonAncestorContainer;
			var collapsed = range.collapsed;
			var leftWrapper = null;
			var inbetweenWrapper = null;
			var splitCac = !cacAndAboveUntil(cac);
			var fromCacToTop = Dom.childAndParentsUntil(cac, cacAndAboveUntil);
			var topmostUnsplitNode = fromCacToTop.length ? Arrays.last(fromCacToTop).parentNode : cac;
			var removeEmpty = [];

			function carryDown(elem, stop) {
				return stop || belowCacUntil(elem);
			}

			function intoWrapper(wrapper, node) {
				var parent = node.parentNode;
				if (!wrapper || parent.previousSibling !== wrapper) {
					wrapper = clone(parent);
					removeEmpty.push(parent);
					Dom.insert(wrapper, parent, false);
					if (leftPoint.node === parent && !leftPoint.atEnd) {
						leftPoint.node = wrapper;
					}
				}
				moveAdjust(node, wrapper, true, leftPoint, rightPoint);
				return wrapper;
			}

			function intoWrapperLeft(node, stop) {
				if (!stop && (splitCac || node.parentNode !== cac)) {
					leftWrapper = intoWrapper(leftWrapper, node);
				}
			}

			function intoWrapperInbetween(node) {
				if (splitCac) {
					inbetweenWrapper = intoWrapper(inbetweenWrapper, node);
				}
			}

			walkBoundaryLeftRightInbetween(range, carryDown, intoWrapperLeft, Fn.noop, intoWrapperLeft, Fn.noop, Fn.noop, intoWrapperInbetween);
			ascendWalkSiblings(fromCacToTop, false, Fn.returnFalse, intoWrapperLeft, Fn.noop, Fn.noop);

			Arrays.forEach(removeEmpty, function (elem) {
				if (!elem.firstChild) {
					removeShallowAdjust(elem, leftPoint, rightPoint);
				}
			});

			// Because the selection may still be inside the split
			// nodes, for example after split the DOM may look like
			//
			//     <b>1</b><b>{2</b><i>3</i><i>}4</i>
			//
			// we trim the selection to correct <i>}4</i>
			// and expand the selection to correct <b>{2</b>.
			// This should make both start and end points children of the
			// same cac which is going to be the
			// topmostUnsplitNode. This is usually what one expects the
			// range to look like after a split. Note: if belowCacUntil
			// returns true, start and end points may not be become
			// children of the topmostUnsplitNode. Also, if
			// belowCacUntil returns true, the selection may be moved
			// out of an unsplit node which may be unexpected.
			if (boundariesChildrenOfUnsplitNode) {
				trimExpandBoundaries(leftPoint, rightPoint, null, function (point) {
					return point.parent() === topmostUnsplitNode;
				});
			}
		});
	}

	return {
		format: format,
		formatStyle: formatStyle,
		splitBoundary: splitBoundary
	};
});
