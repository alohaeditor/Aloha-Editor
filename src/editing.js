/* editing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * TODO formatStyle: in the following case the outer "font-family:
 *      arial" span should be removed.  Can be done similar to how
 *      findReusableAncestor() works.
 *      <span style="font-family: arial">
 *         <span style="font-family: times">one</span>
 *         <span style="font-family: helvetica">two<span>
 *      </span>
 * TODO better handling of the last <br/> in a block and generally of
 *      unrendered whitespace. For example formatting
 *      <p>{some<br/>text<br/>}</p>
 *      will result in
 *      <p>{<b>some<br/>text<br/></b>}</p>
 *      while it should probably be
 *      <p>{<b>some</br>text</b>}<br/></p>
 */
define([
	'dom',
	'traversing',
	'arrays',
	'maps',
	'strings',
	'functions',
	'html',
	'ranges',
	'cursors',
	'content'
], function Editing(
	dom,
	traversing,
	arrays,
	maps,
	strings,
	fn,
	html,
	ranges,
	cursors,
	content
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('editing');
	}

	/**
	 * Walks the siblings of the given child, calling before for
	 * siblings before the given child, after for siblings after the
	 * given child, and at for the given child.
	 */
	function walkSiblings(parent, beforeAtAfterChild, before, at, after, arg) {
		var func = before;
		traversing.walk(parent.firstChild, function (child) {
			if (child !== beforeAtAfterChild) {
				func(child, arg);
			} else {
				func = after;
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
			traversing.walk(ascendNodes[0].firstChild, before, args[0]);
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
		// inside/outside (for startAtEnd/endAtEnd positions the nodes are
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
	 * (dom.splitTextContainers).
	 */
	function walkBoundaryLeftRightInbetween(liveRange, carryDown, stepLeftStart, stepRightStart, stepLeftEnd, stepRightEnd, stepPartial, stepInbetween, arg) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		if (dom.isTextNode(cac)) {
			cac = cac.parentNode;
		}
		var sc        = liveRange.startContainer;
		var ec        = liveRange.endContainer;
		var so        = liveRange.startOffset;
		var eo        = liveRange.endOffset;
		var collapsed = liveRange.collapsed;
		var start       = dom.nodeAtOffset(sc, so);
		var end         = dom.nodeAtOffset(ec, eo);
		var startAtEnd  = dom.isAtEnd(sc, so);
		var endAtEnd    = dom.isAtEnd(ec, eo);
		var ascStart    = traversing.childAndParentsUntilNode(start, cac);
		var ascEnd      = traversing.childAndParentsUntilNode(end,   cac);
		var stepAtStart = makePointNodeStep(start, startAtEnd, stepRightStart, stepPartial);
		var stepAtEnd   = makePointNodeStep(end, endAtEnd, stepRightEnd, stepPartial);
		ascendWalkSiblings(ascStart, startAtEnd, carryDown, stepLeftStart, stepAtStart, stepRightStart, arg);
		ascendWalkSiblings(ascEnd, endAtEnd, carryDown, stepLeftEnd, stepAtEnd, stepRightEnd, arg);
		var cacChildStart = arrays.last(ascStart);
		var cacChildEnd   = arrays.last(ascEnd);
		stepAtStart = makePointNodeStep(start, startAtEnd, stepInbetween, stepPartial);
		traversing.walkUntilNode(cac.firstChild, stepLeftStart, cacChildStart, arg);
		if (cacChildStart) {
			var next = cacChildStart.nextSibling;
			if (cacChildStart === cacChildEnd) {
				if (!collapsed) {
					stepPartial(cacChildStart, arg);
				}
			} else {
				stepAtStart(cacChildStart, arg);
				traversing.walkUntilNode(next, stepInbetween, cacChildEnd, arg);
				if (cacChildEnd) {
					next = cacChildEnd.nextSibling;
					stepAtEnd(cacChildEnd, arg);
				}
			}
			if (cacChildEnd) {
				traversing.walk(next, stepRightEnd, arg);
			}
		}
	}

	/**
	 * Simplifies walkBoundaryLeftRightInbetween from left/right/inbetween to just inside/outside.
	 *
	 * Requires range's boundary points to be between nodes
	 * (dom.splitTextContainers).
	 */
	function walkBoundaryInsideOutside(liveRange, carryDown, stepOutside, stepPartial, stepInside, arg) {
		walkBoundaryLeftRightInbetween(liveRange, carryDown, stepOutside, stepInside, stepInside, stepOutside, stepPartial, stepInside, arg);
	}

	/**
	 * Pushes down an implied context above or at pushDownFrom to the
	 * given range by clearing all overrides from pushDownFrom
	 * (inclusive) to range.commonAncestorContainer, and clearing all
	 * overrides inside and along the range's boundary (see
	 * walkBoundaryInsideOutside()), invoking pushDownOverride on all
	 * siblings of the range boundary that are not contained in it.
	 *
	 * Requires range's boundary points to be between nodes
	 * (dom.splitTextContainers).
	 */
	function pushDownContext(liveRange, pushDownFrom, cacOverride, getOverride, clearOverride, clearOverrideRec, pushDownOverride) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		walkBoundaryInsideOutside(liveRange, getOverride, pushDownOverride, clearOverride, clearOverrideRec, cacOverride);
		var fromCacToTop = traversing.childAndParentsUntilInclNode(
			cac,
			pushDownFrom
		);
		ascendWalkSiblings(fromCacToTop, false, getOverride, pushDownOverride, clearOverride, pushDownOverride, null);
		clearOverride(pushDownFrom);
	}

	function findReusableAncestor(range, hasContext, getOverride, isUpperBoundary, isReusable, isObstruction) {
		var obstruction = null;
		function beforeAfter(node) {
			obstruction = (obstruction
						   || (!html.isUnrenderedWhitespace(node)
							   && !hasContext(node)));
		}
		walkBoundaryInsideOutside(range, fn.noop, beforeAfter, fn.noop, fn.noop);
		if (obstruction) {
			return null;
		}
		var cac = range.commonAncestorContainer;
		if (dom.Nodes.TEXT === cac.nodeType) {
			cac = cac.parentNode;
		}
		function untilIncl(node) {
			// Because we prefer a node above the cac if possible.
			return (cac !== node && isReusable(node)) || isUpperBoundary(node) || isObstruction(node);
		}
		var cacToReusable = traversing.childAndParentsUntilIncl(cac, untilIncl);
		var reusable = arrays.last(cacToReusable);
		if (!isReusable(reusable)) {
			// Because, although we preferred a node above the cac, we
			// fall back to the cac.
			return isReusable(cac) ? cac : null;
		}
		ascendWalkSiblings(cacToReusable, false, fn.noop, beforeAfter, fn.noop, beforeAfter);
		if (obstruction) {
			return isReusable(cac) ? cac : null;
		}
		return reusable;
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
	 * (dom.splitTextContainers).
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
	function mutate(liveRange, formatter) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		var isUpperBoundary = formatter.isUpperBoundary;
		var getOverride = formatter.getOverride;
		var getInheritableOverride = formatter.getInheritableOverride;
		var pushDownOverride = formatter.pushDownOverride;
		var hasContext = formatter.hasContext;
		var hasInheritableContext = formatter.hasInheritableContext;
		var setContext = formatter.setContext;
		var clearOverride = formatter.clearOverride;
		var isObstruction = formatter.isObstruction;
		var isReusable = formatter.isReusable;
		var isContextOverride = formatter.isContextOverride;
		var isClearable = formatter.isClearable;
		var clearOverrideRec = formatter.clearOverrideRec  || function (node) {
			traversing.walkRec(node, clearOverride);
		};
		var topmostOverrideNode = null;
		var cacOverride = null;
		var isNonClearableOverride = false;
		var upperBoundaryAndAbove = false;
		var fromCacToContext = traversing.childAndParentsUntilIncl(
			cac,
			function (node) {
				// Because we shouldn't expect hasContext to handle the document
				// element (which has nodeType 9).
				return (
					!node.parentNode
						|| dom.Nodes.DOCUMENT === node.parentNode.nodeType
							|| hasInheritableContext(node)
				);
			}
		);
		fromCacToContext.forEach(function (node) {
			upperBoundaryAndAbove = upperBoundaryAndAbove || isUpperBoundary(node);
			// Because we are only interested in non-context overrides.
			var override = getInheritableOverride(node);
			if (null != override && !isContextOverride(override)) {
				topmostOverrideNode = node;
				isNonClearableOverride = isNonClearableOverride || upperBoundaryAndAbove || !isClearable(node);
				if (null == cacOverride) {
					cacOverride = override;
				}
			}
		});
		if (null == cacOverride) {
			cacOverride = getInheritableOverride(cac);
		}

		if (hasInheritableContext(arrays.last(fromCacToContext)) && !isNonClearableOverride) {
			if (!topmostOverrideNode) {
				// Because, if there is no override in the way, we only
				// need to clear the overrides contained in the range.
				walkBoundaryInsideOutside(liveRange, getOverride, pushDownOverride, clearOverride, clearOverrideRec);
			} else {
				var pushDownFrom = topmostOverrideNode;
				pushDownContext(liveRange, pushDownFrom, cacOverride, getOverride, clearOverride, clearOverrideRec, pushDownOverride);
			}
		} else {
			var mySetContext = function (node, override) {
				setContext(node, override, isNonClearableOverride);
			};
			var reusableAncestor = findReusableAncestor(liveRange, hasContext, getOverride, isUpperBoundary, isReusable, isObstruction);
			if (reusableAncestor) {
				mySetContext(reusableAncestor);
			} else {
				walkBoundaryInsideOutside(liveRange, getOverride, pushDownOverride, clearOverride, mySetContext);
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

	function wrap(node, wrapper, leftPoint, rightPoint) {
		if (!content.allowsNesting(wrapper.nodeName, node.nodeName)) {
			return false;
		}
		if (wrapper.parentNode) {
			dom.removeShallowPreservingBoundaries(wrapper, [leftPoint, rightPoint]);
		}
		adjustPointWrap(leftPoint, node, wrapper);
		adjustPointWrap(rightPoint, node, wrapper);
		dom.wrap(node, wrapper);
		return true;
	}

	// NB: depends on fixupRange to use ranges.trimClosingOpening() to move the
	// leftPoint out of an cursor.atEnd position to the first node that is to be
	// moved.
	function moveBackIntoWrapper(node, ref, atEnd, leftPoint, rightPoint) {
		// Because the points will just be moved with the node, we don't need to
		// do any special preservation.
		dom.insert(node, ref, atEnd);
	}

	function fixupRange(liveRange, mutate, trim) {
		// Because we are mutating the range several times and don't want the
		// caller to see the in-between updates, and because we are using
		// ranges.trim() below to adjust the range's boundary points, which we
		// don't want the browser to re-adjust (which some browsers do).
		var range = ranges.stableRange(liveRange);

		// Because making the assumption that boundary points are between nodes
		// makes the algorithms generally a bit simpler.
		dom.splitTextContainers(range);

		var splitStart = cursors.cursorFromBoundaryPoint(
			range.startContainer,
			range.startOffset
		);

		var splitEnd = cursors.cursorFromBoundaryPoint(
			range.endContainer,
			range.endOffset
		);

		// Because we want unbolding
		// <b>one<i>two{</i>three}</b>
		// to result in
		// <b>one<i>two</i></b>three
		// and not in
		// <b>one</b><i><b>two</b></i>three
		// even though that would be cleaned up in the restacking pass
		// afterwards.
		// Also, because moveBackIntoWrapper() requires the
		// left boundary point to be next to a non-ignorable node.
		if (false !== trim) {
			ranges.trimClosingOpening(
				range,
				html.isUnrenderedWhitespace,
				html.isUnrenderedWhitespace
			);
		}

		// Because mutation needs to keep track and adjust boundary points so we
		// can preserve the range.
		var leftPoint = cursors.cursorFromBoundaryPoint(
			range.startContainer,
			range.startOffset
		);

		var rightPoint = cursors.cursorFromBoundaryPoint(
			range.endContainer,
			range.endOffset
		);

		var formatter = mutate(range, leftPoint, rightPoint);
		if (formatter) {
			formatter.postprocess();
		}

		cursors.setToRange(range, leftPoint, rightPoint);

		// Because we want to ensure that this algorithm doesn't
		// introduce any additional splits between text nodes.
		dom.joinTextNodeAdjustRange(splitStart.node, range);
		dom.joinTextNodeAdjustRange(splitEnd.node, range);

		if (formatter) {
			formatter.postprocessTextNodes(range);
		}

		ranges.setFromReference(liveRange, range);
	}

	function restackRec(node, hasContext, ignoreHorizontal, ignoreVertical) {
		if (dom.Nodes.ELEMENT !== node.nodeType || !ignoreVertical(node)) {
			return null;
		}
		var maybeContext = traversing.nextWhile(node.firstChild, ignoreHorizontal);
		if (!maybeContext) {
			return null;
		}
		var notIgnorable = traversing.nextWhile(maybeContext.nextSibling, ignoreHorizontal);
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
			return null;
		}
		if (!wrap(node, context, leftPoint, rightPoint)) {
			return null;
		}
		return context;
	}

	function ensureWrapper(node, createWrapper, isWrapper, isMergable, pruneContext, addContextValue, leftPoint, rightPoint) {
		var sibling = node.previousSibling;
		if (sibling && isMergable(sibling) && isMergable(node)) {
			moveBackIntoWrapper(node, sibling, true, leftPoint, rightPoint);
			// Because the node itself may be a wrapper.
			pruneContext(node);
		} else if (!isWrapper(node)) {
			var wrapper = createWrapper();
			if (wrap(node, wrapper, leftPoint, rightPoint)) {
				// Because we are just making sure (probably not
				// necessary since the node isn't a wrapper).
				pruneContext(node);
			} else {
				// Because if wrapping is not successful, we try again
				// one level down.
				traversing.walk(node.firstChild, function (node) {
					ensureWrapper(node, createWrapper, isWrapper, isMergable, pruneContext, addContextValue, leftPoint, rightPoint);
				});
			}
		} else {
			// Because the node itself is a wrapper, but possibly not
			// with the given context value.
			addContextValue(node);
		}
	}

	function makeFormatter(contextValue, leftPoint, rightPoint, impl) {
		var hasContext = impl.hasContext;
		var isContextOverride = impl.isContextOverride;
		var hasSomeContextValue = impl.hasSomeContextValue;
		var hasContextValue = impl.hasContextValue;
		var addContextValue = impl.addContextValue;
		var removeContext = impl.removeContext;
		var createWrapper = impl.createWrapper;
		var isReusable = impl.isReusable;
		var isPrunable = impl.isPrunable;

		// Because we want to optimize reuse, we remembering any wrappers we created.
		var wrappersByContextValue = {};
		var wrappersWithContextValue = [];
		var removedNodeSiblings = [];

		function pruneContext(node) {
			if (!hasSomeContextValue(node)) {
				return;
			}
			removeContext(node);
			// TODO if the node is not prunable but overrides the
			// context (for example <b class="..."></b> may not be
			// prunable), we should descend into the node and set the
			// unformatting-context inside.
			if (!isPrunable(node)) {
				return;
			}
			if (node.previousSibling) {
				removedNodeSiblings.push(node.previousSibling);
			}
			if (node.nextSibling) {
				removedNodeSiblings.push(node.nextSibling);
			}
			dom.removeShallowPreservingBoundaries(node, [leftPoint, rightPoint]);
		}

		function createContextWrapper(value) {
			var wrapper = createWrapper(value);
			var key = ':' + value;
			var wrappers = wrappersByContextValue[key] = wrappersByContextValue[key] || [];
			wrappers.push(wrapper);
			wrappersWithContextValue.push([wrapper, value]);
			return wrapper;
		}

		function isClearable(node) {
			var clone = node.cloneNode(false);
			removeContext(clone);
			return isPrunable(clone);
		}

		function isMergableWrapper(value, node) {
			if (!isReusable(node)) {
				return false;
			}
			var key =  ':' + value;
			var wrappers = wrappersByContextValue[key] || [];
			if (arrays.contains(wrappers, node)) {
				return true;
			}
			if (hasSomeContextValue(node) && !hasContextValue(node, value)) {
				return false;
			}
			// Because we assume something is mergeable if it doesn't
			// provide any context value besides the one we are
			// applying, and something doesn't provide any context value
			// at all if it is prunable.
			return isClearable(node);
		}

		function wrapContextValue(node, value) {
			ensureWrapper(
				node,
				fn.bind(createContextWrapper, null, value),
				isReusable,
				fn.bind(isMergableWrapper, null, value),
				pruneContext,
				fn.bind(addContextValue, null, value),
				leftPoint,
				rightPoint
			);
		}

		function clearOverride(node) {
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
			traversing.walkRec(node, clearOverrideRecStep);
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
			traversing.walk(node.firstChild, clearOverrideRec);
			wrapContextValue(node, contextValue);
		}

		function restackMergeWrapper(wrapper, contextValue, mergeNext) {
			var sibling = mergeNext ? wrapper.nextSibling : wrapper.previousSibling;
			if (!sibling) {
				return;
			}
			function isGivenContextValue(node) {
				return hasContextValue(node, contextValue);
			}
			sibling = restack(sibling, isGivenContextValue, html.isUnrenderedWhitespace, html.hasInlineStyle, leftPoint, rightPoint);
			if (!sibling) {
				return;
			}
			var isMergable = fn.bind(isMergableWrapper, null, contextValue);
			var createWrapper = fn.bind(createContextWrapper, null, contextValue);
			var addValue = fn.bind(addContextValue, null, contextValue);
			var mergeNode = mergeNext ? sibling : wrapper;
			ensureWrapper(mergeNode, createWrapper, isReusable, isMergable, pruneContext, addValue, leftPoint, rightPoint);
		}

		function mergeWrapper(wrapper, contextValue) {
			restackMergeWrapper(wrapper, contextValue, true);
			restackMergeWrapper(wrapper, contextValue, false);
		}

		function postprocess() {
			wrappersWithContextValue.forEach(function (wrapperAndContextValue) {
				mergeWrapper(wrapperAndContextValue[0], wrapperAndContextValue[1]);
			});
		}

		function postprocessTextNodes(range) {
			removedNodeSiblings.forEach(function (node) {
				dom.joinTextNodeAdjustRange(node, range);
			});
		}

		return {
			hasContext: hasContext,
			isReusable: isReusable,
			clearOverride: clearOverride,
			isClearable: isClearable,
			pushDownOverride: pushDownOverride,
			setContext: setContext,
			isContextOverride: isContextOverride,
			postprocess: postprocess,
			postprocessTextNodes: postprocessTextNodes,
			hasInheritableContext: impl.hasInheritableContext,
			isObstruction: impl.isObstruction,
			getOverride: impl.getOverride,
			getInheritableOverride: impl.getInheritableOverride,
			isUpperBoundary: impl.isUpperBoundary
		};
	}

	function isUpperBoundary_default(node) {
		// Because the body element is an obvious upper boundary, and
		// because, if we are inside a block element, we shouldn't touch
		// it as that causes changes in the layout, and because, when we
		// are inside an editable, we shouldn't make modifications
		// outside of it (if we are not inside an editable, we don't
		// care).
		return 'BODY' === node.nodeName || html.hasBlockStyle(node) || dom.isEditingHost(node);
	}

	function isStyleEqual_default(styleValueA, styleValueB) {
		return styleValueA === styleValueB;
	}

	var wrapperProperties = {
		underline: {
			name: 'U',
			nodes: ['U'],
			style: 'text-decoration',
			value: 'underline',
			normal: 'none',
			normalize: {}
		},
		bold: {
			name: 'B',
			nodes: ['B', 'STRONG'],
			style: 'font-weight',
			value: 'bold',
			normal: 'normal',
			normalize: {
				/* ie7/ie8 only */
				'700': 'bold',
				'400': 'normal'
			}
		},
		italic: {
			name: 'I',
			nodes: ['I', 'EM'],
			style: 'font-style',
			value: 'italic',
			normal: 'normal',
			normalize: {}
		}
	};
	wrapperProperties['emphasis'] = maps.merge(wrapperProperties.italic, {name: 'EM'});
	wrapperProperties['strong'] = maps.merge(wrapperProperties.bold, {name: 'STRONG'});

	wrapperProperties['underline'] = wrapperProperties.underline;
	wrapperProperties['bold'] = wrapperProperties.bold;
	wrapperProperties['italic'] = wrapperProperties.italic;

	function makeStyleFormatter(styleName, styleValue, leftPoint, rightPoint, opts) {
		var isStyleEqual = opts.isStyleEqual || isStyleEqual_default;
		var nodeNames = [];
		var unformat = false;
		var wrapperProps = wrapperProperties[styleName];
		if (wrapperProps) {
			nodeNames = wrapperProps.nodes;
			styleName = wrapperProps.style;
			unformat = !styleValue;
			styleValue = unformat ? wrapperProps.normal : wrapperProps.value;
		}
		function normalizeStyleValue(value) {
			if (wrapperProps && wrapperProps.normalize[value]) {
				value = wrapperProps.normalize[value];
			}
			return value;
		}
		function getOverride(node) {
			if (arrays.contains(nodeNames, node.nodeName)) {
				return wrapperProps.value;
			}
			var override = dom.getStyle(node, styleName);
			return !strings.empty(override) ? override : null;
		}
		function getInheritableOverride(node) {
			if (arrays.contains(nodeNames, node.nodeName)) {
				return wrapperProps.value;
			}
			var override = dom.getComputedStyle(node, styleName);
			return !strings.empty(override) ? override : null;
		}
		function isContextStyle(value) {
			return isStyleEqual(normalizeStyleValue(value), styleValue);
		}
		function isContextOverride(value) {
			return isContextStyle(value);
		}
		function hasSomeContextValue(node) {
			if (arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return !strings.empty(dom.getStyle(node, styleName));
		}
		function hasContextValue(node, value) {
			value = normalizeStyleValue(value);
			if (arrays.contains(nodeNames, node.nodeName) && isStyleEqual(wrapperProps.value, value)) {
				return true;
			}
			return isStyleEqual(dom.getStyle(node, styleName), value);
		}
		function hasContext(node) {
			if (!unformat && arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return isContextStyle(dom.getStyle(node, styleName));
		}
		function hasInheritableContext(node) {
			if (!unformat && arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			if (unformat && 'BODY' === node.nodeName) {
				return true;
			}
			// Because default values of not-inherited styles don't
			// provide any context.
			// TODO This causes any classes that set a non-inherited
			// style to the default value, for example
			// "text-decoration: none" to be ignored.
			if (unformat && html.isStyleInherited(styleName)) {
				return isContextStyle(dom.getStyle(node, styleName));
			}
			return isContextStyle(dom.getComputedStyle(node, styleName));
		}
		function addContextValue(value, node) {
			value = normalizeStyleValue(value);
			if (arrays.contains(nodeNames, node.nodeName) && isStyleEqual(wrapperProps.value, value)) {
				return;
			}
			// Because we don't want to add an explicit style if for
			// example the element already has a class set on it. For
			// example: <span class="bold"></span>.
			if (isStyleEqual(normalizeStyleValue(dom.getComputedStyle(node, styleName)), value)) {
				return;
			}
			dom.setStyle(node, styleName, value);
		}
		function removeContext(node) {
			dom.removeStyle(node, styleName);
		}
		function isReusable(node) {
			if (arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return 'SPAN' === node.nodeName;
		}
		function isPrunable(node) {
			return isReusable(node) && !dom.hasAttrs(node);
		}
		function createWrapper(value) {
			value = normalizeStyleValue(value);
			if (wrapperProps && isStyleEqual(wrapperProps.value, value)) {
				return document.createElement(wrapperProps.name);
			}
			var wrapper = document.createElement('SPAN');
			dom.setStyle(wrapper, styleName, value);
			return wrapper;
		}
		var impl = maps.merge({
			getOverride: getOverride,
			getInheritableOverride: getInheritableOverride,
			hasContext: hasContext,
			hasInheritableContext: hasInheritableContext,
			isContextOverride: isContextOverride,
			hasSomeContextValue: hasSomeContextValue,
			hasContextValue: hasContextValue,
			addContextValue: addContextValue,
			removeContext: removeContext,
			isPrunable: isPrunable,
			isStyleEqual: isStyleEqual,
			createWrapper: createWrapper,
			isReusable: isReusable,
			isObstruction: fn.complement(html.hasInlineStyle),
			isUpperBoundary: isUpperBoundary_default
		}, opts);
		return makeFormatter(styleValue, leftPoint, rightPoint, impl);
	}

	function makeElemFormatter(nodeName, unformat, leftPoint, rightPoint, opts) {
		// Because we assume nodeNames are always uppercase, but don't
		// want the user to remember this detail.
		nodeName = nodeName.toUpperCase();
		function createWrapper() {
			return document.createElement(nodeName);
		}
		function getOverride(node) {
			return nodeName === node.nodeName || null;
		}
		function hasContext(node) {
			if (unformat) {
				// Because unformatting has no context value.
				return false;
			}
			return nodeName === node.nodeName;
		}
		function hasInheritableContext(node) {
			// Because there can be no nodes above the body element that
			// can provide a context.
			if (unformat && 'BODY' === node.nodeName) {
				return true;
			}
			return hasContext(node);
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
			return node.nodeName === nodeName && !dom.hasAttrs(node);
		}
		function isPrunable(node) {
			return isReusable(node);
		}
		function hasSomeContextValue(node) {
			return node.nodeName === nodeName;
		}
		var impl = maps.merge({
			getOverride: getOverride,
			// Because inheritable overrides are only useful for
			// formatters that consider the CSS style.
			getInheritableOverride: getOverride,
			hasContext: hasContext,
			hasInheritableContext: hasInheritableContext,
			isContextOverride: isContextOverride,
			hasSomeContextValue: hasSomeContextValue,
			// Because hasContextValue and hasSomeContextValue makes no
			// difference for an element formatter, since there is only one
			// context value.
			hasContextValue: hasSomeContextValue,
			addContextValue: fn.noop,
			removeContext: fn.noop,
			createWrapper: createWrapper,
			isReusable: isReusable,
			isPrunable: isPrunable,
			isObstruction: fn.complement(html.hasInlineStyle),
			isUpperBoundary: isUpperBoundary_default
		}, opts);
		return makeFormatter(nodeName, leftPoint, rightPoint, impl);
	}

	/**
	 * Ensures the given range is wrapped by elements with a given nodeName.
	 *
	 * @param {Range} liveRange The range of the current selection.
	 * @param {String} nodeName The name of the tag that should serve as the
	 *                          wrapping node.
	 * @param {Boolean} remove Optional flag, which when set to false will cause
	 *                         the given markup to be removed (unwrapped) rather
	 *                         then set.
	 * @param {Object} opts A map of options (all optional):
	 *        createWrapper - a function that returns a new empty
	 *        wrapper node to use.
	 *
	 *        isReusable - a function that returns true if a given node,
	 *        already in the DOM at the correct place, can be reused
	 *        instead of creating a new wrapper node. May be merged with
	 *        other reusable or newly created wrapper nodes.
	 */
	function wrapElem(liveRange, nodeName, remove, opts) {
		opts = opts || {};

		// Because of advanced compilation
		if (null != opts['createWrapper']) {
			opts.createWrapper = opts['createWrapper'];
		}
		if (null != opts['isReusable']) {
			opts.isReusable = opts['isReusable'];
		}

		// Because we should avoid splitTextContainers() if this call is a noop.
		if (liveRange.collapsed) {
			return;
		}

		fixupRange(liveRange, function (range, leftPoint, rightPoint) {
			var formatter = makeElemFormatter(nodeName, remove, leftPoint, rightPoint, opts);
			mutate(range, formatter);
			return formatter;
		});

		return liveRange;
	}

	/**
	 * Ensures the given range is wrapped by elements that have a given
	 * CSS style set.
	 *
	 * @param styleName a CSS style name.
	 *        Please note that not-inherited styles currently may (or
	 *        may not) cause undesirable results.  See also
	 *        html.isStyleInherited().
	 *
	 *        The underline style can't be unformatted inside a
	 *        non-clearable ancestor ("text-decoration: none" doesn't do
	 *        anything as the underline will be drawn by the ancestor).
	 *
	 * @param opts all options supported by wrapElem() as well as the following:
	 *        createWrapper - a function that takes a style value and
	 *        returns a new empty wrapper node that has the style value
	 *        applied.
	 *
	 *        isPrunable - a function that returns true if a given node,
	 *        after some style was removed from it, can be removed
	 *        entirely. That's usually the case if the given node is
	 *        equivalent to an empty wrapper.
	 *
	 *        isStyleEqual - a function that returns true if two given
	 *        style values are equal.
	 *        TODO currently we just use strict equals by default, but
	 *             we should implement for each supported style it's own
	 *             equals function.
	 */
	function format(liveRange, styleName, styleValue, opts) {
		opts = opts || {};

		// Because of advanced compilation
		if (null != opts['createWrapper']) {
			opts.createWrapper = opts['createWrapper'];
		}
		if (null != opts['isPrunable']) {
			opts.isPrunable = opts['isPrunable'];
		}
		if (null != opts['isStyleEqual']) {
			opts.isStyleEqual = opts['isStyleEqual'];
		}
		if (null != opts['isObstruction']) {
			opts.isObstruction = opts['isObstruction'];
		}

		// Because we should avoid splitTextContainers() if this call is a noop.
		if (liveRange.collapsed) {
			return;
		}

		fixupRange(liveRange, function (range, leftPoint, rightPoint) {
			var formatter = makeStyleFormatter(styleName, styleValue, leftPoint, rightPoint, opts);
			mutate(range, formatter);
			return formatter;
		});

		return liveRange;
	}

	/**
	 * Ensures that the given boundaries are neither in start nor end positions.
	 * In other words, after this operation, both will have preceding and
	 * following siblings.
	 *
	 * Expansion/trimming can be controlled via expandUntil and trimUntil, but
	 * may cause one or both of the boundaries to remain in start or end
	 * position.
	 */
	function trimExpandBoundaries(startPoint, endPoint, trimUntil, expandUntil, ignore) {
		var collapsed = startPoint.equals(endPoint);
		ranges.trimBoundaries(startPoint, endPoint, trimUntil, ignore);
		ranges.expandBoundaries(startPoint, endPoint, expandUntil, ignore);
		if (collapsed) {
			endPoint.setFrom(startPoint);
		}
	}

	function splitBoundaryPoint(node, atEnd, leftPoint, rightPoint, removeEmpty, opts) {
		var wrapper = null;

		function carryDown(elem, stop) {
			return stop || opts.until(elem);
		}

		function intoWrapper(node, stop) {
			if (stop) {
				return;
			}
			var parent = node.parentNode;
			if (!wrapper || parent.previousSibling !== wrapper) {
				wrapper = opts.clone(parent);
				removeEmpty.push(parent);
				dom.insert(wrapper, parent, false);
				if (leftPoint.node === parent && !leftPoint.atEnd) {
					leftPoint.node = wrapper;
				}
				/*
				if (rightPoint.node === parent) {
					rightPoint.node = wrapper;
				}
				*/
			}
			moveBackIntoWrapper(node, wrapper, true, leftPoint, rightPoint);
		}

		var ascend = traversing.childAndParentsUntilIncl(node, opts.below);
		var unsplitParent = ascend.pop();
		if (unsplitParent && opts.below(unsplitParent)) {
			ascendWalkSiblings(ascend, atEnd, carryDown, intoWrapper, fn.noop, fn.noop);
		}

		return unsplitParent;
	}

	function splitRangeAtBoundaries(range, left, right, opts) {
		var normalizeLeft = opts.normalizeRange ? left : left.clone();
		var normalizeRight = opts.normalizeRange ? right : right.clone();
		html.normalizeBoundary(normalizeLeft);
		html.normalizeBoundary(normalizeRight);
		cursors.setToRange(range, normalizeLeft, normalizeRight);

		var removeEmpty = [];

		var start = dom.nodeAtOffset(range.startContainer, range.startOffset);
		var startAtEnd = dom.isAtEnd(range.startContainer, range.startOffset);
		var end = dom.nodeAtOffset(range.endContainer, range.endOffset);
		var endAtEnd = dom.isAtEnd(range.endContainer, range.endOffset);
		var unsplitParentStart = splitBoundaryPoint(start, startAtEnd, left, right, removeEmpty, opts);
		var unsplitParentEnd = splitBoundaryPoint(end, endAtEnd, left, right, removeEmpty, opts);

		removeEmpty.forEach(function (elem) {
			// Because we may end up cloning the same node twice (by
			// splitting both start and end points).
			if (!elem.firstChild && elem.parentNode) {
				dom.removeShallowPreservingBoundaries(elem, [left, right]);
			}
		});

		if (opts.normalizeRange) {
			trimExpandBoundaries(left, right, null, function (node) {
				return node === unsplitParentStart || node === unsplitParentEnd;
			});
		}
	}

	/**
	 * Splits the ancestors above the given range's start and end points.
	 *
	 * @param opts a map of options (all optional):
	 *
	 *        clone - a function that clones a given element node
	 *        shallowly and returns the cloned node.
	 *
	 *        until - a function that returns true if splitting
	 *        should stop at a given node (exclusive) below the topmost
	 *        node for which below() returns true. By default all
	 *        nodes are split.
	 *
	 *        below - a function that returns true if descendants
	 *        of a given node can be split. Used to determine the
	 *        topmost node at which to end the splitting process. If
	 *        false is returned for all ancestors of the start and end
	 *        points of the range, nothing will be split. By default,
	 *        returns true for an editing host.
	 *
	 *        normalizeRange - a boolean, defaults to true.
	 *        After splitting the selection may still be inside the split
	 *        nodes, for example after splitting the DOM may look like
	 *
	 *        <b>1</b><b>{2</b><i>3</i><i>}4</i>
	 *
	 *	      If normalizeRange is true, the selection is trimmed to
	 *	      correct <i>}4</i> and expanded to correct <b>{2</b>, such
	 *        that it will look like
	 *
	 *	      <b>1</b>{<b>2</b><i>3</i>}<i>4</i>
	 *
	 *	      This should make both start and end points children of the
	 *        same cac which is going to be the topmost unsplit node. This
	 *        is usually what one expects the range to look like after a
	 *        split.
	 *        NB: if splitUntil() returns true, start and end points
	 *        may not become children of the topmost unsplit node. Also,
	 *        if splitUntil() returns true, the selection may be moved
	 *        out of an unsplit node which may be unexpected.
	 */
	function split(liveRange, opts) {
		opts = opts || {};

		// Because of advanced compilation
		if (null != opts['clone']) {
			opts.clone = opts['clone'];
		}
		if (null != opts['until']) {
			opts.until = opts['until'];
		}
		if (null != opts['below']) {
			opts.below = opts['below'];
		}
		if (null != opts['normalizRange']) {
			opts.normalizeRange = opts['normalizeRange'];
		}

		opts = maps.merge({
			clone: dom.cloneShallow,
			until: fn.returnFalse,
			below: dom.isEditingHost,
			normalizeRange: true
		}, opts);

		fixupRange(liveRange, function (range, left, right) {
			splitRangeAtBoundaries(range, left, right, opts);
			return null;
		});

		return liveRange;
	}

	/**
	 * Removes the content inside the given range.
	 *
	 * “If you delete a paragraph-boundary, the result seems to be consistent:
	 * The leftmost block 'wins', and the content of the rightmost block is
	 * included in the leftmost:
	 *
	 * <h1>Overskrift</h1><p>[]Text</p>
	 *
	 * “If delete is pressed, this is the result:
	 *
	 * <h1>Overskrift[]Text</h1>”
	 * -- http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1
	 *
	 * @param {Range} range
	 * @return {Range}
	 *         The modified range, after deletion.
	 */
	function delete_(liveRange) {
		fixupRange(liveRange, function (range, left, right) {
			var remove = function (node) {
				dom.removePreservingRange(node, range);
			};
			walkBoundaryLeftRightInbetween(
				range,
				//carryDown
				fn.noop,
				// stepLeftStart
				fn.noop,
				// remove
				//   |
				//   v
				// {<b>...
				remove,
				//   remove
				//     |
				//     v
				// ...<b>}
				remove,
				// stepRightEnd
				fn.noop,
				// stepPartial
				fn.noop,
				//      remove
				//        |
				//        v
				// {...<b></b>...}
				remove,
				null
			);
			return {
				postprocessTextNodes: fn.noop,
				postprocess: function () {
					var position;
					if (range.collapsed) {
						position = {
							container: range.startContainer,
							offset: range.startOffset
						};
					} else {
						position = html.removeVisualBreak(
							// Given <div><b>fo{</b><h2>}ar</h2></div> or
							// <div>fo{<h2>}ar</h2></div>, let "fo" be the node
							// above
							dom.nodeAtOffset(
								range.startContainer,
								0 === range.startOffset ? 0 : range.startOffset - 1
							),
							dom.nodeAtOffset(range.endContainer, range.endOffset)
						);
					}
					var pos = cursors.createFromBoundary(
						position.container,
						position.offset
					);
					left.setFrom(pos);
					right.setFrom(pos);
				}
			};
		}, false);
		return liveRange;
	}

	/**
	 * High level editing functions.
	 *
	 * editing.wrap()
	 * editing.format()
	 * editing.split()
	 * editing.delete_()
	 */
	var exports = {
		wrap   : wrapElem,
		format : format,
		split  : split,
		delete : delete_
	};

	exports['wrap'] = exports.wrap;
	exports['format'] = exports.format;
	exports['split'] = exports.split;
	exports['delete'] = exports.delete;

	return exports;
});
