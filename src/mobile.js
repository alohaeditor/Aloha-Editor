/**
 * mobile.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @namespace mobile
 */
define([
	'dom',
	'html',
	'paths',
	'arrays',
	'strings',
	'boundaries',
	'selections'
], function (
	Dom,
	Html,
	Paths,
	Arrays,
	Strings,
	Boundaries,
	Selections
) {
	'use strict';

	var VOID_MARKER = '♞';
	var LEAF = 1 << 0;
	var TEXT = 1 << 1;
	var VOID = 1 << 2;
	var META = 1 << 3;

	function getBit(node) {
		if (Dom.isTextNode(node)) {
			return TEXT | LEAF;
		}
		if (Html.isVoidNode(node)) {
			return VOID | LEAF;
		}
		return META;
	}

	/**
	 * Clips the sub section of the given path that is common with `root`.
	 *
	 * @private
	 * @param  {!Path} root
	 * @param  {!Path} path
	 * @return {Path}
	 */
	function clipCommonRoot(root, path) {
		for (var i = 0; i < root.length; i++) {
			if (path[i] !== root[i]) {
				return [];
			}
		}
		return path.slice(i);
	}

	function getPaths(node, boundaries) {
		var paths = [];
		var body = node.ownerDocument.body;
		var origin = Paths.fromBoundary(body, Boundaries.fromFrontOfNode(node));
		boundaries.forEach(function (boundary) {
			paths.push(clipCommonRoot(
				origin,
				Paths.fromBoundary(body, boundary)
			));
		});
		return paths;
	}

	function parseDom(element, offset, paths) {
		offset = offset || 0;
		var ranges = [];
		var offsets = [];
		var snippets = [];
		var wasText = false;
		Dom.children(element).forEach(function (node, index) {
			var bit = getBit(node);
			var length = 0;
			var trails = paths.filter(function (path) { return path[0] === index; })
			                  .map(function (path) { return path.slice(1); });

			if (bit & TEXT) {
				if (wasText) {
					ranges.push([offset, offset, 'split']);
				}
				wasText = true;
				snippets.push(node.data);
				length = node.data.length;
				offsets = offsets.concat(trails.map(function (trail) { return offset + (trail[0] || 0); }));
			} else if (bit & VOID) {
				wasText = false;
				snippets.push(VOID_MARKER);
				length = 1;
				offsets = offsets.concat(trails.map(function (trail) { return offset + (trail[0] || 0); }));
			} else {
				wasText = false;
				var more = parseDom(node, offset, trails);
				ranges = ranges.concat(
					[[offset, offset + more.content.length, node]],
					more.ranges
				);
				snippets.push(more.content);
				length += more.content.length;
				offsets = offsets.concat(more.offsets);
			}
			offset += length;
		});
		return {
			content   : snippets.join(''),
			offsets   : offsets,
			ranges    : ranges,
			collapsed : []
		};
	}

	// `remove

	function remove(deranged, start, end) {
		function reduceRanges(list, item) {
			var a = item[0];
			var b = item[1];
			if (!a || !b || (a >= start && b <= end)) {
				return list.concat([[]]);
			}
			if (start < a) {
				a = a - (Math.min(a, end) - start);
			}
			if (start < b) {
				b = b - (Math.min(b, end) - start);
			}
			return list.concat([[a, b].concat(item.slice(2))]);
		}
		function reduceOffset(list, offset) {
			if (offset >= start && offset <= end) {
				return list;
			}
			if (start < offset) {
				offset = offset - (Math.min(offset, end) - start);
			}
			return list.concat(offset);
		}
		var content = deranged.content;
		return {
			content : content.substring(0, start) + content.substring(end),
			offsets : deranged.offsets.reduce(reduceOffset, []),
			ranges  : deranged.ranges.reduce(reduceRanges, [])
		};
	}

	// `extractCollapsed

	var zwChars = Strings.ZERO_WIDTH_CHARACTERS.join('');
	var breakingWhiteSpaces = Arrays.difference(
		Strings.WHITE_SPACE_CHARACTERS,
		Strings.NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var NOT_WSP_FROM_START = new RegExp('[^' + breakingWhiteSpaces + zwChars + ']');
	var WSP_FROM_START = new RegExp('[' + breakingWhiteSpaces + ']');

	function extractCollapsed(deranged) {
		var content = deranged.content;
		var collapsed = [];
		var offset = 0;
		var guard = 99;
		var match;
		while (--guard) {
			match = content.search(NOT_WSP_FROM_START);
			// Only whitespaces
			if (-1 === match) {
				collapsed.push([offset, content.substring(0, content)]);
				break;
			}
			// No leading whitespaces
			if (0 === match) {
				match = content.search(WSP_FROM_START);
				// No more white spaces
				if (-1 === match) {
					break;
				}
				offset += match;
				content = content.substring(match);

			// Leading white space found
			// eg: " foo bar"
			// But multiple spaces should be replaced with a single space
			// *except* at the beginning and end of the string
			} else if (0 === offset || match === content.length) {
				collapsed.push([offset, content.substring(0, match)]);
				deranged = remove(deranged, offset, offset + match);
				content = deranged.content;
			} else if (1 === match) {
				offset++;
				content = content.substring(1);
			} else {
				offset++;
				collapsed.push([offset, content.substring(1, match)]);
				deranged = remove(deranged, offset, offset + match - 1);
				content = content.substring(match);
			}
		}
		deranged.collapsed = collapsed;
		return deranged;
	}

	function context(boundaries) {
		var block = Dom.upWhile(
			Boundaries.container(boundaries[0]),
			function (node) {
				return !Html.hasLinebreakingStyle(node)
					&& !Dom.isEditingHost(node);
			}
		);
		return extractCollapsed(
			parseDom(block, 0, getPaths(block, boundaries))
		);
	}

	function capture(event, mobile) {
		var ctx = context(event.selection.boundaries);
		var offset = ctx.offsets[0] || 0;
		mobile.field.focus();
		mobile.field.value = ctx.content;
		mobile.field.selectionEnd = offset;
		mobile.field.selectionStart = offset;
		return {
			'offset'     : offset,
			'field'      : mobile.field,
			'editable'   : event.editable,
			'boundaries' : event.selection.boundaries
		};
	}

	function shift(event, mobile) {
		return mobile;
	}

	return {
		shift   : shift,
		capture : capture,
		context : context
	};
});
