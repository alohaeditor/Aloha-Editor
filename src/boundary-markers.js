/**
 * boundary-markers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'misc',
	'mutation',
	'arrays',
	'strings',
	'ranges',
	'paths',
	'boundaries'
], function BoundaryMarkers(
	Dom,
	Misc,
	Mutation,
	Arrays,
	Strings,
	Ranges,
	Paths,
	Boundaries
) {
	'use strict';

	/**
	 * Insert boundary markers at the given range.
	 *
	 * @param {Range} range
	 */
	function insert(range) {
		var doc = range.commonAncestorContainer.ownerDocument;
		var startMarker = doc.createTextNode(Dom.isTextNode(range.endContainer) ? ']' : '}');
		var endMarker = doc.createTextNode(Dom.isTextNode(range.startContainer) ? '[' : '{');
		var start = Mutation.splitBoundary(Boundaries.fromRangeStart(range), [range]);
		var end = Mutation.splitBoundary(Boundaries.fromRangeEnd(range));
		Dom.insert(startMarker, Boundaries.nextNode(end), Boundaries.isAtEnd(end));
		Dom.insert(endMarker, Boundaries.nextNode(start), Boundaries.isAtEnd(start));
	}

	/**
	 * Set the selection based on selection markers found in the content inside
	 * of `rootElem`.
	 *
	 * @param {Element} rootElem
	 * @param {Range}   range
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
				if (!previousSibling || !Dom.isTextNode(previousSibling)) {
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
			if (!Dom.isTextNode(node)) {
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
							&& Dom.isTextNode(node.previousSibling)) {
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

	/**
	 * Returns a string with boundary markers inserted into the representation
	 * of the DOM to indicate the span of the given range.
	 *
	 * @private
	 * @param  {Range} range
	 * @return {string}
	 */
	function showRange(range) {
		var cac = range.commonAncestorContainer;
		var start = Paths.fromBoundary(
			cac,
			Boundaries.raw(range.startContainer, range.startOffset)
		);
		var end = Paths.fromBoundary(
			cac,
			Boundaries.raw(range.endContainer, range.endOffset)
		);
		var clone;
		var root;

		if (cac.parentNode) {
			root = Paths.fromBoundary(cac.parentNode, Boundaries.fromNode(cac));
			clone = Boundaries.container(
				Paths.toBoundary(cac.parentNode.cloneNode(true), root)
			);
		} else {
			clone = cac.cloneNode(true);
			var one = cac.ownerDocument.createDocumentFragment();
			var two = cac.ownerDocument.createDocumentFragment();
			Dom.append(clone, two);
			Dom.append(two, one);
		}

		start = root.concat(start);
		end = root.concat(end);

		var copy = Ranges.fromBoundaries(
			Paths.toBoundary(clone, start),
			Paths.toBoundary(clone, end)
		);

		insert(copy);

		if (Dom.Nodes.DOCUMENT_FRAGMENT !== clone.nodeType) {
			return clone.outerHTML;
		}

		var node = cac.ownerDocument.createElement('div');
		Dom.append(clone, node);
		return node.innerHTML;
	}

	/**
	 * Show a single boundary.
	 *
	 * @private
	 * @param  {Boundary} boundary
	 * @return {string}
	 */
	function showBoundary(boundary) {
		return showRange(Ranges.fromBoundaries(boundary, boundary));
	}

	/**
	 * Show start/end boundary tuple.
	 *
	 * @private
	 * @param  {Array.<Boundary>} boundaries
	 * @return {string}
	 */
	function showBoundaries(boundaries) {
		return showRange(Ranges.fromBoundaries(boundaries[0], boundaries[1]));
	}

	/**
	 * Returns string representation of the given boundary boundaries tuple or
	 * range.
	 *
	 * @param  {Boundary|Array.<Boundary>|Range}
	 * @return {string}
	 */
	function hint(selection) {
		return (!Misc.defined(selection.length))
		     ? showRange(selection)
		     : ('string' === typeof selection[0].nodeName)
		     ? showBoundary(selection)
		     : showBoundaries(selection);
	}

	return {
		hint    : hint,
		insert  : insert,
		extract : extract,
	};
});
