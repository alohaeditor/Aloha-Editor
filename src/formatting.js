/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'editing',
	'ranges'
], function (
	Boundaries,
	Dom,
	Editing,
	Ranges
) {
	'use strict';

	/**
	 * apply formatting to contents enclosed by start and end boundary
	 *
	 * @param {!String}   formatting the format to be applied, eg. bold, italic
	 * @param {!Boundary} start      Boundary to set the start position to
	 * @param {Boundary}  end        Boundary to set the end position to
	 * @return {Boundary} the updated boundaries after formatting has been applied
	 */
	function format(formatting, start, end) {
		var range = Ranges.fromBoundaries(start, end);
		end = end || start;
		Editing.format(
			range,
			formatting,
			true
		);
		return Boundaries.fromRange(range);
	}

	/**
	 * apply a block format like h1, p or pre from start to end boundary
	 *
	 * @param {!String}   formatting the block format to be applied, eg. p or h1
	 * @param {!Boundary} start      Boundary to set the start position to
	 * @param {Boundary}  end        Boundary to set the end position to
	 * @return {Boundary} the updated boundaries after block formatting has been applied
	 */
	function blockFormat(formatting, start, end) {
		var cac = Boundaries.commonContainer(start, end);
		if (Dom.isTextNode(cac)) {
			cac = cac.parentNode;
		}
		Dom.replaceShallow(
			cac, 
			Boundaries.document(start).createElement(formatting)
		);

		return [Boundaries.fromNode(cac), Boundaries.fromEndOfNode(cac)];
	}

	return {
		format: format,
		blockFormat: blockFormat
	};
});