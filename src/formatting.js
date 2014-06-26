/**
 * formatting.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'boundaries',
	'dom',
	'editing',
	'html/predicates'
], function (
	Boundaries,
	Dom,
	Editing,
	Html
) {
	'use strict';

	/**
	 * Applies inline formatting to contents enclosed by start and end boundary.
	 * Will return updated array of boundaries after the operation.
	 *
	 * @private
	 * @param  {!string}   formatting
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function inlineFormat(formatting, start, end) {
		return Editing.format(formatting, start, end);
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
	function blockFormat(formatting, start, end) {
		var node = Boundaries.container(start);
		if (Html.isBlockNode(node)) {
			node = Boundaries.nextNode(start);
		}
		if (Dom.isTextNode(node)) {
			node = node.parentNode;
		}
		if (Html.isGroupContainer(node) || Html.isGroupedElement(node) || Dom.isEditingHost(node)) {
			return [start, end];
		}
		var replacement = Boundaries.document(start).createElement(formatting);
		Dom.replaceShallow(node, replacement);
		return [
			Boundaries.fromNode(replacement),
			Boundaries.fromEndOfNode(replacement)
		];
	}

	/**
	 * Applies block and inline formattings (eg. 'B', 'I', 'H2' - be sure to use
	 * UPPERCASE node names here) to contents enclosed by start and end
	 * boundary.
	 *
	 * Will return updated array of boundaries after the operation.
	 *
	 * @param  {!string}   formatting
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function format(formatting, start, end) {
		var node = {
			nodeName : formatting
		};
		if (Html.isTextLevelSemanticNode(node)) {
			return inlineFormat(formatting, start, end);
		}
		if (Html.isBlockNode(node)) {
			return blockFormat(formatting, start, end);
		}
		return [start, end];
	}

	return {
		format: format
	};
});
