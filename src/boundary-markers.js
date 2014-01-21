/**
 * boundary-markers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'mutation',
	'cursors',
	'arrays',
	'strings',
	'ranges'
], function BoundaryMarkers(
	Dom,
	Mutation,
	Cursors,
	Arrays,
	Strings,
	Ranges
) {
	'use strict';

	/**
	 * Insert selection markers at the given range.
	 *
	 * @param {Range} range
	 */
	function insert(range) {
		var leftMarkerChar  = (Dom.Nodes.TEXT === range.startContainer.nodeType ? '[' : '{');
		var rightMarkerChar = (Dom.Nodes.TEXT === range.endContainer.nodeType   ? ']' : '}');
		Mutation.splitTextContainers(range);
		var leftMarker = document.createTextNode(leftMarkerChar);
		var rightMarker = document.createTextNode(rightMarkerChar);
		var start = Cursors.cursorFromBoundaryPoint(
			range.startContainer,
			range.startOffset
		);
		var end = Cursors.cursorFromBoundaryPoint(
			range.endContainer,
			range.endOffset
		);
		start.insert(leftMarker);
		end.insert(rightMarker);
	}

	/**
	 * Set the selection based on selection markers found in the content inside
	 * of `rootElem`.
	 *
	 * @param {Element} rootElem
	 * @param {Range} range
	 */
	function extract(rootElem, range) {
		var markers = ['[', '{', '}', ']'];
		var markersFound = 0;
		function setBoundaryPoint(marker, node) {
			var setFn;
			if (0 === markersFound) {
				setFn = 'setStart';
				if (marker !== '[' && marker !== '{') {
					throw 'end marker before start marker';
				}
			} else if (1 === markersFound) {
				setFn = 'setEnd';
				if (marker !== ']' && marker !== '}') {
					throw 'start marker before end marker';
				}
			} else {
				throw 'Too many markers';
			}
			markersFound += 1;
			if (marker === '[' || marker === ']') {
				var previousSibling = node.previousSibling;
				if (!previousSibling || Dom.Nodes.TEXT !== previousSibling.nodeType) {
					previousSibling = document.createTextNode('');
					node.parentNode.insertBefore(previousSibling, node);
				}
				range[setFn].call(range, previousSibling, previousSibling.length);
				// Because we have set a text offset.
				return false;
			}
			range[setFn].call(range, node.parentNode, Dom.nodeIndex(node));
			// Because we have set a non-text offset.
			return true;
		}
		function extractMarkers(node) {
			if (Dom.Nodes.TEXT !== node.nodeType) {
				return;
			}
			var text = node.nodeValue;
			var parts = Strings.splitIncl(text, /[\[\{\}\]]/g);
			// Because modifying every text node when there can be only two
			// markers seems like too much overhead.
			if (!Arrays.contains(markers, parts[0]) && parts.length < 2) {
				return;
			}
			// Because non-text boundary positions must not be joined again.
			var forceNextSplit = false;
			parts.forEach(function (part, i) {
				// Because we don't want to join text nodes we haven't split.
				forceNextSplit = forceNextSplit || (i === 0);
				if (Arrays.contains(markers, part)) {
					forceNextSplit = setBoundaryPoint(part, node);
				} else if (!forceNextSplit
						&& node.previousSibling
							&& Dom.Nodes.TEXT === node.previousSibling.nodeType) {
					node.previousSibling.insertData(
						node.previousSibling.length,
						part
					);
				} else {
					node.parentNode.insertBefore(
						document.createTextNode(part),
						node
					);
				}
			});
			node.parentNode.removeChild(node);
		}
		Dom.walkRec(rootElem, extractMarkers);
		if (2 !== markersFound) {
			throw 'Missing one or both markers';
		}
	}

	function getPathToPosition(container, offset, limit) {
		var path = [offset];
		if (container === limit) {
			return path;
		}
		Dom.childAndParentsUntilIncl(container, function (node) {
			if (node === limit) {
				return true;
			}
			path.push(Dom.nodeIndex(node));
			return false;
		});
		return path;
	}

	function getPositionFromPath(container, path) {
		var node = container;
		while (path.length > 1) {
			node = node.childNodes[path.pop()];
		}
		return {
			container: node,
			offset: path.pop()
		};
	}

	/**
	 * Returns a string with boundary markers inserted into the representation
	 * of the DOM to indicate the span of the given range.
	 *
	 * @param {Range} range
	 * @return {string}
	 */
	function show(range) {
		var container = range.commonAncestorContainer;

		var startPath = getPathToPosition(
			range.startContainer,
			range.startOffset,
			container
		);

		var endPath = getPathToPosition(
			range.endContainer,
			range.endOffset,
			container
		);

		var node = container.parentNode
			? getPositionFromPath(
				container.parentNode.cloneNode(true),
				getPathToPosition(
					container,
					Dom.nodeIndex(container),
					container.parentNode
				)
			).container
			: document.createElement('div').appendChild(
				container.cloneNode(true)
			);

		var start = getPositionFromPath(node, startPath);
		var end = getPositionFromPath(node, endPath);

		range = Ranges.create(
			start.container,
			start.offset,
			end.container,
			end.offset
		);

		insert(range);

		return range.commonAncestorContainer.outerHTML;
	}

	function boundary(boundary) {
		return show(Ranges.fromBoundaries(boundary, boundary));
	}

	function boundaries(boundaries) {
		return show(Ranges.fromBoundaries(boundaries[0], boundaries[1]));
	}

	function hint() {
		var arg = arguments[0];
		if (arg.length) {
			return ('string' === typeof arg[0].nodeName)
			     ? boundary(arg)
			     : boundaries(arg);
		}
		return show(arg);
	}

	return {
		hint    : hint,
		insert  : insert,
		extract : extract,
	};
});
