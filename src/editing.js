/** editing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @TODO formatStyle: in the following case the outer "font-family:
 * arial" span should be removed.  Can be done similar to how
 * findReusableAncestor() works.
 * <pre>
 *      <span style="font-family: arial">
 *         <span style="font-family: times">one</span>
 *         <span style="font-family: helvetica">two<span>
 *      </span>
 *</pre>
 * @TODO better handling of the last <br/> in a block and generally of
 *      unrendered whitespace.
 *      For example:
 *      formatting
 *      <p>{some<br/>text<br/>}</p>
 *      will result in
 *      <p>{<b>some<br/>text<br/></b>}</p>
 *      while it should probably be
 *      <p>{<b>some</br>text</b>}<br/></p>
 *
 * @namespace editing
 */
define([
	'dom',
	'mutation',
	'boundaries',
	'arrays',
	'maps',
	'strings',
	'functions',
	'html',
	'html/elements',
	'stable-range',
	'cursors',
	'content',
	'lists',
	'links',
	'overrides'
], function (
	Dom,
	Mutation,
	Boundaries,
	Arrays,
	Maps,
	Strings,
	Fn,
	Html,
	HtmlElements,
	StableRange,
	Cursors,
	Content,
	Lists,
	Links,
	Overrides
) {
	'use strict';

	/**
	 * @private
	 * Walks the siblings of the given child, calling before for
	 * siblings before the given child, after for siblings after the
	 * given child, and at for the given child.
	 */
	function walkSiblings(parent, beforeAtAfterChild, before, at, after, arg) {
		var func = before;
		Dom.walk(parent.firstChild, function (child) {
			if (child !== beforeAtAfterChild) {
				func(child, arg);
			} else {
				func = after;
				at(child, arg);
			}
		});
	}

	/**
	 * @private
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
	 * @private
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
	 * (Mutation.splitTextContainers).
	 */
	function walkBoundaryLeftRightInbetween(liveRange,
	                                        carryDown,
	                                        stepLeftStart,
	                                        stepRightStart,
	                                        stepLeftEnd,
	                                        stepRightEnd,
	                                        stepPartial,
	                                        stepInbetween,
	                                        arg) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		if (Dom.isTextNode(cac)) {
			cac = cac.parentNode;
		}
		var sc         = liveRange.startContainer;
		var ec         = liveRange.endContainer;
		var so         = liveRange.startOffset;
		var eo         = liveRange.endOffset;
		var collapsed  = liveRange.collapsed;
		var start      = Dom.nodeAtOffset(sc, so);
		var end        = Dom.nodeAtOffset(ec, eo);
		var startAtEnd = Boundaries.isAtEnd(Boundaries.raw(sc, so));
		var endAtEnd   = Boundaries.isAtEnd(Boundaries.raw(ec, eo));

		var ascStart    = Dom.childAndParentsUntilNode(start, cac);
		var ascEnd      = Dom.childAndParentsUntilNode(end,   cac);
		var stepAtStart = makePointNodeStep(start, startAtEnd, stepRightStart, stepPartial);
		var stepAtEnd   = makePointNodeStep(end, endAtEnd, stepRightEnd, stepPartial);
		ascendWalkSiblings(ascStart, startAtEnd, carryDown, stepLeftStart, stepAtStart, stepRightStart, arg);
		ascendWalkSiblings(ascEnd, endAtEnd, carryDown, stepLeftEnd, stepAtEnd, stepRightEnd, arg);
		var cacChildStart = Arrays.last(ascStart);
		var cacChildEnd   = Arrays.last(ascEnd);
		stepAtStart = makePointNodeStep(start, startAtEnd, stepInbetween, stepPartial);
		Dom.walkUntilNode(cac.firstChild, stepLeftStart, cacChildStart, arg);
		if (cacChildStart) {
			var next = cacChildStart.nextSibling;
			if (cacChildStart === cacChildEnd) {
				if (!collapsed) {
					stepPartial(cacChildStart, arg);
				}
			} else {
				stepAtStart(cacChildStart, arg);
				Dom.walkUntilNode(next, stepInbetween, cacChildEnd, arg);
				if (cacChildEnd) {
					next = cacChildEnd.nextSibling;
					stepAtEnd(cacChildEnd, arg);
				}
			}
			if (cacChildEnd) {
				Dom.walk(next, stepRightEnd, arg);
			}
		}
	}

	/**
	 * Simplifies walkBoundaryLeftRightInbetween from left/right/inbetween to just inside/outside.
	 *
	 * Requires range's boundary points to be between nodes
	 * (Mutation.splitTextContainers).
	 */
	function walkBoundaryInsideOutside(liveRange,
	                                   carryDown,
	                                   stepOutside,
	                                   stepPartial,
	                                   stepInside,
	                                   arg) {
		walkBoundaryLeftRightInbetween(
			liveRange,
			carryDown,
			stepOutside,
			stepInside,
			stepInside,
			stepOutside,
			stepPartial,
			stepInside,
			arg
		);
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
	 * (Mutation.splitTextContainers).
	 */
	function pushDownContext(liveRange,
	                         pushDownFrom,
	                         cacOverride,
	                         getOverride,
	                         clearOverride,
	                         clearOverrideRec,
	                         pushDownOverride) {
		// Because range may be mutated during traversal, we must only
		// refer to it before traversal.
		var cac = liveRange.commonAncestorContainer;
		walkBoundaryInsideOutside(
			liveRange,
			getOverride,
			pushDownOverride,
			clearOverride,
			clearOverrideRec,
			cacOverride
		);
		var fromCacToTop = Dom.childAndParentsUntilInclNode(
			cac,
			pushDownFrom
		);
		ascendWalkSiblings(
			fromCacToTop,
			false,
			getOverride,
			pushDownOverride,
			clearOverride,
			pushDownOverride,
			null
		);
		clearOverride(pushDownFrom);
	}

	function findReusableAncestor(range,
	                              hasContext,
	                              getOverride,
	                              isUpperBoundary,
	                              isReusable,
	                              isObstruction) {
		var obstruction = null;
		function beforeAfter(node) {
			obstruction = (obstruction
						   || (!Html.isUnrenderedWhitespace(node)
							   && !hasContext(node)));
		}
		walkBoundaryInsideOutside(range, Fn.noop, beforeAfter, Fn.noop, Fn.noop);
		if (obstruction) {
			return null;
		}
		var cac = range.commonAncestorContainer;
		if (Dom.isTextNode(cac)) {
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
	 * (Mutation.splitTextContainers).
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
			Dom.walkRec(node, clearOverride);
		};
		var topmostOverrideNode = null;
		var cacOverride = null;
		var isNonClearableOverride = false;
		var upperBoundaryAndAbove = false;
		var fromCacToContext = Dom.childAndParentsUntilIncl(
			cac,
			function (node) {
				// Because we shouldn't expect hasContext to handle the document
				// element (which has nodeType 9).
				return (
					!node.parentNode
						|| Dom.Nodes.DOCUMENT === node.parentNode.nodeType
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
				isNonClearableOverride = isNonClearableOverride
				                      || upperBoundaryAndAbove
				                      || !isClearable(node);
				if (null == cacOverride) {
					cacOverride = override;
				}
			}
		});
		if (null == cacOverride) {
			cacOverride = getInheritableOverride(cac);
		}

		if (hasInheritableContext(Arrays.last(fromCacToContext)) && !isNonClearableOverride) {
			if (!topmostOverrideNode) {
				// Because, if there is no override in the way, we only
				// need to clear the overrides contained in the range.
				walkBoundaryInsideOutside(
					liveRange,
					getOverride,
					pushDownOverride,
					clearOverride,
					clearOverrideRec
				);
			} else {
				var pushDownFrom = topmostOverrideNode;
				pushDownContext(
					liveRange,
					pushDownFrom,
					cacOverride,
					getOverride,
					clearOverride,
					clearOverrideRec,
					pushDownOverride
				);
			}
		} else {
			var mySetContext = function (node, override) {
				setContext(node, override, isNonClearableOverride);
			};
			var reusableAncestor = findReusableAncestor(
				liveRange,
				hasContext,
				getOverride,
				isUpperBoundary,
				isReusable,
				isObstruction
			);
			if (reusableAncestor) {
				mySetContext(reusableAncestor);
			} else {
				walkBoundaryInsideOutside(
					liveRange,
					getOverride,
					pushDownOverride,
					clearOverride,
					mySetContext
				);
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

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editing
	 */
	function wrap(node, wrapper, leftPoint, rightPoint) {
		if (!Content.allowsNesting(wrapper.nodeName, node.nodeName)) {
			return false;
		}
		if (wrapper.parentNode) {
			Mutation.removeShallowPreservingCursors(wrapper, [leftPoint, rightPoint]);
		}
		adjustPointWrap(leftPoint, node, wrapper);
		adjustPointWrap(rightPoint, node, wrapper);
		Dom.wrap(node, wrapper);
		return true;
	}

	// NB: depends on fixupRange to use trimClosingOpening() to move the
	// leftPoint out of an cursor.atEnd position to the first node that is to be
	// moved.
	function moveBackIntoWrapper(node, ref, atEnd, leftPoint, rightPoint) {
		// Because the points will just be moved with the node, we don't need to
		// do any special preservation.
		Dom.insert(node, ref, atEnd);
	}

	/**
	 * TODO documentation
	 *
	 * @param  {!Range}   liveRange
	 * @param  {function} mutate
	 * @param  {function} trim
	 * @return {Array.<Boundary>}
	 */
	function fixupRange(liveRange, mutate, trim) {
		// Because we are mutating the range several times and don't want the
		// caller to see the in-between updates, and because we are using
		// Ranges.trim() below to adjust the range's boundary points, which we
		// don't want the browser to re-adjust (which some browsers do).
		var range = StableRange(liveRange);

		// Because making the assumption that boundary points are between nodes
		// makes the algorithms generally a bit simpler.
		Mutation.splitTextContainers(range);

		var splitStart = Cursors.cursorFromBoundaryPoint(
			range.startContainer,
			range.startOffset
		);

		var splitEnd = Cursors.cursorFromBoundaryPoint(
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
			trimClosingOpening(
				range,
				Html.isUnrenderedWhitespace,
				Html.isUnrenderedWhitespace
			);
		}

		// Because mutation needs to keep track and adjust boundary points so we
		// can preserve the range.
		var leftPoint = Cursors.cursorFromBoundaryPoint(
			range.startContainer,
			range.startOffset
		);

		var rightPoint = Cursors.cursorFromBoundaryPoint(
			range.endContainer,
			range.endOffset
		);

		var formatter = mutate(range, leftPoint, rightPoint);
		if (formatter) {
			formatter.postprocess();
		}

		Cursors.setToRange(range, leftPoint, rightPoint);

		// Because we want to ensure that this algorithm doesn't
		// introduce any additional splits between text nodes.
		Mutation.joinTextNodeAdjustRange(splitStart.node, range);
		Mutation.joinTextNodeAdjustRange(splitEnd.node, range);

		if (formatter) {
			formatter.postprocessTextNodes(range);
		}

		var boundaries = Boundaries.fromRange(range);
		Boundaries.setRange(liveRange, boundaries[0], boundaries[1]);
		return boundaries;
	}

	function restackRec(node, hasContext, ignoreHorizontal, ignoreVertical) {
		if (!Dom.isElementNode(node) || !ignoreVertical(node)) {
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
			return null;
		}
		if (!wrap(node, context, leftPoint, rightPoint)) {
			return null;
		}
		return context;
	}

	function ensureWrapper(node,
	                       createWrapper,
	                       isWrapper,
	                       isMergable,
	                       pruneContext,
	                       addContextValue,
	                       leftPoint,
	                       rightPoint) {
		var sibling = node.previousSibling;
		if (sibling && isMergable(sibling) && isMergable(node)) {
			moveBackIntoWrapper(node, sibling, true, leftPoint, rightPoint);
			// Because the node itself may be a wrapper.
			pruneContext(node);
		} else if (!isWrapper(node)) {
			var wrapper = createWrapper(node.ownerDocument);
			if (wrap(node, wrapper, leftPoint, rightPoint)) {
				// Because we are just making sure (probably not
				// necessary since the node isn't a wrapper).
				pruneContext(node);
			} else {
				// Because if wrapping is not successful, we try again
				// one level down.
				Dom.walk(node.firstChild, function (node) {
					ensureWrapper(
						node,
						createWrapper,
						isWrapper,
						isMergable,
						pruneContext,
						addContextValue,
						leftPoint,
						rightPoint
					);
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
			Mutation.removeShallowPreservingCursors(node, [leftPoint, rightPoint]);
		}

		function createContextWrapper(value, doc) {
			var wrapper = createWrapper(value, doc);
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
			return isClearable(node);
		}

		function wrapContextValue(node, value) {
			ensureWrapper(
				node,
				Fn.partial(createContextWrapper, value),
				isReusable,
				Fn.partial(isMergableWrapper, value),
				pruneContext,
				Fn.partial(addContextValue, value),
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

		function restackMergeWrapper(wrapper, contextValue, mergeNext) {
			var sibling = mergeNext ? wrapper.nextSibling : wrapper.previousSibling;
			if (!sibling) {
				return;
			}
			function isGivenContextValue(node) {
				return hasContextValue(node, contextValue);
			}
			sibling = restack(
				sibling,
				isGivenContextValue,
				Html.isUnrenderedWhitespace,
				Html.hasInlineStyle,
				leftPoint,
				rightPoint
			);
			if (!sibling) {
				return;
			}
			var isMergable = Fn.partial(isMergableWrapper, contextValue);
			var createWrapper = Fn.partial(createContextWrapper, contextValue);
			var addValue = Fn.partial(addContextValue, contextValue);
			var mergeNode = mergeNext ? sibling : wrapper;
			ensureWrapper(
				mergeNode,
				createWrapper,
				isReusable,
				isMergable,
				pruneContext,
				addValue,
				leftPoint,
				rightPoint
			);
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
				Mutation.joinTextNodeAdjustRange(node, range);
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
		return 'BODY' === node.nodeName || Html.hasBlockStyle(node) || Dom.isEditingHost(node);
	}

	function isStyleEqual_default(styleValueA, styleValueB) {
		return styleValueA === styleValueB;
	}

	var inlineWrapperProperties = {
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
	inlineWrapperProperties['emphasis']  = Maps.merge(inlineWrapperProperties.italic, {name: 'EM'});
	inlineWrapperProperties['strong']    = Maps.merge(inlineWrapperProperties.bold, {name: 'STRONG'});
	inlineWrapperProperties['bold']      = inlineWrapperProperties.bold;
	inlineWrapperProperties['italic']    = inlineWrapperProperties.italic;
	inlineWrapperProperties['underline'] = inlineWrapperProperties.underline;

	function getStyleSafely(node, name) {
		return (Dom.isElementNode(node)
		        ? Dom.getStyle(node, name)
		        : null);
	}

	function makeStyleFormatter(styleName, styleValue, leftPoint, rightPoint, opts) {
		var isStyleEqual = opts.isStyleEqual || isStyleEqual_default;
		var nodeNames = [];
		var unformat = false;
		var wrapperProps = inlineWrapperProperties[styleName];
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
			if (Arrays.contains(nodeNames, node.nodeName)) {
				return wrapperProps.value;
			}
			var override = getStyleSafely(node, styleName);
			return !Strings.isEmpty(override) ? override : null;
		}
		function getInheritableOverride(node) {
			if (Arrays.contains(nodeNames, node.nodeName)) {
				return wrapperProps.value;
			}
			var override = Dom.getComputedStyle(node, styleName);
			return !Strings.isEmpty(override) ? override : null;
		}
		function isContextStyle(value) {
			return isStyleEqual(normalizeStyleValue(value), styleValue);
		}
		function isContextOverride(value) {
			return isContextStyle(value);
		}
		function hasSomeContextValue(node) {
			if (Arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return !Strings.isEmpty(getStyleSafely(node, styleName));
		}
		function hasContextValue(node, value) {
			value = normalizeStyleValue(value);
			if (Arrays.contains(nodeNames, node.nodeName) && isStyleEqual(wrapperProps.value, value)) {
				return true;
			}
			return isStyleEqual(getStyleSafely(node, styleName), value);
		}
		function hasContext(node) {
			if (!unformat && Arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return isContextStyle(getStyleSafely(node, styleName));
		}
		function hasInheritableContext(node) {
			if (!unformat && Arrays.contains(nodeNames, node.nodeName)) {
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
			if (unformat && Html.isStyleInherited(styleName)) {
				return isContextStyle(getStyleSafely(node, styleName));
			}
			return isContextStyle(Dom.getComputedStyle(node, styleName));
		}
		function addContextValue(value, node) {
			value = normalizeStyleValue(value);
			if (Arrays.contains(nodeNames, node.nodeName) && isStyleEqual(wrapperProps.value, value)) {
				return;
			}
			// Because we don't want to add an explicit style if for
			// example the element already has a class set on it. For
			// example: <span class="bold"></span>.
			if (isStyleEqual(normalizeStyleValue(Dom.getComputedStyle(node, styleName)), value)) {
				return;
			}
			Dom.setStyle(node, styleName, value);
		}
		function removeContext(node) {
			Dom.removeStyle(node, styleName);
		}
		function isReusable(node) {
			if (Arrays.contains(nodeNames, node.nodeName)) {
				return true;
			}
			return 'SPAN' === node.nodeName;
		}
		function isPrunable(node) {
			return isReusable(node) && !Dom.hasAttrs(node);
		}
		function createWrapper(value, doc) {
			value = normalizeStyleValue(value);
			if (wrapperProps && isStyleEqual(wrapperProps.value, value)) {
				return doc.createElement(wrapperProps.name);
			}
			var wrapper = doc.createElement('SPAN');
			Dom.setStyle(wrapper, styleName, value);
			return wrapper;
		}
		var impl = Maps.merge({
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
			isObstruction: Fn.complement(Html.hasInlineStyle),
			isUpperBoundary: isUpperBoundary_default
		}, opts);
		return makeFormatter(styleValue, leftPoint, rightPoint, impl);
	}

	function makeElemFormatter(nodeName, unformat, leftPoint, rightPoint, opts) {
		// Because we assume nodeNames are always uppercase, but don't
		// want the user to remember this detail.
		nodeName = nodeName.toUpperCase();
		function createWrapper(wrapper, doc) {
			return doc.createElement(nodeName);
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
			return node.nodeName === nodeName && !Dom.hasAttrs(node);
		}
		function isPrunable(node) {
			return isReusable(node);
		}
		function hasSomeContextValue(node) {
			return node.nodeName === nodeName;
		}
		var impl = Maps.merge({
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
			addContextValue: Fn.noop,
			removeContext: Fn.noop,
			createWrapper: createWrapper,
			isReusable: isReusable,
			isPrunable: isPrunable,
			isObstruction: Fn.complement(Html.hasInlineStyle),
			isUpperBoundary: isUpperBoundary_default
		}, opts);
		return makeFormatter(nodeName, leftPoint, rightPoint, impl);
	}

	/**
	 * Ensures the given range is wrapped by elements with a given nodeName.
	 *
	 * @param {string}    nodeName
	 * @param {!Boundary} start
	 * @param {!Boundary} end
	 * @param {boolean} remove Optional flag, which when set to false will cause
	 *                         the given markup to be removed (unwrapped) rather
	 *                         then set.
	 * @param {?Object} opts A map of options (all optional):
	 *        createWrapper - a function that returns a new empty
	 *        wrapper node to use.
	 *
	 *        isReusable - a function that returns true if a given node,
	 *        already in the DOM at the correct place, can be reused
	 *        instead of creating a new wrapper node. May be merged with
	 *        other reusable or newly created wrapper nodes.
	 * @return {Array.<Boundary>} updated boundaries
	 */
	function wrapElem(nodeName, start, end, remove, opts) {
		opts = opts || {};

		var liveRange = Boundaries.range(start, end);

		// Because we should avoid splitTextContainers() if this call is a noop.
		if (liveRange.collapsed) {
			return [start, end];
		}

		return fixupRange(liveRange, function (range, leftPoint, rightPoint) {
			var formatter = makeElemFormatter(nodeName, remove, leftPoint, rightPoint, opts);
			mutate(range, formatter);
			return formatter;
		});
	}

	/**
	 * Ensures the contents between start and end are wrapped by elements 
	 * that have a given CSS style set. Returns the updated boundaries.
	 *
	 * @param styleName a CSS style name
	 *        Please note that not-inherited styles currently may (or
	 *        may not) cause undesirable results.  See also
	 *        Html.isStyleInherited().
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
	 * @return {Array.<Boundary>}
	 * @memberOf editing
	 */
	function style(start, end, name, value, opts) {
		var range = Boundaries.range(start, end);
		// Because we should avoid splitTextContainers() if this call is a noop.
		if (range.collapsed) {
			return [start, end];
		}
		return fixupRange(range, function (range, leftPoint, rightPoint) {
			var formatter = makeStyleFormatter(name, value, leftPoint, rightPoint, opts || {});
			mutate(range, formatter);
			return formatter;
		});
	}

	/**
	 * Applies inline formatting to contents enclosed by start and end boundary.
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param  {string}    node
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {boolean}   isWrapping
	 * @return {Array.<Boundary>}
	 */
	function formatInline(node, start, end, isWrapping) {
		var styleName = resolveStyleName(node);
		var boundaries = (styleName === false)
		               ? [start, end]
		               : style(start, end, styleName, isWrapping);
		if (Boundaries.equals(boundaries[0], boundaries[1])) {
			return boundaries;
		}
		var next = Boundaries.nodeAfter(boundaries[0]);
		var prev = Boundaries.nodeBefore(boundaries[1]);
		start = next
		      ? Boundaries.normalize(Boundaries.fromStartOfNode(next))
		      : boundaries[0];
		end = prev
		    ? Boundaries.normalize(Boundaries.fromEndOfNode(prev))
		    : boundaries[1];
		return [start, end];
	}

	/**
	 * Resolves the according CSS style name for an uppercase (!) node name
	 * passed in styleNode. Will return the CSS name of the style (eg. 'bold') 
	 * or false.
	 * So 'B' will eg. be resolved to 'bold'
	 *
	 * @param  {string} styleNode
	 * @return {string|false}
	 */
	function resolveStyleName(styleNode) {
		for (var styleName in inlineWrapperProperties) {
			if (inlineWrapperProperties[styleName].nodes.indexOf(styleNode) !== -1) {
				return styleName;
			}
		}
		return false;
	}

	/**
	 * Ensures that the given start point Cursor is not at a "start position"
	 * and the given end point Cursor is not at an "end position" by moving the
	 * points to the left and right respectively.  This is effectively the
	 * opposite of trimBoundaries().
	 *
	 * @param {Cusor} start
	 * @param {Cusor} end
	 * @param {function():boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {function():boolean} ignore
	 *        Optional predicate.  May be used to ignore (skip)
	 *        following/preceding siblings which otherwise would stop the
	 *        trimming process, like for example underendered whitespace.
	 */
	function expandBoundaries(start, end, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		start.prevWhile(function (start) {
			var prevSibling = start.prevSibling();
			return prevSibling ? ignore(prevSibling) : !until(start.parent());
		});
		end.nextWhile(function (end) {
			return !end.atEnd ? ignore(end.node) : !until(end.parent());
		});
	}

	/**
	 * Ensures that the given start point Cursor is not at an "start position"
	 * and the given end point Cursor is not at an "end position" by moving the
	 * points to the left and right respectively.  This is effectively the
	 * opposite of expandBoundaries().
	 *
	 * If the boundaries are equal (collapsed), or become equal during this
	 * operation, or if until() returns true for either point, they may remain
	 * in start and end position respectively.
	 *
	 * @param {Cusor} start
	 * @param {Cusor} end
	 * @param {function():boolean} until
	 *        Optional predicate.  May be used to stop the trimming process from
	 *        moving the Cursor from within an element outside of it.
	 * @param {function():boolean} ignore
	 *        Optional predicate.  May be used to ignore (skip)
	 *        following/preceding siblings which otherwise would stop the
	 *        trimming process, like for example underendered whitespace.
	 */
	function trimBoundaries(start, end, until, ignore) {
		until = until || Fn.returnFalse;
		ignore = ignore || Fn.returnFalse;
		start.nextWhile(function (start) {
			return (
				!start.equals(end)
					&& (
						!start.atEnd
							? ignore(start.node)
							: !until(start.parent())
					)
			);
		});
		end.prevWhile(function (end) {
			var prevSibling = end.prevSibling();
			return (
				!start.equals(end)
					&& (
						prevSibling
							? ignore(prevSibling)
							: !until(end.parent())
					)
			);
		});
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
		trimBoundaries(startPoint, endPoint, trimUntil, ignore);
		expandBoundaries(startPoint, endPoint, expandUntil, ignore);
		if (collapsed) {
			endPoint.setFrom(startPoint);
		}
	}

	/**
	 * @private
	 */
	function seekBoundaryPoint(range, container, offset, oppositeContainer,
	                           oppositeOffset, setFn, ignore, backwards) {
		var cursor = Cursors.cursorFromBoundaryPoint(container, offset);

		// Because when seeking backwards, if the boundary point is inside a
		// text node, trimming starts after it. When seeking forwards, the
		// cursor starts before the node, which is what
		// cursorFromBoundaryPoint() does automatically.
		if (backwards
				&& Dom.isTextNode(container)
					&& offset > 0
						&& offset < container.length) {
			if (cursor.next()) {
				if (!ignore(cursor)) {
					return range;
				}
				// Bacause the text node can be ignored, we go back to the
				// initial position.
				cursor.prev();
			}
		}
		var opposite = Cursors.cursorFromBoundaryPoint(
			oppositeContainer,
			oppositeOffset
		);
		var changed = false;
		while (!cursor.equals(opposite)
		           && ignore(cursor)
		           && (backwards ? cursor.prev() : cursor.next())) {
			changed = true;
		}
		if (changed) {
			setFn(range, cursor);
		}
		return range;
	}


	/**
	 * Starting with the given range's start and end boundary points, seek
	 * inward using a cursor, passing the cursor to ignoreLeft and ignoreRight,
	 * stopping when either of these returns true, adjusting the given range to
	 * the end positions of both cursors.
	 *
	 * The dom cursor passed to ignoreLeft and ignoreRight does not traverse
	 * positions inside text nodes. The exact rules for when text node
	 * containers are passed are as follows: If the left boundary point is
	 * inside a text node, trimming will start before it. If the right boundary
	 * point is inside a text node, trimming will start after it.
	 * ignoreLeft/ignoreRight() are invoked with the cursor before/after the
	 * text node that contains the boundary point.
	 *
	 * @todo: Implement in terms of boundaries
	 *
	 * @param  {Range}     range
	 * @param  {function=} ignoreLeft
	 * @param  {function=} ignoreRight
	 * @return {Range}
	 */
	function trim(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		if (range.collapsed) {
			return range;
		}
		// Because range may be mutated, we must store its properties before
		// doing anything else.
		var sc = range.startContainer;
		var so = range.startOffset;
		var ec = range.endContainer;
		var eo = range.endOffset;
		seekBoundaryPoint(
			range,
			sc,
			so,
			ec,
			eo,
			Cursors.setRangeStart,
			ignoreLeft,
			false
		);
		sc = range.startContainer;
		so = range.startOffset;
		seekBoundaryPoint(
			range,
			ec,
			eo,
			sc,
			so,
			Cursors.setRangeEnd,
			ignoreRight,
			true
		);
		return range;
	}

	/**
	 * Like trim() but ignores closing (to the left) and opening positions (to
	 * the right).
	 *
	 * @param  {Range}     range
	 * @param  {function=} ignoreLeft
	 * @param  {function=} ignoreRight
	 * @return {Range}
	 */
	function trimClosingOpening(range, ignoreLeft, ignoreRight) {
		ignoreLeft = ignoreLeft || Fn.returnFalse;
		ignoreRight = ignoreRight || Fn.returnFalse;
		trim(range, function (cursor) {
			return cursor.atEnd || ignoreLeft(cursor.node);
		}, function (cursor) {
			return !cursor.prevSibling() || ignoreRight(cursor.prevSibling());
		});
		return range;
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
				Dom.insert(wrapper, parent, false);
				if (leftPoint.node === parent && !leftPoint.atEnd) {
					leftPoint.node = wrapper;
				}
				if (rightPoint.node === parent) {
					rightPoint.node = wrapper;
				}
			}
			moveBackIntoWrapper(node, wrapper, true, leftPoint, rightPoint);
		}

		var ascend = Dom.childAndParentsUntilIncl(node, opts.below);
		var unsplitParent = ascend.pop();
		if (unsplitParent && opts.below(unsplitParent)) {
			ascendWalkSiblings(ascend, atEnd, carryDown, intoWrapper, Fn.noop, Fn.noop);
		}

		return unsplitParent;
	}

	/**
	 * Tries to move the given boundary to the start of line, skipping over any
	 * unrendered nodes, or if that fails to the end of line (after a br
	 * element if present), and for the last line in a block, to the very end
	 * of the block.
	 *
	 * If the selection is inside a block with only a single empty line (empty
	 * except for unrendered nodes), and both boundary points are normalized,
	 * the selection will be collapsed to the start of the block.
	 *
	 * For some operations it's useful to think of a block as a number of
	 * lines, each including its respective br and any preceding unrendered
	 * whitespace and in case of the last line, also any following unrendered
	 * whitespace.
	 *
	 * @param  {!Cursor} point
	 * @return {boolean} True if the cursor is moved.
	 */
	function normalizeBoundary(point) {
		if (HtmlElements.skipUnrenderedToStartOfLine(point)) {
			return true;
		}
		if (!HtmlElements.skipUnrenderedToEndOfLine(point)) {
			return false;
		}
		if ('BR' === point.node.nodeName) {
			point.skipNext();
			// Because, if this is the last line in a block, any unrendered
			// whitespace after the last br will not constitute an independent
			// line, and as such we must include it in the last line.
			var endOfBlock = point.clone();
			if (HtmlElements.skipUnrenderedToEndOfLine(endOfBlock) && endOfBlock.atEnd) {
				point.setFrom(endOfBlock);
			}
		}
		return true;
	}

	function splitRangeAtBoundaries(range, left, right, opts) {
		var normalizeLeft = opts.normalizeRange ? left : left.clone();
		var normalizeRight = opts.normalizeRange ? right : right.clone();
		normalizeBoundary(normalizeLeft);
		normalizeBoundary(normalizeRight);

		Cursors.setToRange(range, normalizeLeft, normalizeRight);

		var removeEmpty = [];
		var start = Dom.nodeAtOffset(range.startContainer, range.startOffset);
		var end = Dom.nodeAtOffset(range.endContainer, range.endOffset);
		var startAtEnd = Boundaries.isAtEnd(Boundaries.raw(range.startContainer, range.startOffset));
		var endAtEnd = Boundaries.isAtEnd(Boundaries.raw(range.endContainer, range.endOffset));
		var unsplitParentStart = splitBoundaryPoint(start, startAtEnd, left, right, removeEmpty, opts);
		var unsplitParentEnd = splitBoundaryPoint(end, endAtEnd, left, right, removeEmpty, opts);

		removeEmpty.forEach(function (elem) {
			// Because we may end up cloning the same node twice (by splitting
			// both start and end points)
			if (!elem.firstChild && elem.parentNode) {
				Mutation.removeShallowPreservingCursors(elem, [left, right]);
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
	 *        <b>1</b><b>\{2</b><i>3</i><i>\}4</i>
	 *
	 *	      If normalizeRange is true, the selection is trimmed to
	 *	      correct <i>\}4</i> and expanded to correct <b>\{2</b>, such
	 *        that it will look like
	 *
	 *	      <b>1</b>\{<b>2</b><i>3</i>\}<i>4</i>
	 *
	 *	      This should make both start and end points children of the
	 *        same cac which is going to be the topmost unsplit node. This
	 *        is usually what one expects the range to look like after a
	 *        split.
	 *        NB: if splitUntil() returns true, start and end points
	 *        may not become children of the topmost unsplit node. Also,
	 *        if splitUntil() returns true, the selection may be moved
	 *        out of an unsplit node which may be unexpected.
	 * @return {Array.<Boundary>}
	 */
	function split(liveRange, opts) {
		opts = opts || {};

		opts = Maps.merge({
			clone: Dom.cloneShallow,
			until: Fn.returnFalse,
			below: Dom.isEditingHost,
			normalizeRange: true
		}, opts);

		return fixupRange(liveRange, function (range, left, right) {
			splitRangeAtBoundaries(range, left, right, opts);
			return null;
		});
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
	 * TODO:
	 * put &nbsp; at beginning and end position in order to preserve spaces at
	 * these locations when deleting.
	 *
	 * @see https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#deleting-the-selection
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 * @memberOf editing
	 */
	function remove(start, end) {
		var range = Boundaries.range(start, end);
		return fixupRange(range, function (range, left, right) {
			var remove = function (node) {
				Mutation.removePreservingRange(node, range);
			};
			walkBoundaryLeftRightInbetween(
				range,
				//carryDown
				Fn.noop,
				// stepLeftStart
				Fn.noop,
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
				Fn.noop,
				// stepPartial
				Fn.noop,
				//      remove
				//        |
				//        v
				// {...<b></b>...}
				remove,
				null
			);
			return {
				postprocessTextNodes: Fn.noop,
				postprocess: function () {
					var split = Html.removeBreak(
						Boundaries.fromRangeStart(range),
						Boundaries.fromRangeEnd(range)
					)[0];
					var cursor = Cursors.createFromBoundary(
						Boundaries.container(split),
						Boundaries.offset(split)
					);
					left.setFrom(cursor);
					right.setFrom(cursor);
				}
			};
		}, false);
	}

	/**
	 * Creates a visual line break at the given boundary position.
	 *
	 * @see
	 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#splitting-a-node-list's-parent
	 * http://lists.whatwg.org/htdig.cgi/whatwg-whatwg.org/2011-May/031700.html
	 *
	 * @param  {!Boundary} boundary
	 * @param  {string}    breaker
	 * @return {Array.<Boundary>}
	 * @memberOf editing
	 */
	function breakline(boundary, breaker) {
		var op = 'BR' === breaker ? Html.insertLineBreak : Html.insertBreak;
		boundary = op(boundary, breaker);
		return [boundary, boundary];
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editing
	 */
	function insert(start, end, insertion) {
		var range = Boundaries.range(start, end);
		split(range, {
			below: function (node) {
				return Content.allowsNesting(node.nodeName, insertion.nodeName);
			}
		});
		var boundary = Mutation.insertNodeAtBoundary(
			insertion,
			Boundaries.fromRangeStart(range)
		);
		Boundaries.setRange(range, boundary, Boundaries.create(
			Boundaries.container(boundary),
			Boundaries.offset(boundary) + 1
		));
		return Boundaries.fromRangeStart(range);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editing
	 */
	function className(start, end, name, value, boundaries) {
		throw 'Not implemented';
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editing
	 */
	function attribute(start, end, name, value, boundaries) {
		throw 'Not implemented';
	}

	/**
	 * This function is not yet implemented.
	 * @TODO to be implemented
	 * @memberOf editing
	 */
	function cut(start, end, boundaries) {
		throw 'Not implemented';
	}

	/**
	 * This function is not yet implemented.
	 * @TODO to be implemented
	 * @memberOf editing
	 */
	function copy(start, end, boundaries) {
		throw 'Not implemented';
	}

	/**
	 * Starting with the given, returns the first node that matches the given
	 * predicate.
	 *
	 * @private
	 * @param  {!Node}                  node
	 * @param  {function(Node):boolean} pred
	 * @return {Node}
	 */
	function nearest(node, pred) {
		return Dom.upWhile(node, function (node) {
			return !pred(node)
			    && !(node.parentNode && Dom.isEditingHost(node.parentNode));
		});
	}

	/**
	 * Expands the given start and end boundaires until the nearst containers
	 * that match the given predicate.
	 *
	 * @private
	 * @param  {Boundary}               start
	 * @param  {Boundary}               end
	 * @param  {function(Node):boolean} pred
	 * @return {Array.<Boundary>}
	 */
	function expandUntil(start, end, pred) {
		var node, startNode, endNode;
		if (Html.isBoundariesEqual(start, end)) {
			//       node ----------.
			//        |             |
			//        v             v
			// </p>{}<u> or </b>{}</p>
			node = Boundaries.nextNode(end);
			if (Dom.isEditingHost(node)) {
				node = Boundaries.prevNode(start);
			}
			if (Dom.isEditingHost(node)) {
				return [start, end];
			}
			startNode = endNode = pred(node) ? node : nearest(node, pred);
		} else {
			startNode = nearest(Boundaries.nextNode(start), pred);
			endNode = nearest(Boundaries.prevNode(end), pred);
		}
		return [
			Boundaries.fromFrontOfNode(startNode),
			Boundaries.fromBehindOfNode(endNode)
		];
	}

	/**
	 * Given a list of sibling nodes and a formatting, will apply the formatting
	 * across the list of nodes.
	 *
	 * @private
	 * @param  {string}       formatting
	 * @param  {Array.<Node>} siblings
	 */
	function formatSiblings(formatting, siblings) {
		var wrapper = null;
		siblings.forEach(function (node) {
			if (Html.isUnrendered(node) && !wrapper) {
				return;
			}
			if (Content.allowsNesting(formatting, node.nodeName)) {
				if (!wrapper) {
					wrapper = node.ownerDocument.createElement(formatting);
					Dom.insert(wrapper, node);
				}
				return Dom.move([node], wrapper);
			}
			wrapper = null;
			if (Html.isVoidType(node)) {
				return;
			}
			var children = Dom.children(node);
			var childNames = children.map(function (child) { return child.nodeName; });
			var canWrapChildren = childNames.length === childNames.filter(
				Fn.partial(Content.allowsNesting, formatting)
			).length;
			var allowedInParent = Content.allowsNesting(
				node.parentNode.nodeName,
				formatting
			);
			if (
				canWrapChildren              &&
				allowedInParent              &&
				!Html.isGroupContainer(node) &&
				!Html.isGroupedElement(node)
			) {
				return Dom.replaceShallow(
					node,
					node.ownerDocument.createElement(formatting)
				);
			}
			var i = Arrays.someIndex(children, Html.isRendered);
			if (i > -1) {
				formatSiblings(formatting, children.slice(i));
			}
		});
	}

	/**
	 * Applies block formatting to contents enclosed by start and end boundary.
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param  {!string}   formatting
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function formatBlock(formatting, start, end, preserve) {
		var boundaries = expandUntil(start, end, Html.hasLinebreakingStyle);
		boundaries = Html.walkBetween(
			boundaries[0],
			boundaries[1],
			Fn.partial(formatSiblings, formatting)
		);
		start = Boundaries.fromStartOfNode(Boundaries.nextNode(boundaries[0]));
		end = Boundaries.fromEndOfNode(Boundaries.prevNode(boundaries[1]));
		return [Html.expandForward(start), Html.expandBackward(end)];
	}

	/**
	 * Applies block and inline formattings (eg. 'B', 'I', 'H2' - be sure to use
	 * UPPERCASE node names here) to contents enclosed by start and end
	 * boundary.
	 *
	 * Will return updated array of boundaries after the operation.
	 *
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {!string}   nodeName
	 * @param  {Array.<Boundary>}
	 * @return {Array.<Boundary>}
	 * @memberOf editing
	 */
	function format(start, end, nodeName, boundaries) {
		var range;
		var node = {nodeName: nodeName};
		if (nodeName.toLowerCase() === 'a') {
			range = Links.create('', start, end);
		} else if (Html.isTextLevelSemanticNode(node)) {
			range = formatInline(nodeName, start, end, true);
		} else if (Html.isListContainer(node)) {
			range = Lists.toggle(nodeName, start, end);
		} else if (Html.isBlockNode(node)) {
			range = formatBlock(nodeName, start, end);
		}
		return range;
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 * 
	 * @memberOf editing
	 */
	function unformat(start, end, nodeName, boundaries) {
	   return formatInline(nodeName, start, end, false);
	}

	/**
	 * Toggles inline style round the given selection.
	 *
	 * @private
	 * @param  {string}    nodeName
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function toggleInline(nodeName, start, end) {
		var override = Overrides.nodeToState[nodeName];
		if (!override) {
			return [start, end];
		}
		var next = Boundaries.nextNode(Html.expandForward(start));
		var prev = Boundaries.prevNode(Html.expandBackward(end));
		var overrides = Overrides.harvest(next).concat(Overrides.harvest(prev));
		var hasStyle = -1 < Overrides.indexOf(overrides, override);
		var op = hasStyle ? unformat : format;
		return op(start, end, nodeName);
	}

	/**
	 * Toggles formatting round the given selection.
	 *
	 * @todo   Support block formatting
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {string}    nodeName
	 * @param  {Array.<Boundary>}
	 * @return {Array.<Boundary>}
	 */
	function toggle(start, end, nodeName, boundaries) {
		var node = {nodeName: nodeName};
		if (Html.isTextLevelSemanticNode(node)) {
			return toggleInline(nodeName, start, end);
		}
		return [start, end];
	}

	return {
		format     : format,
		unformat   : unformat,
		toggle     : toggle,
		style      : style,
		className  : className,
		attribute  : attribute,
		cut        : cut,
		copy       : copy,
		breakline  : breakline,
		insert     : insert,
		wrap      : wrapElem,

		// obsolete
		split     : split,
		remove    : remove,
		trimClosingOpening: trimClosingOpening
	};
});
