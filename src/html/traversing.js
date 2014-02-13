/**
 * html/traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html/elements',
	'html/styles',
	'dom',
	'dom/traversing',
	'predicates',
	'arrays',
	'boundaries',
	'strings'
], function HtmlTraversing(
	Elements,
	Styles,
	Dom,
	DomTraversing,
	Predicates,
	Arrays,
	Boundaries,
	Strings
) {
	'use strict';

	/**
	 * Tags which represent elements that do not imply a word boundary.
	 *
	 * eg: <b>bar</b>camp where there is no word boundary in "barcamp".
	 *
	 * In HTML5 parlance, these would be many of those elements that fall in
	 * the category of "Text Level Semantics":
	 * http://www.w3.org/TR/html5/text-level-semantics.html
	 *
	 * @private
	 * @type {Object.<string, boolean>}
	 */
	var IN_WORD_TAGS = {
		'A'       : true,
		'ABBR'    : true,
		'B'       : true,
		'CITE'    : true,
		'CODE'    : true,
		'DEL'     : true,
		'EM'      : true,
		'I'       : true,
		'INS'     : true,
		'S'       : true,
		'SMALL'   : true,
		'SPAN'    : true,
		'STRONG'  : true,
		'SUB'     : true,
		'SUP'     : true,
		'U'       : true,
		'#text'   : true
	};

	var zwChars = Strings.ZERO_WIDTH_CHARACTERS.join('');
	var breakingWhiteSpaces = Arrays.difference(
		Strings.WHITE_SPACE_CHARACTERS,
		Strings.NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var WSP_FROM_END = new RegExp('[' + breakingWhiteSpaces + ']+[' + zwChars + ']*$');
	var NOT_WSP_FROM_END = new RegExp('[^' + breakingWhiteSpaces + ']'
	                     + '[' + breakingWhiteSpaces + zwChars + ']*$');
	var NOT_WSP = new RegExp('[^' + breakingWhiteSpaces + zwChars + ']');
	var NOT_ZWSP = new RegExp('[^' + zwChars + ']');

	/**
	 * Returns the previous node to the given node that is not one of it's
	 * ancestors.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function prevNonAncestor(node, match, until) {
		return DomTraversing.nextNonAncestor(node, true, match, until || Dom.isEditingHost);
	}

	/**
	 * Returns the next node to the given node that is not one of it's
	 * ancestors.
	 *
	 * @param  {Node} node
	 * @return {Node}
	 */
	function nextNonAncestor(node, match, until) {
		return DomTraversing.nextNonAncestor(node, false, match, until || Dom.isEditingHost);
	}

	/**
	 * Checks whether any white space sequence immediately after the specified
	 * offset in the given node is "significant."
	 *
	 * White Space Handling
	 * --------------------
	 *
	 * The HTML specification stipulates that not all "white spaces" in markup
	 * are visible.  Only those deemed "significant" are to be rendered visibly
	 * by the user agent.
	 *
	 * Therefore, if the position from which we are to determine the next
	 * visible character is adjacent to a "white space" (space, tabs,
	 * line-feed), or adjacent to line-breaking elements, determining the next
	 * visible character becomes non-trivial.
	 *
	 * The following rules apply:
	 *
	 * Note that for the purposes of these rules, the set of "white space" does
	 * not include non-breaking spaces (&nbsp;).
	 *
	 * 1. The first sequence of white space immediately after the opening tag
	 *    of a line-breaking element is insignificant and is ignored:
	 *
	 *     ignore
	 *       ||
	 *       vv
	 *    <p>  foo</p>
	 *       ..
	 *
	 *    will be rendered like <p>foo</p>
	 *
	 * 2. The first sequence of white space immediately after the opening tag
	 *    of a non-line-breaking element which is the first visible child of a
	 *    line-breaking element (or whose non-line-breaking ancestors are all
	 *    first visible children) is insignificant and is ignored:
	 *
	 *          ignore
	 *          |   |
	 *          v   v
	 *    <p><i> <b> foo</b></i></p>
	 *          .   .
	 *          ^
	 *          |
	 *          `-- unrendered text node
	 *
	 *    will be rendered like <p><i><b>foo</b></i></p>
	 *
	 * 3. The last sequence of white space immediately before the closing tag
	 *    of a line-breaking element is insignificant and is ignored:
	 *
	 *        ignore
	 *          |
	 *          v
	 *    <p>foo </p>
	 *          .
	 *
	 *    will be rendered like <p>foo</p>
	 *
	 *
	 * 4. The last sequence of white space immediately before the closing tag
	 *    of a non-line-breaking element which is the last visible child of a
	 *    line-breaking element (or whose non-line-breaking ancestors are all
	 *    last visible children) is insignificant and is ignored:
	 *
	 *           ignore               ignore  ignore
	 *             |                    ||    |    |
	 *             v                    vv    v    v
	 *    <p><b>foo </b></p><p><i><b>bar  </b> </i> </p>
	 *             .                    ..   .    .
	 *
	 *    will be rendered like <p><b>bar</b></p><p><i><b>bar</b></i></p>
	 *
	 * 5. The last sequence of white space immediately before the opening tag
	 *    of line-breaking elements or the first sequence of white space
	 *    immediately after the closing tag of line-breaking elements is
	 *    insignificant and is ignored:
	 *
	 *          ignore      ignore
	 *            |          |||
	 *            v          vvv
	 *    <div>foo <p>bar</p>    baz</div>
	 *            .          ...
	 *
	 * 6. The first sequence of white space immediately after a white space
	 *    character is insignificant and is ignored:
	 *
	 *         ignore
	 *           ||
	 *           vv
	 *    foo<b>   bar</b>
	 *          ...
	 *          ^
	 *          |
	 *          `-- significant
	 *
	 * @see For more information on white space handling:
	 *      http://www.w3.org/TR/REC-xml/#sec-white-space
	 *      http://www.w3.org/TR/xhtml1/overview.html#C_15
	 *      http://lists.w3.org/Archives/Public/www-dom/1999AprJun/0007.html
	 *      http://www.whatwg.org/specs/web-apps/current-work/multipage/editing.html#best-practices-for-in-page-editors
	 *
	 * @private
	 * @param  {Boundary} boundary Text boundary
	 * @return {boolean}
	 */
	function areNextWhiteSpacesSignificant(boundary) {
		var node = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var isTextNode = Dom.isTextNode(node);

		if (isTextNode && node.data.substr(0, offset).search(WSP_FROM_END) > -1) {
			// Because we have preceeding whitespaces behind the given boundary
			// see rule #6
			return false;
		}

		if (0 === offset) {
			return !!prevNonAncestor(node, function (node) {
				return Predicates.isInlineNode(node) && Elements.isRendered(node);
			}, function (node) {
				return Styles.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
			});
		}
		if (isTextNode && 0 !== node.data.substr(offset).search(WSP_FROM_END)) {
			return true;
		}
		return !!nextNonAncestor(node, function (node) {
			return Predicates.isInlineNode(node) && Elements.isRendered(node);
		}, function (node) {
			return Styles.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
		});
	}

	/**
	 * Returns the visible character offset immediately behind the given text
	 * boundary.
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {number}
	 */
	function prevSignificantOffset(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text = textnode.data.substr(0, offset);

		// "" ==> return -1
		//
		// " "  or "  " or "   " ==> return 1
		//  .       ..      ...
		if (!NOT_WSP.test(text)) {
			// Because `text` may be a sequence of white spaces so we need to
			// check if any of them are significant.
			return areNextWhiteSpacesSignificant(Boundaries.raw(textnode, 0))
			     ?  1
			     : -1;
		}

		// "a"    ==> spaces=0 ==> return offset - 0
		//
		// "a "   ==> spaces=1 ==> return offset - 0
		//   .
		//
		// "a  "  ==> spaces=2 ==> return offset - 1
		//   ..
		//
		// "a   " ==> spaces=3 ==> return offset - 2
		//   ...
		var spaces = text.match(NOT_WSP_FROM_END)[0].length - 1;

		offset = (spaces < 2) ? offset : offset - spaces + 1;

		if (0 === offset) {
			return 0;
		}

		var raw = Boundaries.raw(textnode, offset - 1);
		var isAtWhiteSpace = !NOT_WSP.test(text.charAt(offset - 1));
		var isAtVisibleChar = !isAtWhiteSpace || areNextWhiteSpacesSignificant(raw);

		return isAtVisibleChar ? offset : prevSignificantOffset(raw);
	}

	/**
	 * Returns the visible character offset immediately after the given
	 * text boundary.
	 *
	 * @param  {Boundary} boundary Text boundary
	 * @return {number}
	 */
	function nextSignificantOffset(boundary) {
		var textnode = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var index = textnode.data.substr(offset).search(
			areNextWhiteSpacesSignificant(boundary) ? NOT_ZWSP : NOT_WSP
		);
		return (-1 === index) ? -1 : offset + index;
	}

	/**
	 * Returns the boundary of the next visible character.
	 *
	 * All insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {?Boundary}
	 */
	function nextCharacterBoundary(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			return null;
		}
		var offset = nextSignificantOffset(boundary);
		return (-1 === offset)
		     ? null
		     : Boundaries.create(Boundaries.container(boundary), offset + 1);
	}

	/**
	 * Returns the boundary of the previous visible character from the given
	 * position in the document.
	 *
	 * All insignificant characters (including "zero-width" characters are
	 * ignored).
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {?Boundary}
	 */
	function prevCharacterBoundary(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			return null;
		}
		var offset = prevSignificantOffset(boundary);
		return (-1 === offset)
		     ? null
		     : Boundaries.create(Boundaries.container(boundary), offset - 1);
	}

	/**
	 * Checks whether a boundary can pass in or out of the given node without
	 * the visual position of the boundary being changed.
	 *
	 * Calling this function with a <b> node will return true, for example
	 * because the boundary position right in front of a B element's start tag
	 * and the boundary position right after the start tag are rendered at the
	 * same visual position.
	 *
	 * "|<b>foo..." is visually at the same position as "<b>|foo.."
	 *
	 * Likewise "..bar|</div>" is visually the same as "..bar</div>|" therefore
	 * it is deemed possible for a boundary to pass through (into or out of)
	 * the DIV element without the boundary being moved visually.
	 *
	 * The same is not true with single-tag elements like textnode and IMG
	 * elements:
	 *
	 * "|foo" is not visually the same as "f|oo".
	 *
	 * Nor is "|<img>" visually the same as "<img>|"
	 *
	 * Visible text nodes and void-type (blocks) nodes are therefore deemed as
	 * nodes that we cannot pass through.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {boolean}
	 */
	function canPassThrough(node) {
		return !(Dom.isTextNode(node) || Elements.isVoidType(node))
		    || Elements.isUnrendered(node);
	}

	/**
	 * Steps from one node boundary to the next until we reach a node that we
	 * cannot step into or out of without causing the visual position of
	 * `boundary` to change.
	 *
	 * @private
	 * @param  {Boundary}                    boundary
	 * @param  {function(Boundary):Node}     nextNode
	 * @param  {function(Boundary):Boundary} nextBoundary
	 * @return {Object}
	 */
	function nextVisiblePosition(boundary, nextNode, nextBoundary) {
		var crossedVisualBreak = false;
		var node;
		while (boundary) {
			node = nextNode(boundary);

			//   .-- node --.
			//   |          |
			//   v          v
			// |<p>   or |</h1>
			//  <p>|  or  </h1>|
			crossedVisualBreak = crossedVisualBreak
					|| (Styles.hasLinebreakingStyle(node) && Elements.isRendered(node));

			if (!canPassThrough(node) || Dom.isEditingHost(node)) {
				break;
			}

			do {
				boundary = nextBoundary(boundary);
			} while (Elements.isUnrendered(Boundaries.container(boundary)));
		}
		return {
			boundary           : boundary,
			crossedVisualBreak : crossedVisualBreak
		};
	}

	/**
	 * Returns an node/offset namedtuple of the next visible position in the
	 * document.
	 *
	 * The next visible position is always the next visible character, space,
	 * or line break or space.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Object}
	 */
	function stepVisualBoundary(boundary, steps) {
		// Inside of text node
		//
		// <#te|xt>
		if (Boundaries.isTextBoundary(boundary)) {
			return steps.nextCharacter(boundary)
			    || stepVisualBoundary(steps.stepBoundary(boundary), steps);
		}

		var move = nextVisiblePosition(
			boundary,
			steps.nodeAt,
			steps.stepBoundary
		);

		var next = move.boundary;
		var crossedVisualBreak = move.crossedVisualBreak;
		var node = steps.adjacentNode(next);

		// At start or end of block
		//
		//       <    >
		// <host>| or |</host>
		//    <p>| or |</p>
		if (!node) {
			return next;
		}

		// Before void element
		//
		//   .------- node -------.
		//   |                    |
		//   v  <              >  v
		//  <br>|<b>   or   <b>|<br>
		//
		//   .------- node -------.
		//   |                    |
		//   v  <              >  v
		// <img>|<div> or <div>|<img>
		if (Elements.isVoidType(node)) {
			return Boundaries.stepWhile(steps.stepBoundary(next), function (pos) {
				var node = steps.nodeAt(pos);
				return canPassThrough(node) && !Dom.isEditingHost(node);
			}, steps.stepBoundary);
		}

		// If crossedVisualBreak
		//
		//    .-------- node --------.
		//    |                      |
		//    v   <              >   v
		// <#text>|<div> or <div>|<#text>
		//
		// else
		//
		//    .-------- node --------.
		//    |                      |
		//    v   <              >   v
		// <#text>|<b>   or   <b>|<#text>
		return crossedVisualBreak ? next : steps.stepVisualBoundary(node);
	}

	/**
	 * Like Boundaries.next() except that it will skip over void-type nodes.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function stepForward(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.nodeAfter(boundary);
			if (node && Elements.isVoidType(node)) {
				return Boundaries.jumpOver(boundary);
			}
		}
		return Boundaries.next(boundary);
	}

	/**
	 * Like Boundaries.prev() except that it will skip over void-type nodes.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function stepBackward(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			var node = Boundaries.nodeBefore(boundary);
			if (node && Elements.isVoidType(node)) {
				return Boundaries.fromNode(node);
			}
		}
		return Boundaries.prev(boundary);
	}

	var forwardSteps = {
		nextCharacter : nextCharacterBoundary,
		stepBoundary  : stepForward,
		adjacentNode  : Boundaries.nodeAfter,
		nodeAt        : Boundaries.nextNode,
		followingSibling: function followingSibling(node) {
			return node.nextSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return nextVisualBoundary(Boundaries.raw(node, 0));
		}
	};

	var backwardSteps = {
		nextCharacter : prevCharacterBoundary,
		stepBoundary  : stepBackward,
		adjacentNode  : Boundaries.nodeBefore,
		nodeAt        : Boundaries.prevNode,
		followingSibling: function followingSibling(node) {
			return node.previousSibling;
		},
		stepVisualBoundary: function stepVisualBoundary(node) {
			return prevVisualBoundary(Boundaries.raw(node, Dom.nodeLength(node)));
		}
	};

	/**
	 * Checks whether or not the given node is a word breaking node.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {Boolean}
	 */
	function isWordbreakingNode(node) {
		return !IN_WORD_TAGS[node.nodeName];
	}

	/**
	 * Steps to the next visual boundary ahead of the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, forwardSteps);
	}

	/**
	 * Steps to the next visual boundary behind of the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevVisualBoundary(boundary) {
		return stepVisualBoundary(boundary, backwardSteps);
	}

	/**
	 * Moves the boundary over any insignificant positions.
	 *
	 * Insignificant boundary positions are those where the boundary is
	 * immediately before unrendered content.  Since such content is invisible,
	 * the boundary is rendered as though it is after the insignificant
	 * content.  This function simply moves the boundary forward so that the
	 * given boundary is infact where it seems to be visually.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function skipInsignificantPositions(boundary) {
		var next = boundary;

		if (Boundaries.isTextBoundary(next)) {
			var offset = nextSignificantOffset(next);

			// Because there may be no visible characters following the node
			// boundary in its container.
			//
			// "foo| "</p> or "foo| "" bar"
			//      .              .  .
			if (-1 === offset) {
				return skipInsignificantPositions(Boundaries.next(next));
			}

			// "|foo"
			if (Boundaries.offset(next) === offset) {
				return next;
			}

			// "foo | bar"
			//       .
			next = Boundaries.create(Boundaries.container(next), offset);
			return skipInsignificantPositions(next);
		}

		var node = Boundaries.nextNode(next);

		// |"foo" or <p>|" foo"
		//                .
		if (Dom.isTextNode(node)) {
			return skipInsignificantPositions(Boundaries.nextRawBoundary(next));
		}

		while (!Dom.isEditingHost(node) && Elements.isUnrendered(node)) {
			next = Boundaries.next(next);
			node = Boundaries.nextNode(next);
		}

		if (Styles.hasLinebreakingStyle(node)) {
			return next;
		}

		return next;
	}

	/**
	 * Checks whether the left boundary is at the same visual position as the
	 * right boundary.
	 *
	 * Take note that the order of the boundary is important.
	 * equals(left, right) is not necessarily the same as equals(right, left)
	 *
	 * @private
	 * @param  {Boundary} left
	 * @param  {Boundary} right
	 * @return {boolean}
	 */
	function equals(left, right) {
		var node, consumesOffset;

		left = skipInsignificantPositions(Boundaries.normalize(left));
		right = skipInsignificantPositions(Boundaries.normalize(right));

		while (left && !Boundaries.equals(left, right)) {
			node = Boundaries.nextNode(left);

			if (Dom.isEditingHost(node)) {
				return false;
			}

			consumesOffset = Dom.isTextNode(node)
			              || Elements.isVoidType(node)
			              || Styles.hasLinebreakingStyle(node);

			if (consumesOffset && Elements.isRendered(node)) {
				return false;
			}

			left = skipInsignificantPositions(Boundaries.next(left));
		}

		return true;
	}

	/**
	 * Moves the given boundary backwards over any positions that are (visually
	 * insignificant)invisible.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function skipPrevInsignificantPositions(boundary) {
		var next = boundary;

		if (Boundaries.isTextBoundary(next)) {
			var offset = prevSignificantOffset(next);

			// Because there may be no visible characters following the node
			// boundary in its container.
			//
			// <p>" |foo"</p>
			//     .
			if (-1 === offset) {
				var after = Boundaries.prev(next);
				//     ,-----+-- equal
				//     |     |
				//     v     v
				// "foo "</p> </div>..
				//     .     .
				while (equals(after, next)) {
					// Because linebreaks are significant positions
					if (Styles.hasLinebreakingStyle(Boundaries.prevNode(after))) {
						break;
					}
					after = Boundaries.prev(after);
				}
				return skipPrevInsignificantPositions(after);
			}

			// "foo|"
			if (Boundaries.offset(next) === offset) {
				return next;
			}

			// "foo | bar"
			//       .
			next = Boundaries.create(Boundaries.container(next), offset);
			return skipPrevInsignificantPositions(next);
		}

		var node = Boundaries.prevNode(next);

		// <b>"foo"|</b>
		if (Dom.isTextNode(node)) {
			return skipPrevInsignificantPositions(Boundaries.prevRawBoundary(next));
		}

		while (!Dom.isEditingHost(node) && Elements.isUnrendered(node)) {
			next = Boundaries.prev(next);
			node = Boundaries.prevNode(next);
		}

		return next;
	}

	/**
	 * Returns the next word boundary offset ahead of the given text boundary.
	 *
	 * Returns -1 if no word boundary is found.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function nextWordBoundaryOffset(boundary) {
		var node   = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text   = node.data.substr(offset);
		var index  = text.search(Strings.WORD_BOUNDARY);
		return (-1 === index) ? -1 : offset + index;
	}

	/**
	 * Returns the next word boundary offset behind the given text boundary.
	 *
	 * Returns -1 if no word boundary is found.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {number}
	 */
	function prevWordBoundaryOffset(boundary) {
		var node   = Boundaries.container(boundary);
		var offset = Boundaries.offset(boundary);
		var text   = node.data.substr(0, offset);
		var index  = text.search(Strings.WORD_BOUNDARY_FROM_END);
		return (-1 === index) ? -1 : index + 1;
	}

	/**
	 * Returns the next word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function nextWordBoundary(boundary) {
		var node, next;

		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.nextNode(boundary);
			next = Boundaries.nextRawBoundary(boundary);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return boundary;
			}

			return nextWordBoundary(next);
		}

		var offset = nextWordBoundaryOffset(boundary);

		// Because there may be no word boundary ahead of `offset` in the
		// boundary's container, we need to step out of the text node to
		// continue looking forward.
		//
		// "fo|o" or "foo|"
		if (-1 === offset) {
			next = Boundaries.next(boundary);
			node = Boundaries.nextNode(next);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return next;
			}

			return nextWordBoundary(next);
		}

		if (offset === Boundaries.offset(boundary)) {
			return boundary;
		}

		return Boundaries.raw(Boundaries.container(boundary), offset);
	}

	/**
	 * Returns the previous word boundary position.
	 *
	 * This will always be a position in front of a word or punctuation, but
	 * never in front of a space.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function prevWordBoundary(boundary) {
		var node, prev;

		if (Boundaries.isNodeBoundary(boundary)) {
			node = Boundaries.prevNode(boundary);
			prev = Boundaries.prevRawBoundary(boundary);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return boundary;
			}

			return prevWordBoundary(prev);
		}

		var offset = prevWordBoundaryOffset(boundary);

		// Because there may be no word boundary behind of `offset` in the
		// boundary's container, we need to step out of the text node to
		// continue looking backward.
		//
		// "fo|o" or "foo|"
		if (-1 === offset) {
			prev = Boundaries.prev(boundary);
			node = Boundaries.prevNode(prev);

			//         .---- node ----.
			//         |              |
			//         v              v
			// "foo"|</p> or "foo"|<input>
			if (isWordbreakingNode(node)) {
				return prev;
			}

			return prevWordBoundary(prev);
		}

		if (offset === Boundaries.offset(boundary)) {
			return boundary;
		}

		return Boundaries.raw(Boundaries.container(boundary), offset);
	}

	/**
	 * Moves the boundary forward by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char" -- Move in front of the next visible character.
	 *
	 * "word" -- Move in front of the next word.
	 *
	 *		A word is the smallest semantic unit.  It is a contigious sequence
	 *		of visible characters terminated by a space or puncuation character
	 *		or a word-breaker (in languages that do not use space to delimit
	 *		word boundaries).
	 *
	 * "boundary" -- Move in front of the next boundary and skip over void
	 *               elements.
	 *
	 * "offset" -- Move in front of the next visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space.  This can
	 *		be a line break, or a visible character.
	 *
	 * "node" -- Move in front of the next visible node.
	 *
	 * @param  {Boundary} boundary
	 * @param  {unit=}    unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function next(boundary, unit) {
		boundary = skipInsignificantPositions(boundary);
		var nextBoundary = boundary;
		switch (unit) {
		case 'char':
			nextBoundary = nextCharacterBoundary(boundary);
			break;
		case 'word':
			nextBoundary = nextWordBoundary(boundary);
			// "| foo" or |</p>
			if (equals(boundary, nextBoundary)) {
				nextBoundary = nextVisualBoundary(boundary);
			}
			break;
		case 'boundary':
			nextBoundary = stepForward(boundary);
			break;
		default:
			nextBoundary = nextVisualBoundary(boundary);
			break;
		}
		return nextBoundary;
		//return skipInsignificantPositions(nextBoundary);
	}

	/**
	 * Moves the boundary backwards by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary.  This value may be one of the following strings:
	 *
	 * "char" -- Move behind the previous visible character.
	 *
	 * "word" -- Move behind the previous word.
	 *
	 *		A word is the smallest semantic unit.  It is a contigious sequence
	 *		of visible characters terminated by a space or puncuation character
	 *		or a word-breaker (in languages that do not use space to delimit
	 *		word boundaries).
	 *
	 * "boundary" -- Move in behind of the previous boundary and skip over void
	 *               elements.
	 *
	 * "offset" -- Move behind the previous visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space.  This can
	 *		be a line break, or a visible character.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  unit Defaults to "offset"
	 * @return {Boundary}
	 */
	function prev(boundary, unit) {
		boundary = skipPrevInsignificantPositions(boundary);
		var prevBoundary;
		switch (unit) {
		case 'char':
			prevBoundary = prevCharacterBoundary(boundary);
			break;
		case 'word':
			prevBoundary = prevWordBoundary(boundary);
			// "foo |" or <p>|
			if (equals(prevBoundary, boundary)) {
				prevBoundary = prevVisualBoundary(boundary);
			}
			break;
		case 'boundary':
			prevBoundary = stepBackward(boundary);
			break;
		default:
			prevBoundary = prevVisualBoundary(boundary);
			break;
		}
		return skipPrevInsignificantPositions(prevBoundary);
	}

	/**
	 * Checks whether a boundary represents a position that at the apparent end
	 * of its container's content.
	 *
	 * Unlike Boundaries.isAtEnd(), it considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtEnd(boundary) {
		if (Boundaries.isAtEnd(boundary)) {
			// |</p>
			return true;
		}
		if (Boundaries.isTextBoundary(boundary)) {
			// "fo|o" or "foo| "
			return !NOT_WSP.test(Boundaries.container(boundary).data.substr(Boundaries.offset(boundary)));
		}
		var node = Boundaries.nodeAfter(boundary);
		var next = Dom.nextWhile(node, Elements.isUnrendered);
		// foo|<br></p> or foo|<i>bar</i>
		return !next || next === node;
	}

	/**
	 * Checks whether a boundary represents a position that at the apparent
	 * start of its container's content.
	 *
	 * Unlike Boundaries.isAtStart(), it considers the boundary position with
	 * respect to how it is visually represented, rather than simply where it
	 * is in the DOM tree.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {boolean}
	 */
	function isAtStart(boundary) {
		if (Boundaries.isAtStart(boundary)) {
			return true;
		}
		if (Boundaries.isTextBoundary(boundary)) {
			return !NOT_WSP.test(Boundaries.container(boundary).data.substr(0, Boundaries.offset(boundary)));
		}
		var node = Boundaries.nodeBefore(boundary);
		var next = Dom.prevWhile(node, Elements.isUnrendered);
		return !next || next === node;
	}

	/**
	 * Like Boundaries.nextNode(), except that it considers whether a boundary
	 * is at the end position with respect to how the boundary is visual
	 * represented, rather than simply where it is in the DOM structure.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function nextNode(boundary) {
		var node = Boundaries.nextNode(boundary);
		return isAtEnd(boundary) ? node.parentNode : node;
	}

	/**
	 * Like Boundaries.prevNode(), except that it considers whether a boundary
	 * is at the start position with respect to how the boundary is visual
	 * represented, rather than simply where it is in the DOM structure.
	 *
	 * @param  {Boundary} boundary
	 * @return {Node}
	 */
	function prevNode(boundary) {
		var node = Boundaries.prevNode(boundary);
		return isAtStart(boundary) ? node.parentNode : node;
	}

	return {
		prev                  : prev,
		next                  : next,
		prevNode              : prevNode,
		nextNode              : nextNode,
		prevSignificantOffset : prevSignificantOffset,
		nextSignificantOffset : nextSignificantOffset,
		stepForward           : stepForward,
		stepBackward          : stepBackward
	};
});
