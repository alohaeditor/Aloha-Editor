/**
 * markers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace markers
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
], function (
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

	/*
	var marksX = {
		'TEXT_LEFT'      : '▓[',
		'TEXT_RIGHT'     : ']▓',
		'ELEMENT_LEFT'   : '▓{',
		'ELEMENT_RIGHT'  : '}▓',
		'TEXT_SINGLE'    : '▓',
		'ELEMENT_SINGLE' : '█'
	};
	*/

	var marks = {
		'TEXT_LEFT'      : '[',
		'TEXT_RIGHT'     : ']',
		'ELEMENT_LEFT'   : '{',
		'ELEMENT_RIGHT'  : '}',
		'TEXT_SINGLE'    : '¦',
		'ELEMENT_SINGLE' : '|'
	};

	/**
	 * Insert boundary markers at the given boundaries.
	 *
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {Array.<Boundary>}
	 * @memberOf markers
	 */
	function insert(start, end) {
		var startContainer = Boundaries.container(start);
		var endContainer = Boundaries.container(end);
		var doc = startContainer.ownerDocument;
		var startMarker = doc.createTextNode(Dom.isTextNode(endContainer)
		                ? marks.TEXT_RIGHT
		                : marks.ELEMENT_RIGHT);
		var endMarker = doc.createTextNode(Dom.isTextNode(startContainer)
		              ? marks.TEXT_LEFT
		              : marks.ELEMENT_LEFT);
		var range = Boundaries.range(start, end);
		start = Mutation.splitBoundary(Boundaries.fromRangeStart(range), [range]);
		end = Mutation.splitBoundary(Boundaries.fromRangeEnd(range));
		Dom.insert(startMarker, Boundaries.nextNode(end), Boundaries.isAtEnd(end));
		Dom.insert(endMarker, Boundaries.nextNode(start), Boundaries.isAtEnd(start));
		return [start, end];
	}

	/**
	 * Insert a single boundary marker at the given boundary.
	 *
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function insertSingle(boundary) {
		var container = Boundaries.container(boundary);
		var marker = container.ownerDocument.createTextNode(
			Boundaries.isTextBoundary(boundary)
				? marks.TEXT_SINGLE
				: marks.ELEMENT_SINGLE
		);
		boundary = Mutation.splitBoundary(boundary);
		Dom.insert(marker, Boundaries.nextNode(boundary), Boundaries.isAtEnd(boundary));
		return boundary;
	}

	/**
	 * Set the selection based on selection markers found in the content inside
	 * of `rootElem`.
	 *
	 * @param  {Element} rootElem
	 * @return {Array.<Boundary>}
	 * @memberOf markers
	 */
	function extract(rootElem) {
		var markers = ['[', '{', '}', ']'];
		var markersFound = 0;
		var boundaries = [];
		function setBoundaryPoint(marker, node) {
			var whichBoundary;
			if (0 === markersFound) {
				whichBoundary = 0;
				if (marker !== '[' && marker !== '{') {
					throw 'end marker before start marker';
				}
			} else if (1 === markersFound) {
				whichBoundary = 1;
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
					previousSibling = node.ownerDocument.createTextNode('');
					node.parentNode.insertBefore(previousSibling, node);
				}
				boundaries[whichBoundary] = [previousSibling, previousSibling.length];
				// Because we have set a text offset.
				return false;
			}
			boundaries[whichBoundary] = [node.parentNode, Dom.nodeIndex(node)];
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
			// markers seems like too much overhead
			if (!Arrays.contains(markers, parts[0]) && parts.length < 2) {
				return;
			}
			// Because non-text boundary positions must not be joined again
			var forceNextSplit = false;
			parts.forEach(function (part, i) {
				// Because we don't want to join text nodes we haven't split
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
						node.ownerDocument.createTextNode(part),
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
		return boundaries;
	}

	/**
	 * Returns a string with boundary markers inserted into the representation
	 * of the DOM to indicate the span of the given range.
	 *
	 * @private
	 * @param  {Boundary} start
	 * @param  {Boundary} end
	 * @return {string}
	 */
	function show(start, end) {
		var single = !end;

		end = end || start;

		var cac = Boundaries.commonContainer(start, end);

		var doc = Dom.Nodes.DOCUMENT === cac.nodeType
		        ? cac
		        : cac.ownerDocument;

		var startPath = Paths.fromBoundary(cac, start);
		var endPath = Paths.fromBoundary(cac, end);
		var clone;
		var root;

		if (cac.parentNode) {
			root = Paths.fromBoundary(
				cac.parentNode,
				Boundaries.fromFrontOfNode(cac)
			);
			clone = Boundaries.container(
				Paths.toBoundary(cac.parentNode.cloneNode(true), root)
			);
		} else {
			clone = cac.cloneNode(true);
			var one = doc.createDocumentFragment();
			var two = doc.createDocumentFragment();
			Dom.append(clone, two);
			Dom.append(two, one);
			root = [];
		}

		startPath = root.concat(startPath);
		endPath = root.concat(endPath);

		if (single) {
			insertSingle(Paths.toBoundary(clone, startPath));
		} else {
			insert(
				Paths.toBoundary(clone, startPath),
				Paths.toBoundary(clone, endPath)
			);
		}

		if (Dom.Nodes.DOCUMENT_FRAGMENT !== clone.nodeType) {
			return clone.outerHTML;
		}

		var node = doc.createElement('div');
		Dom.append(clone, node);
		return node.innerHTML;
	}

	function rawBoundariesFromRange(range) {
		return [
			Boundaries.raw(range.startContainer, range.startOffset),
			Boundaries.raw(range.endContainer, range.endOffset)
		];
	}

	/**
	 * Returns string representation of the given boundary boundaries tuple or
	 * range.
	 *
	 * @param  {Boundary|Array.<Boundary>|Range}
	 * @return {string}
	 * @memberOf markers
	 */
	function hint(selection) {
		if (Misc.defined(selection.length)) {
			return ('string' === typeof selection[0].nodeName)
			     ? show(selection)
			     : show(selection[0], selection[1]);
		}
		var boundaries = rawBoundariesFromRange(selection);
		return show(boundaries[0], boundaries[1]);
	}

	return {
		hint    : hint,
		insert  : insert,
		extract : extract
	};
});
