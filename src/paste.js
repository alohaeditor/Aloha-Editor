/**
 * paste.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'html',
	'undo',
	'arrays',
	'events',
	'ranges',
	'content',
	'editing',
	'mutation',
	'transform',
	'boundaries',
	'transform/ms-word'
], function (
	Dom,
	Html,
	Undo,
	Arrays,
	Events,
	Ranges,
	Content,
	Editing,
	Mutation,
	Transform,
	Boundaries,
	WordTransform
) {
	'use strict';

	/**
	 * Mime types
	 *
	 * @private
	 * @type {Object<string, string>}
	 */
	var Mime = {
		plain : 'text/plain',
		html  : 'text/html'
	};

	/**
	 * Checks if the given event is a Paste Event.
	 *
	 * @private
	 * @param  {AlohaEvent} event
	 * @return {boolean}
	 */
	function isPasteEvent(event) {
		return 'paste' === event.type
		    || (event.nativeEvent && event.nativeEvent.clipboardData !== undefined);
	}

	/**
	 * Checks the content type of `event`.
	 *
	 * @private
	 * @param  {Event}  event
	 * @param  {string} type
	 * @return {boolean}
	 */
	function holds(event, type) {
		return Arrays.contains(event.clipboardData.types, type);
	}

	/**
	 * Gets content of the paste data that matches the given mime type.
	 *
	 * @private
	 * @param  {Event}  event
	 * @param  {string} type
	 * @return {string}
	 */
	function getData(event, type) {
		return event.clipboardData.getData(type);
	}

	/**
	 * Moves the given node before the given boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @param  {Node}     node
	 * @return {Bounbary}
	 */
	function moveBeforeBoundary(boundary, node) {
		return Mutation.insertNodeAtBoundary(node, boundary, true);
	}

	/**
	 * Pastes the markup at the given boundary range.
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @param  {string}   markup
	 * @return {Boundary} Boundary position after the inserted content
	 */
	function insert(start, end, markup) {
		var doc = Boundaries.document(start);
		var boundary = Editing.remove(start, end)[0];
		var element = Html.parse(markup, doc);
		var children = Dom.children(element);

		if (0 === children.length) {
			return boundary;
		}

		// Because we are only able to detect "void type" (non-content editable
		// nodes) when they are contained within a editing host
		Dom.setAttr(element, 'contentEditable', true);

		var first = children[0];

		// Because (unlike plain-text), pasted html will contain an unintended
		// linebreak caused by the wrapper inwhich the pasted content is placed
		// (P in most cases). We therefore unfold this wrapper whenever is valid
		// to do so (ie: we cannot unfold grouping elements like 'ul', 'table',
		// etc)
		if (!Dom.isTextNode(first) && !Html.isVoidType(first) && !Html.isGroupContainer(first)) {
			children = Dom.children(first).concat(children.slice(1));
		}

		if (0 === children.length) {
			return boundary;
		}

		children.forEach(function (node) {
			if (Html.hasLinebreakingStyle(node)) {
				boundary = Mutation.splitBoundaryUntil(boundary, function (boundary) {
					var container = Boundaries.container(boundary);
					return Dom.isEditingHost(container.parentNode)
					    || Content.allowsNesting(container.nodeName, node.nodeName);
				});
			}
			boundary = Mutation.insertNodeAtBoundary(node, boundary, true);
		});

		var last = Arrays.last(children);
		var next = Boundaries.nodeAfter(boundary);

		// Because we want to remove the unintentional line added at the end of
		// the pasted content
		if (next && ('P' === last.nodeName || 'DIV' === last.nodeName)) {
			if (Html.hasInlineStyle(next)) {
				boundary = Boundaries.fromEndOfNode(last);
				// Move the next inline nodes into the last element
				Dom.move(Dom.nodeAndNextSiblings(next, Html.hasLinebreakingStyle), last);
			} else if (!Html.isVoidType(next) && !Html.isGroupContainer(next)) {
				// Move the children of the last element into the beginning of
				// the next block element
				boundary = Dom.children(last).reduce(moveBeforeBoundary, Boundaries.create(next, 0));
				Dom.remove(last);
			}
		}

		return boundary;
	}

	/**
	 * Extracts the paste data from the event object.
	 *
	 * @private
	 * @param  {Event}    event
	 * @param  {Document} doc
	 * @return {string}
	 */
	function extractContent(event, doc) {
		if (holds(event, Mime.html)) {
			var content = getData(event, Mime.html);
			return WordTransform.isMSWordContent(content, doc)
			     ? Transform.html(Transform.msword(content, doc), doc)
			     : Transform.html(content, doc);
		}
		if (holds(event, Mime.plain)) {
			return Transform.plain(getData(event, Mime.plain), doc);
		}
		return '';
	}

	/**
	 * Handles and processes paste events.
	 *
	 * Updates:
	 * 		range
	 * 		nativeEvent
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEvent}
	 */
	function handle(event) {
		if (!event.editable || !isPasteEvent(event)) {
			return event;
		}
		Events.suppress(event.nativeEvent);
		var doc = event.target.ownerDocument;
		var boundaries = Boundaries.get(doc);
		if (!boundaries) {
			return event;
		}
		var content = extractContent(event.nativeEvent, doc);
		if (!content) {
			return event;
		}
		Undo.capture(event.editable['undoContext'], {
			meta: {type: 'paste'}
		}, function () {
			var boundary = insert(boundaries[0], boundaries[1], content);
			console.warn(boundaries[0], boundary);
			event.range = Ranges.fromBoundaries(boundary, boundary);
		});
		return event;
	}

	return {
		handle: handle
	};
});
