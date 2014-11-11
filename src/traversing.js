/**
 * traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace traversing
 */
define([
	'dom',
	'html',
	'arrays',
	'strings',
	'boundaries'
], function (
	Dom,
	Html,
	Arrays,
	Strings,
	Boundaries
) {
	'use strict';

	/**
	 * Moves the given boundary forward (if needed) to encapsulate all adjacent
	 * unrendered characters.
	 *
	 * This operation should therefore never cause the visual representation of
	 * the boundary to change.
	 *
	 * Since it is impossible to place a boundary immediately behind an
	 * invisible character, this function will only ever need to expand a
	 * range's end position.
	 *
	 * @param  {!Boundary} boundary
	 * @return {Boundary}
	 */
	function envelopeInvisibleCharacters(boundary) {
		if (Boundaries.isNodeBoundary(boundary)) {
			return boundary;
		}
		var offset = Html.nextSignificantOffset(boundary);
		var container = Boundaries.container(boundary);
		return (-1 === offset)
		     ? Boundaries.fromEndOfNode(container)
		     : Boundaries.create(container, offset);
	}

	/**
	 * Return the character immediately following the given boundary.
	 * If not character exists, an empty string is returned.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {string}
	 */
	function nextCharacter(boundary) {
		var ahead = Html.next(boundary, 'char');
		if (ahead && Boundaries.isTextBoundary(ahead)) {
			var node = Boundaries.container(ahead);
			var offset = Boundaries.offset(ahead);
			return node.data.substr(offset - 1, 1);
		}
		return '';
	}

	/**
	 * Moves the boundary backwards by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary. This value may be one of the following strings:
	 *
	 * "char" -- Move behind the previous visible character.
	 *
	 * "word" -- Move behind the previous word.
	 *
	 *		A word is the smallest semantic unit. It is a contigious sequence of
	 *		visible characters terminated by a space or puncuation character or
	 *		a word-breaker (in languages that do not use space to delimit word
	 *		boundaries).
	 *
	 * "boundary" -- Move in behind of the previous boundary and skip over void
	 *               elements.
	 *
	 * "offset" -- Move behind the previous visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space. This can be
	 *		a line break, or a visible character.
	 *
	 * "node" -- Move in front of the previous visible node.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  unit Defaults to "offset"
	 * @return {?Boundary}
	 * @memberOf traversing
	 */
	function prev(boundary, unit) {
		var behind = Html.prev(boundary, unit);
		if ('word' === unit) {
			if (Strings.WORD_BOUNDARY.test(nextCharacter(behind))) {
				return prev(behind, unit);
			}
		}
		return behind;
	}

	/**
	 * Moves the boundary forward by a unit measure.
	 *
	 * The second parameter `unit` specifies the unit with which to move the
	 * boundary. This value may be one of the following strings:
	 *
	 * "char" -- Move in front of the next visible character.
	 *
	 * "word" -- Move in front of the next word.
	 *
	 *		A word is the smallest semantic unit. It is a contigious sequence of
	 *		visible characters terminated by a space or puncuation character or
	 *		a word-breaker (in languages that do not use space to delimit word
	 *		boundaries).
	 *
	 * "boundary" -- Move in front of the next boundary and skip over void
	 *               elements.
	 *
	 * "offset" -- Move in front of the next visual offset.
	 *
	 *		A visual offset is the smallest unit of consumed space. This can be
	 *		a line break, or a visible character.
	 *
	 * "node" -- Move in front of the next visible node.
	 *
	 * @param  {Boundary} boundary
	 * @param  {string=}  unit Defaults to "offset"
	 * @return {?Boundary}
	 * @memberOf traversing
	 */
	function next(boundary, unit) {
		if ('word' === unit) {
			if (Strings.WORD_BOUNDARY.test(nextCharacter(boundary))) {
				return next(Html.next(boundary, 'char'), unit);
			}
		}
		return Html.next(boundary, unit);
	}

	/**
	 * Expands two boundaries to contain a word.
	 *
	 * The boundaries represent the start and end containers of a range.
	 *
	 * A word is a collection of visible characters terminated by a space or
	 * punctuation character or a word-breaker (in languages that do not use
	 * space to delimit word boundaries).
	 *
	 * foo b[a]r baz → foo [bar] baz
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function expandToWord(start, end) {
		return [
			prev(start, 'word') || start,
			next(end,   'word') || end
		];
	}

	/**
	 * Expands two boundaries to contain a block.
	 *
	 * The boundaries represent the start and end containers of a range.
	 *
	 * [,] = start,end boundary
	 *
	 *  +-------+     [ +-------+
	 *  | block |       | block |
	 *  |       |   →   |       |
	 *  | [ ]   |       |       |
	 *  +-------+       +-------+ ]
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function expandToBlock(start, end) {
		var cac = Boundaries.commonContainer(start, end);
		var ancestors = Dom.childAndParentsUntilIncl(cac, function (node) {
			return Html.hasLinebreakingStyle(node) || Dom.isEditingHost(node);
		});
		var node = Arrays.last(ancestors);
		var len = Dom.nodeLength(node);
		return [Boundaries.create(node, 0), next(Boundaries.create(node, len))];
	}

	/**
	 * Expands the given boundaries to contain the given unit.
	 *
	 * The second parameter `unit` specifies the unit with which to expand.
	 * This value may be one of the following strings:
	 *
	 * "word" -- Expand to completely contain a word.
	 *
	 *		A word is the smallest semantic unit.  It is a contigious sequence
	 *		of characters terminated by a space or puncuation character or a
	 *		word-breaker (in languages that do not use space to delimit word
	 *		boundaries).
	 *
	 * "block" -- Expand to completely contain a block.
	 *
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @param  {unit}     unit
	 * @return {Array.<Boundary>}
	 * @memberOf traversing
	 */
	function expand(start, end, unit) {
		switch (unit) {
		case 'word':
			return expandToWord(start, end);
		case 'block':
			return expandToBlock(start, end);
		default:
			throw '"' + unit + '"? what\'s that?';
		}
	}

	return {
		expand                      : expand,
		next                        : next,
		prev                        : prev,
		backward                    : Html.stepBackward,
		forward                     : Html.stepForward,
		isAtStart                   : Html.isAtStart,
		isAtEnd                     : Html.isAtEnd,
		isBoundaryEqual             : Html.isBoundaryEqual,
		envelopeInvisibleCharacters : envelopeInvisibleCharacters
	};
});
