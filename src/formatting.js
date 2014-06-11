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
	'html/predicates',
	'ranges'
], function (
	Boundaries,
	Dom,
	Editing,
	Predicates,
	Ranges
) {
	'use strict';

	/**
	 * Applies inline formatting to contents enclosed by start and end boundary.
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param {!String}     formatting
	 * @param {!Boundary}   start
	 * @param {!Boundary}   end
	 * @return {Array.<Boundary>}
	 */
	function inlineFormat(formatting, start, end) {
		var range = Ranges.fromBoundaries(start, end);
		Editing.format(
			range,
			formatting,
			true
		);
		return Boundaries.fromRange(range);
	}

	/**
	 * Applies block formatting to contents enclosed by start and end boundary.
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param {!String}     formatting
	 * @param {!Boundary}   start
	 * @param {!Boundary}   end
	 * @return {Array.<Boundary>}
	 */
	function blockFormat(formatting, start, end) {
		var cac = Boundaries.commonContainer(start, end);
		if (Dom.isTextNode(cac)) {
			cac = cac.parentNode;
		}
		cac = Dom.replaceShallow(
			cac, 
			Boundaries.document(start).createElement(formatting)
		);

		return [Boundaries.fromNode(cac), Boundaries.fromEndOfNode(cac)];
	}

	/**
	 * Applies block and inline formattings (eg. 'B', 'I', 'H2' - be
	 * sure to use UPPERCASE node names here) to contents enclosed 
	 * by start and end boundary. 
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param {!String}     formatting
	 * @param {!Boundary}   start
	 * @param {!Boundary}   end
	 * @return {Array.<Boundary>}
	 */
	function format (formatting, start, end) {
		var node = {
			nodeName : formatting
		};
		if (Predicates.isTextLevelSemanticNode(node)) {
			return inlineFormat(formatting, start, end);
		} else if (Predicates.isBlockNode(node)) {
			return blockFormat(formatting, start, end);
		}
		return [start, end];
	}

	return {
		format: format
	};
});