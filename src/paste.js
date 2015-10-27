/**
 * paste.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
 * @namespace paste
 */
define([
	'dom',
	'html',
	'undo',
	'paths',
	'arrays',
	'events',
	'boromir',
	'content',
	'editing',
	'zippers',
	'mutation',
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
	Boromir,
	Content,
	Editing,
	Zip,
	Mutation,
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
	 * @type {Object.<string, string>}
	 */
	var Mime = {
		plain : 'text/plain',
		html  : 'text/html'
	};

	/**
	 * Checks the content type of `event`.
	 *
	 * @private
	 * @param  {!Event} event
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
	 * @param  {!Event} event
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
	 * @param  {!Boundary} boundary
	 * @param  {!Node}     node
	 * @return {Bounbary}
	 */
	function moveBeforeBoundary(boundary, node) {
		return Mutation.insertNodeAtBoundary(node, boundary, true);
	}

	/**
	 * Pastes the markup at the given boundary range.
	 *
	 * @private
	 * @param  {!Boundary} start
	 * @param  {!Boundary} end
	 * @param  {string}    markup
	 * @return {Array.<Boundary>}
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

		// Because (unlike plain-text) pasted html will contain an unintended
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

		var editable = Dom.editingHost(Boundaries.container(boundaries[0]));
		var zip = Zip.zipper(editable, {
			start : boundaries[0],
			end   : boundaries[1]
		});
		var loc = Zip.go(zip.loc, zip.markers.start);
		
		// reverse the new nodes as we're inserting them at the beginning of the right hand content each time
		nodes.reverse().map(function (child) {
			loc = Zip.split(loc, function (loc) {
				return Content.allowsNesting(Zip.after(loc).name(), child.nodeName);
			});
			loc = Zip.insert(loc, Boromir(child));
		});
		
		var markers = Zip.update(loc);

		return [markers.start, markers.end];
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
	 * @memberOf paste
	 */
	function middleware(event) {
		if ('paste' !== event.type ||
		    'undefined' === typeof event.nativeEvent.clipboardData) {
			return event;
		}
		Events.suppress(event.nativeEvent);
		var content = extractContent(
			event.nativeEvent,
			event.nativeEvent.target.ownerDocument,
			event.editable.settings
		);
		if (!content) {
			return event;
		}
		Undo.capture(event.editable.undoContext, {
			meta: {type: 'paste'}
		}, function () {
			event.selection.boundaries = insert(
				event.selection.boundaries[0],
				event.selection.boundaries[1],
				content
			);
		});
		return event;
	}

	return {
		middleware: middleware
	};
});
