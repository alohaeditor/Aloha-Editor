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
	'paths',
	'arrays',
	'events',
	'content',
	'editing',
	'mutation',
	'mutation-trees',
	'boundaries',
	'functions',
	'transform',
	'transform/ms-word'
], function (
	Dom,
	Html,
	Undo,
	Paths,
	Arrays,
	Events,
	Content,
	Editing,
	Mutation,
	MutationTrees,
	Boundaries,
	Fn,
	Transform,
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
		var boundaries = Editing.remove(start, end);
		var nodes = Html.parse(markup, doc);

		if (0 === nodes.length) {
			return boundaries;
		}

		// Because we are only able to detect "void type" (non-content editable
		// nodes) when they are contained within a editing host
		var container = doc.createElement('div');
		Dom.setAttr(container, 'contentEditable', true);
		Dom.move(nodes, container);

		var first = nodes[0];

		// Because (unlike plain-text), pasted html will contain an unintended
		// linebreak caused by the wrapper inwhich the pasted content is placed
		// (P in most cases). We therefore unfold this wrapper whenever is valid
		// to do so (ie: we cannot unfold grouping elements like 'ul', 'table',
		// etc)
		if (!Dom.isTextNode(first) && !Html.isVoidType(first) && !Html.isGroupContainer(first)) {
			nodes = Dom.children(first).concat(nodes.slice(1));
		}

		if (0 === nodes.length) {
			return boundaries;
		}

		var insertBoundary = boundaries[0];
		var limit = Dom.editingHost(Boundaries.container(insertBoundary));
		var tree = MutationTrees.create(limit, boundaries);

		nodes.forEach(function (child) {
			var insertPath = Paths.fromBoundary(limit, insertBoundary);
			var result = MutationTrees.split(tree, insertPath, boundaries);
			tree = result[0];
			insertPath = result[1];
			tree = MutationTrees.insert(tree, insertPath, child, boundaries);
			insertBoundary = Paths.toBoundary(limit, insertPath);
		});

		tree.updateDom();
		return;

		var result = MutationTrees.update(tree);
		boundaries = result[1].map(Fn.partial(Paths.toBoundary, result[0].domNode()));

		var last = Arrays.last(nodes);
		var next = Boundaries.nodeAfter(boundaries[1]);

		// Because we want to remove the unintentional line added at the end of
		// the pasted content
		if (next && ('P' === last.nodeName || 'DIV' === last.nodeName)) {
			if (Html.hasInlineStyle(next)) {
				boundaries[1] = Boundaries.fromEndOfNode(last);
				// Move the next inline nodes into the last element
				Dom.move(Dom.nodeAndNextSiblings(next, Html.hasLinebreakingStyle), last);
			} else if (!Html.isVoidType(next) && !Html.isGroupContainer(next)) {
				// Move the children of the last element into the beginning of
				// the next block element
				boundaries[1] = Dom.children(last).reduce(moveBeforeBoundary, Boundaries.create(next, 0));
				Dom.remove(last);
			}
		}

		return boundaries;
	}

	/**
	 * Extracts the paste data from the event object.
	 *
	 * @private
	 * @param  {Event}    event
	 * @param  {Document} doc
	 * @return {string}
	 */
	function extractContent(event, doc, rules) {
		if (holds(event, Mime.html)) {
			var content = getData(event, Mime.html);
			return WordTransform.isMSWordContent(content, doc)
			     ? Transform.html(Transform.msword(content, doc), doc, rules)
			     : Transform.html(content, doc, rules);
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
		if (!event.editable || !event.boundaries || !isPasteEvent(event)) {
			return event;
		}
		Events.suppress(event.nativeEvent);
		var content = extractContent(
			event.target,
			event.target.ownerDocument,
			event.editable.settings
		);
		if (!content) {
			return event;
		}
		Undo.capture(event.editable['undoContext'], {
			meta: {type: 'paste'}
		}, function () {
			event.boundaries = insert(event.boundaries[0], event.boundaries[1], content);
		});
		return event;
	}

	return {
		handle: handle
	};
});
