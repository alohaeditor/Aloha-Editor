/**
 * traversing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'html',
	'strings',
	'boundaries'
], function (
	Html,
	Strings,
	Boundaries
) {
	'use strict';

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
	 */
	function prev(boundary, unit) {
		var behind = Html.prev(boundary, unit);
		if ('word' === unit) {
			if (Strings.WORD_BOUNDARY.test(nextCharacter(behind, 'char'))) {
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
	 */
	function next(boundary, unit) {
		if ('word' === unit) {
			if (Strings.WORD_BOUNDARY.test(nextCharacter(boundary, 'char'))) {
				return next(Html.next(boundary, 'char'), unit);
			}
		}
		return Html.next(boundary, unit);
	}

	return {
		next : next,
		prev : prev
	};
});
