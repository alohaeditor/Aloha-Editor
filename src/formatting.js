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
	 * @param {!String}     formatting the format to be applied, eg. bold, italic
	 * @param {!Boundaries} boundaries Boundary that enclose contents to be formatted
	 * @return {Boundaries} the updated boundaries after the formatting has been applied
	 */
	function inlineFormat(formatting, boundaries) {
		var range = Ranges.fromBoundaries(boundaries[0], boundaries[1]);
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
	 * @param {!String}     formatting the block format to be applied, eg. p or h1
	 * @param {!Boundaries} boundaries Boundary that enclose contents to be formatted
	 * @return {Boundaries} the updated boundaries after the formatting has been applied
	 */
	function blockFormat(formatting, boundaries) {
		var cac = Boundaries.commonContainer(boundaries[0], boundaries[1]);
		if (Dom.isTextNode(cac)) {
			cac = cac.parentNode;
		}
		Dom.replaceShallow(
			cac, 
			Boundaries.document(boundaries[0]).createElement(formatting)
		);

		return [Boundaries.fromNode(cac), Boundaries.fromEndOfNode(cac)];
	}

	/**
	 * apply an inline or block format like b, h1, p, pre or em to the contents selected
	 * by the boundaries
	 *
	 * @param {!String}     formatting the block format to be applied
	 * @param {!Boundaries} boundaries Boundary that enclose contents to be formatted
	 * @return {Boundaries} the updated boundaries after the formatting has been applied
	 */
	function format (formatting, boundaries) {
		switch (formatting) {
			case 'bold':
			case 'italic':
			case 'underline':
				return inlineFormat(formatting, boundaries);
			default:
				return blockFormat(formatting, boundaries);
		}
	}

	return {
		format: format
	};
});