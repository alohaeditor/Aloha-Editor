/**
 * typing.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'editing'
], function (
	Boundaries,
	Editing
) {
	'use strict';

	/**
	 * apply formatting to contents enclosed by start and end boundary
	 *
	 * @param {!String}   format the format to be applied, eg. bold, italic
	 * @param {!Boundary} start  Boundary to set the start position to
	 * @param {Boundary} end    Boundary to set the end position to
	 */
	function applyFormat(format, start, end) {
		end = end || start;
		Editing.format(
			Boundaries.toRange(start, end),
			format,
			true
		);
	}

	return {
		applyFormat: applyFormat
	};
});