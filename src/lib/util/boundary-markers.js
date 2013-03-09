define(['util/dom2', 'util/arrays', 'util/strings'], function (Dom, Arrays, Strings) {
	'use strict';

	function insert(range) {
		var leftMarkerChar  = (3 === range.startContainer.nodeType ? '[' : '{');
		var rightMarkerChar = (3 === range.endContainer.nodeType   ? ']' : '}');
		Dom.splitTextContainers(range);
		var leftMarker = document.createTextNode(leftMarkerChar);
		var rightMarker = document.createTextNode(rightMarkerChar);
		var start = Dom.cursorFromBoundaryPoint(range.startContainer, range.startOffset);
		var end = Dom.cursorFromBoundaryPoint(range.endContainer, range.endOffset);
		start.insert(leftMarker);
		end.insert(rightMarker);
	}

	function extract(rootElem, range) {
		var markers = ['[', '{', '}', ']'];
		var markersFound = 0;
		function setBoundaryPoint(marker, node) {
			var setFn;
			if (0 === markersFound) {
				setFn = 'setStart';
				if (marker !== '[' && marker !== '{') {
					throw "end marker before start marker";
				}
			} else if (1 === markersFound) {
				setFn = 'setEnd';
				if (marker !== ']' && marker !== '}') {
					throw "start marker before end marker";
				}
			} else {
				throw "Too many markers";
			}
			markersFound += 1;
			if (marker === '[' || marker === ']') {
				var previousSibling = node.previousSibling;
				if (!previousSibling || 3 !== previousSibling.nodeType) {
					previousSibling = document.createTextNode('');
					node.parentNode.insertBefore(previousSibling, node);
				}
				range[setFn].call(range, previousSibling, previousSibling.length);
				// Because we have set a text offset.
				return false;
			} else { // marker === '{' || marker === '}'
				range[setFn].call(range, node.parentNode, Dom.nodeIndex(node));
				// Because we have set a non-text offset.
				return true;
			}
		}
		function extractMarkers(node) {
			if (3 !== node.nodeType) {
				return;
			}
			var text = node.nodeValue;
			var parts = Strings.splitIncl(text, /[\[\{\}\]]/g);
			// Because modifying every text node when there can be
			// only two markers seems like too much overhead.
			if (!Arrays.contains(markers, parts[0]) && parts.length < 2) {
				return;
			}
			// Because non-text boundary positions must not be joined again.
			var forceNextSplit = false;
			Arrays.forEach(parts, function (part, i) {
				// Because we don't want to join text nodes we haven't split.
				forceNextSplit = forceNextSplit || (i === 0);
				if (Arrays.contains(markers, part)) {
					forceNextSplit = setBoundaryPoint(part, node);
				} else if (!forceNextSplit && node.previousSibling && 3 === node.previousSibling.nodeType) {
					node.previousSibling.insertData(node.previousSibling.length, part);
				} else {
					node.parentNode.insertBefore(document.createTextNode(part), node);
				}
			});
			node.parentNode.removeChild(node);
		}
		Dom.walkRec(rootElem, extractMarkers);
		if (2 !== markersFound) {
			throw "Missing one or both markers";
		}
	}

	return {
		insert: insert,
		extract: extract
	};
});
