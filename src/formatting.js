/**
 * formatting.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'lists',
	'links',
	'editing',
	'overrides',
	'boundaries'
], function (
	Dom,
	Html,
	Lists,
	Links,
	Editing,
	Overrides,
	Boundaries
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
		if (formatting.toLowerCase() === 'a') {
			return Links.create('', start, end);
		}
		var node = {nodeName: formatting};
		if (Html.isTextLevelSemanticNode(node)) {
			return inlineFormat(formatting, start, end);
		}
		if (Html.isListContainer(node)) {
			return Lists.toggle(formatting, start, end);
		}
		if (Html.isBlockNode(node)) {
			return blockFormat(formatting, start, end);
		}
		return [start, end];
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
	function inlineToggle(nodeName, start, end) {
		var override = Overrides.nodeToState[nodeName];
		if (!override) {
			return [start, end];
		}
		var next = Boundaries.nextNode(Html.expandForward(start));
		var prev = Boundaries.prevNode(Html.expandBackward(end));
		var overrides = Overrides.harvest(next).concat(Overrides.harvest(prev));
		var hasStyle = -1 < Overrides.indexOf(overrides, override);
		var op = hasStyle ? Editing.unformat : Editing.format;
		return op(nodeName, start, end);
	}

	/**
	 * Toggles formatting round the given selection.
	 *
	 * @todo   Support block formatting
	 * @param  {string}    formatting
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @return {Array.<Boundary>}
	 */
	function toggle(formatting, start, end) {
		var node = {nodeName: formatting};
		if (Html.isTextLevelSemanticNode(node)) {
			return inlineToggle(formatting, start, end);
		}
		return [start, end];
	}

	return {
		format: format,
		toggle: toggle
	};
});
