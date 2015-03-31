/**
 * sequences.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
 *
 * @overview
 * Known issues:
 * <div>o[n]e<p>two</p></div> provides a problem in determining the "root"
 * element for a sequence.
 * <pre>
 * // A picture of how sequences are derived from a node tree
 *
 *  2 text nodes "f" and "oo"
 *  |
 *  v
 * foo<u>ba<i>r</i> baz</u>  qux
 * | | |    |    |       |     |
 * 0 2 3    5    6       10    15
 *
 *  split (1, 1, 'split')
 *  | u (3, 10, u)
 *  | | i (5, 6, i)
 *  | | |
 * foobar baz  qux
 * </pre>
 *
 * @namespace sequences
 */
define([
	'functions',
	'dom',
	'maps',
	'html',
	'paths',
	'arrays',
	'assert',
	'strings',
	'boundaries'
], function (
	Fn,
	Dom,
	Maps,
	Html,
	Paths,
	Arrays,
	Asserts,
	Strings,
	Boundaries
) {
	'use strict';

	/**
	 * The private-use unicode character that denotes void elements in the
	 * content string of a sequence. Void elements are line-breaking elements,
	 * but unlike container element, they contain no children.
	 *
	 * @todo: Consider using U+E000 () instead of the popular U+F8FF ()
	 * (https://en.wikipedia.org/wiki/Private_Use_Areas#U.2BF8FF).
	 *
	 * @todo
	 * Consider having a set of possible such private-use unicode characters
	 * that can be choosen from during the creation of a sequence. This would
	 * allow us to avoid conflicts in the case where private-use characters are
	 * already present as content in the DOM that is being sequenced.
	 *
	 * @reference https://en.wikipedia.org/wiki/Private_Use_Areas
	 *
	 * @type     {string}
	 * @memberOf sequences
	 */
	var VOID_CHARACTER = '\uF8FF';

	/**
	 * Clips the section of the given path that is common with `root`.
	 *
	 * @private
	 * @param  {!Path} root
	 * @param  {!Path} path
	 * @return {Path}
	 */
	function clipCommonRoot(root, path) {
		for (var i = 0, l = root.length; i < l; i++) {
			if (path[i] !== root[i]) {
				return [];
			}
		}
		return path.slice(i);
	}

	/**
	 * Returns a list of paths starting from the given node derived from a list
	 * of boundaries.
	 *
	 * @private
	 * @param  {!Node}             node
	 * @param  {!Array.<Boundary>} boundaries
	 * @return {Array.<Path>}
	 */
	function pathsFromBoundaries(node, boundaries) {
		var body = node.ownerDocument.body;
		var origin = Paths.fromBoundary(body, Boundaries.fromFrontOfNode(node));
		return boundaries.reduce(function (paths, boundary) {
			var path = Paths.fromBoundary(body, boundary);
			var clipped = clipCommonRoot(origin, path);
			return paths.concat([clipped]);
		}, []);
	}

	/**
	 * Assigns a `pairing` key to each member of each tuple in the given list of
	 * path pairs.
	 *
	 * @private
	 * @param  {!Array.<Array.<Path>>} pairs
	 * @return {Array.<Array.<Path>>}
	 */
	function pairPaths(pairs) {
		if (pairs[0] && pairs[0].pairing) {
			return pairs;
		}
		var pairId = new Date().getTime();
		return pairs.reduce(function (list, pair) {
			var start = pair[0].concat();
			var end = pair[1].concat();
			start.pairing = end.pairing = ++pairId;
			return list.concat([start, end]);
		}, []);
	}

	/**
	 * Because—believe it or not—[19,3].sort() won't re-sort.
	 *
	 * @private
	 * @param  {number} a
	 * @param  {number} b
	 * @return {boolean}
	 */
	function compare(a, b) { return a - b; }

	function isVoidType(node) {
		return node.parentNode ? Html.isVoidType(node) : Html.isVoidNode(node);
	}

	// `extract

	/**
	 * Extracts the contents of the given element; offets of void elements and
	 * formatting, and any pairs of paths.
	 *
	 * @private
	 * @param  {!Element}              element
	 * @param  {Array.<Array.<Path>>=} pairs
	 * @param  {number=}               offset
	 * @param  {Path=}                 trail
	 * @return {Object}
	 */
	function extract(element, pairs, offset, trail) {
		offset = offset || 0;
		trail  = trail  || [];
		var paired = pairPaths(pairs || []);
		var wasText = false;
		var snippets = [];
		var formatting = [];
		var pairings = {};
		function putPair(pairing, offset) {
			if (!pairings[pairing]) {
				pairings[pairing] = [];
			}
			Asserts.assert(
				pairings[pairing].length <= 2,
				'Pairing must only be between 2 boundaries'
			);
			pairings[pairing].push(offset);
		}
		function putPath(offset, path) { putPair(path.pairing, offset); }
		var nodes = Dom.children(element);
		nodes.forEach(function (node, index) {
			var terminal;
			var length = 0;
			var subtrail = trail.concat(index);
			if (Dom.isTextNode(node)) {
				terminal = paired.filter(function (path) {
					return 1 === clipCommonRoot(subtrail, path).length;
				});
				terminal.forEach(function (path) {
					putPath(offset + (Arrays.last(path) || 0), path);
				});
				if (wasText) {
					// Because we want to record joins between adjacent text
					// nodes
					formatting.push([offset, offset, 'split']);
				}
				snippets.push(node.data);
				length = node.data.length;
				wasText = true;
			} else if (isVoidType(node)) {
				formatting.push([offset, offset + 1, node]);
				snippets.push(VOID_CHARACTER);
				length = 1;
				wasText = false;
			} else {
				var more = extract(node, paired, offset, subtrail);
				formatting = formatting.concat(
					[[offset, offset + more.content.length, node]],
					more.formatting
				);
				snippets.push(more.content);
				length += more.content.length;
				wasText = false;
				Maps.forEach(more.pairings, function (offsets, pairing) {
					offsets.forEach(Fn.partial(putPair, pairing));
				});
			}
			terminal = paired.filter(Fn.partial(Paths.equals, subtrail));
			terminal.forEach(Fn.partial(putPath, offset));
			offset += length;
		});
		// Because a path may represent an end-position boundary
		var subtrail = trail.concat(nodes.length);
		var terminal = paired.filter(Fn.partial(Paths.equals, subtrail));
		terminal.forEach(Fn.partial(putPath, offset));
		var boundaries = [];
		Maps.forEach(pairings, function (pair) {
			boundaries.push(pair.sort(compare));
		});
		return {
			boundaries : boundaries,
			formatting : formatting,
			pairings   : pairings,
			element    : element,
			content    : snippets.join('')
		};
	}

	/**
	 * Copy's a sequence.
	 *
	 * @private
	 * @param  {!Sequence} sequence
	 * @return {Sequence}
	 */
	function copy(sequence) {
		return {
			custom     : sequence.custom     || [],
			formatting : sequence.formatting || [],
			boundaries : sequence.boundaries || [],
			spaces     : sequence.spaces     || [],
			content    : sequence.content    || '',
			element    : sequence.element
		};
	}

	/**
	 * Writes the field of `changes` into a copy of `sequence`.
	 *
	 * @private
	 * @param  {!Sequence} sequence
	 * @param  {!Object}   changes
	 * @return {Sequence}
	 */
	function write(sequence, fields) {
		return Maps.merge(copy(sequence), fields);
	}

	// `remove

	/**
	 * Removes a section of a sequence between the given offsets while
	 * preserving offsets in relation to the content.
	 *
	 * @param    {!Sequence} sequence
	 * @param    {number}    start
	 * @param    {number}    end
	 * @return   {!Sequence}
	 * @memberOf sequences
	 */
	function remove(sequence, start, end) {
		Asserts.assert(
			start <= end,
			'Start offset must be smaller than, or equal, to the end offset'
		);
		function reduceSpan(list, span) {
			var a = span[0];
			var b = span[1];
			if (a > start && b < end) {
				return list.concat([[-1, -1]]);
			}
			if (start < a) {
				a = a - (Math.min(a, end) - start);
			}
			if (start < b) {
				b = b - (Math.min(b, end) - start);
			}
			return list.concat([[a, b].concat(span.slice(2))]);
		}
		function reduceOffset(list, offset) {
			var a = offset[0];
			if (a > start && a < end) {
				return list.concat([[-1]]);
			}
			if (start < a) {
				a = a - (Math.min(a, end) - start);
			}
			return list.concat([[a].concat(offset.slice(1))]);
		}
		var content = sequence.content;
		return write(sequence, {
			content    : content.substring(0, start) + content.substring(end),
			spaces     : sequence.spaces.reduce(reduceOffset, []),
			boundaries : sequence.boundaries.reduce(reduceSpan, []),
			formatting : sequence.formatting.reduce(reduceSpan, []),
			custom     : sequence.custom.reduce(reduceSpan, [])
		});
	}

	// `insert `insertBefore `insertAfter

	/**
	 * Inserts text into the sequence at the given index.
	 *
	 * @private
	 * @param    {!Sequence} sequence
	 * @param    {number}    index
	 * @param    {string}    text
	 * @param    {function}  shouldUpdate
	 * @memberOf sequences
	 */
	function insert(sequence, index, text, shouldUpdate) {
		var diff = text.length;
		var content = sequence.content;
		var edited = content.substring(0, index)
		           + text
		           + content.substring(index);
		function reduceSpan(list, span) {
			var a = span[0];
			var b = span[1];
			var node = span[2];
			if (node && isVoidType(node)) {
				shouldUpdate = function (boundary, insert) {
					return insert < boundary;
				};
			}
			return list.concat([[
				shouldUpdate(a, index) ? a + diff : a,
				shouldUpdate(b, index) ? b + diff : b
			].concat(span.slice(2))]);
		}
		function reduceOffset(list, offset) {
			var a = offset[0];
			return list.concat([
				[shouldUpdate(a, index) ? a + diff : a].concat(offset.slice(1))
			]);
		}
		return write(sequence, {
			content    : edited,
			spaces     : sequence.spaces.reduce(reduceOffset, []),
			boundaries : sequence.boundaries.reduce(reduceSpan, []),
			formatting : sequence.formatting.reduce(reduceSpan, []),
			custom     : sequence.custom.reduce(reduceSpan, [])
		});
	}

	/**
	 * Inserts text into the sequence in front of the given index.
	 *
	 * @param    {!Sequence} sequence
	 * @param    {string}    text
	 * @param    {number}    index
	 * @return   {Sequence}
	 * @memberOf sequences
	 */
	function insertBefore(sequence, index, text) {
		return insert(sequence, index, text, function (boundary, insert) {
			return insert <= boundary;
		});
	}

	/**
	 * Inserts text into the sequence behind the given index.
	 *
	 * @param    {!Sequence} sequence
	 * @param    {string}    text
	 * @param    {number}    index
	 * @return   {Sequence}
	 * @memberOf sequences
	 */
	function insertAfter(sequence, index, text) {
		return insert(sequence, index, text, function (boundary, insert) {
			return insert < boundary;
		});
	}

	// `normalizeWhitespaces

	var zwChars = Strings.ZERO_WIDTH_CHARACTERS.join('');
	var breakingWhiteSpaces = Arrays.difference(
		Strings.WHITE_SPACE_CHARACTERS,
		Strings.NON_BREAKING_SPACE_CHARACTERS
	).join('');

	var NOT_WSP_FROM_START = new RegExp('[^' + breakingWhiteSpaces + zwChars + ']');
	var WSP_FROM_START = new RegExp('[' + breakingWhiteSpaces + ']');

	/**
	 * Extracts insignificant whitespaces from a sequence and places them in the
	 * sequence's `spaces` property.
	 *
	 * @private
	 * @param  {!Sequence} sequence
	 * @return {Sequence}
	 */
	function normalizeWhitespaces(sequence) {
		var content = sequence.content;
		var insignificant = [];
		var lastChar = '';
		var offset = 0;
		var match;
		while (true) {
			match = content.search(NOT_WSP_FROM_START);
			// `content` consists entirely of whitespaces
			if (-1 === match) {
				insignificant.push([
					offset,
					content.substring(0, content.length)
				]);
				sequence = remove(sequence, offset, offset + content.length);
				break;
			}
			// No leading whitespaces
			if (0 === match) {
				match = content.search(WSP_FROM_START);
				// No more whitespaces
				if (-1 === match) {
					break;
				}
				lastChar = content.charAt(match - 1);
				content = content.substring(match);
				offset += match;

			// Leading whitespace found (eg: " foo bar").
			// Multiple whitespaces should be replaced with a single space
			// except at the beginning and end of the string where they should
			// be removed altogether
			} else if (0 === offset || match === content.length) {
				insignificant.push([offset, content.substring(0, match)]);
				sequence = remove(sequence, offset, offset + match);
				content = sequence.content;
			} else if (1 === match) {
				if (lastChar === VOID_CHARACTER) {
					lastChar = content.charAt(0);
					insignificant.push([offset, content.substring(0, match)]);
					sequence = remove(sequence, offset, offset + match);
					content = sequence.content;
				} else {
					lastChar = content.charAt(0);
					content = content.substring(1);
				}
				offset++;
			} else {
				if (lastChar === VOID_CHARACTER) {
					lastChar = content.charAt(0);
					insignificant.push([offset, content.substring(0, match)]);
					sequence = remove(sequence, offset, offset + match);
					content = sequence.content;
					offset++;
				} else {
					offset++;
					insignificant.push([offset, content.substring(1, match)]);
					sequence = remove(sequence, offset, offset + match - 1);
					lastChar = content.charAt(match - 1);
					content = content.substring(match);
				}
			}
		}
		return write(sequence, {spaces: insignificant});
	}

	/**
	 * Re-inserts insignificant whitespaces (that were remove by
	 * normalizeWhitespaces) back in the sequence.
	 *
	 * @private
	 * @param  {!Sequence} sequence
	 * @return {Sequence}
	 */
	function returnWhitespaces(sequence) {
		var offset;
		var whitespace;
		var count = sequence.spaces.length;
		for (var i = 0; i < count; i++) {
			offset = sequence.spaces[i][0];
			whitespace = sequence.spaces[i][1];
			sequence = insertBefore(sequence, offset, whitespace);
		}
		return write(sequence, {spaces: []});
	}

	function lineBreaker(node) {
		return Dom.upWhile(node, function (node) {
			return !Html.hasLinebreakingStyle(node)
			    && !Dom.isEditingHost(node);
		});
	}

	function createFromElement(element, boundaries) {
		var paths = boundaries.length
		          ? pathsFromBoundaries(element, boundaries)
		          : [];
		var pairs = Arrays.partition(paths, 2);
		return extract(element, pairs);
	}

	function createFromBoundaries(boundaries) {
		return createFromElement(
			lineBreaker(Boundaries.container(boundaries[0])),
			boundaries
		);
	}

	// `create

	/**
	 * Creates a Sequence object from the nearest line breaking element that
	 * contains the given boundaries or element.
	 *
	 * @param    {!Element|Array.<Boundary>} boundaries
	 * @return   {Sequences}
	 * @memberOf sequences
	 */
	function create(reference) {
		var extraction = Arrays.is(reference)
		               ? createFromBoundaries(reference)
		               : createFromElement(reference, []);
		var sequence = normalizeWhitespaces(copy(extraction));
		return {
			'custom'     : sequence.custom,
			'formatting' : sequence.formatting,
			'boundaries' : sequence.boundaries,
			'spaces'     : sequence.spaces,
			'content'    : sequence.content,
			'element'    : sequence.element
		};
	}

	function markOffset(text, offset) {
		return text.substring(0, offset) + '▓' + text.substring(offset);
	}

	function markSpan(text, span) {
		Asserts.assert(
			span[0] <= span[1],
			'Start offset must be smaller, or equal, to end offset'
		);
		return text.substring(0, span[0])
		     + '▓['
		     + text.substring(span[0], span[1])
		     + ']▓'
		     + text.substring(span[1]);
	}

	/**
	 * Prints a string demarking the given span in the given sequence.
	 *
	 * @param    {!Sequence}    sequence
	 * @param    {Array.<Span>} spans
	 * @return   {string}
	 * @memberOf sequences
	 */
	function hint(sequence, spans) {
		if ('number' === typeof spans) {
			return markOffset(sequence.content, spans);
		}
		if (Arrays.is(spans)) {
			return markSpan(sequence.content, spans);
		}
		return sequence.content;
	}

	/**
	 * Checks whether the given object is a sequence interface.
	 *
	 * @param    {!Object} obj
	 * @return   {boolean}
	 * @memberOf sequences
	 */
	function is(obj) {
		return obj.hasOwnProperty('custom')
		    && obj.hasOwnProperty('formatting')
		    && obj.hasOwnProperty('boundaries')
		    && obj.hasOwnProperty('spaces')
		    && obj.hasOwnProperty('content')
		    && obj.hasOwnProperty('element');
	}

	/**
	 * Returns all spans that fall within the given bounds.
	 *
	 * @param    {!Array.<Span>} spans
	 * @param    {!Span}         bounds
	 * @return   {Array.<Span>}
	 * @memberof sequences
	 */
	function nestedSpans(spans, bounds) {
		return spans.filter(function (span) {
			return bounds !== span
			    && bounds[0] <= span[0] && span[1] <= bounds[1];
		});
	}

	/**
	 * Returns true if span a succeeds span b.
	 *
	 * @private
	 * @param {!Span} a
	 * @param {!Span} b
	 * return {number} -1, 0, or 1
	 */
	function compareSpans(a, b) {
		return (a[0] === b[0] && a[1] === b[1])
		     ? 0
		     : ((a[0] > b[0]) || ((a[0] === b[0]) && (a[1] < b[1])))
		     ? 1
		     : -1;
	}

	/**
	 * Returns a structure that represents a DOM tree.
	 *
	 * @private
	 * @param  {string}        content
	 * @param  {!Array.<Span>} formatting
	 * @param  {!Span}         bounds
	 * return  {Object}
	 */
	function buildReferenceStructure(content, formatting, bounds) {
		formatting = formatting.sort(compareSpans);
		bounds = bounds || [0, content.length];
		var offset = bounds[0];
		var last = offset;
		var siblingSpans = formatting.reduce(function (list, span) {
			if (span[0] >= last) {
				list = list.concat([span]);
				last = span[1];
			}
			return list;
		}, []);
		var kids = [];
		siblingSpans.forEach(function (span) {
			if (span[0] > offset) {
				kids.push({ text: content.substring(offset, span[0]) });
			}
			var grandkids;
			var node = span[2];
			var nested = nestedSpans(formatting, span);
			if (nested.length > 0) {
				grandkids = buildReferenceStructure(content, nested, span);
			} else if (isVoidType(node)) {
				grandkids = [];
			} else {
				grandkids = [{ text: content.substring(span[0], span[1]) }];
			}
			kids.push({
				reference : node,
				name      : node.nodeName,
				kids      : grandkids
			});
			offset = span[1];
		});
		last = Arrays.last(siblingSpans);
		if (last[1] < bounds[1]) {
			kids.push({ text: content.substring(last[1], bounds[1]) });
		}
		return kids;
	}

	/**
	 * Given a list of reference structures, will build a DOM tree within
	 * `element`.
	 *
	 * @private
	 * @param  {!Array.<Object>} references
	 * @param  {!Element}        element
	 * @return {Element}
	 */
	function buildReferenceTree(references, element) {
		var doc = element.ownerDocument;
		var nodes = references.reduce(function (list, item) {
			var node;
			if (!Fn.isNou(item.text)) {
				node = doc.createTextNode(item.text);
			} else {
				node = doc.createElement(item.name);
				node.reference = item.reference;
				buildReferenceTree(item.kids, node);
			}
			return list.concat(node);
		}, []);
		Dom.move(nodes, element);
		return element;
	}

	// `sequenceChanges

	var SEQUENCE_INSERTED = 1;
	var SEQUENCE_UNCHANGED = 0;
	var SEQUENCE_REMOVED = -1;
	var SEQUENCE_MOVED = -2;

	function containsReference(nodes, node) {
		if (Arrays.contains(nodes, node)
		||  Arrays.contains(nodes, node.reference)) {
			return true;
		}
		var references = nodes.map(function (node) { return node.reference; });
		return Arrays.contains(references, node);
	}

	/**
	 * Checks whether two nodes are equal or reference each other.
	 *
	 * @private
	 * @param  {!Node} a
	 * @param  {!Node} b
	 * @return {boolean}
	 */
	function equalReference(a, b) {
		if (a === b) {
			return true;
		}
		if (a.reference === b) {
			return true;
		}
		if (b.reference === a) {
			return true;
		}
		if ('#text' === a.nodeName) {
			return a.data === b.data;
		}
		return false;
	}

	/**
	 * Given two lists, determines changes between the two.
	 *
	 * @private
	 * @param  {!Array}   oldList
	 * @param  {!Array}   newList
	 * @param  {function} equals
	 * @param  {contains} contains
	 */
	function sequenceChanges(oldList, newList, equals, contains) {
		var oldItem;
		var newItem;
		var oldI = 0;
		var newI = 0;
		var oldL = oldList.length;
		var newL = newList.length;
		var changes = [];
		while (oldI < oldL && newI < newL) {
			oldItem = oldList[oldI];
			newItem = newList[newI];
			if (equals(oldItem, newItem)) {
				changes.push(SEQUENCE_UNCHANGED);
				oldI++;
				newI++;
			} else if (!contains(newList, oldItem)) {
				changes.push(SEQUENCE_REMOVED);
				oldI++;
			} else if (contains(oldList, newItem)) {
				changes.push(SEQUENCE_MOVED);
				newI++;
			} else {
				changes.push(SEQUENCE_INSERTED);
				newI++;
			}
		}
		while (oldI < oldL) {
			if (!contains(newList, oldList[oldI])) {
				changes.push(SEQUENCE_REMOVED);
			}
			oldI++;
		}
		while (newI < newL) {
			changes.push(
				contains(oldList, newList[newI])
					? SEQUENCE_MOVED
					: SEQUENCE_INSERTED
			);
			newI++;
		}
		return changes;
	}

	/**
	 * Updates the DOM given as `oldTree` with changes represented in `newTree`.
	 *
	 * @private
	 * @param  {!Element} oldTree
	 * @param  {!Element} newTree
	 * @param  {function} insert
	 * @param  {function} remove
	 */
	function updateDom(oldTree, newTree, insert, remove) {
		var oldNodes = Dom.children(oldTree);
		var newNodes = Dom.children(newTree);
		var changes = sequenceChanges(
			oldNodes,
			newNodes,
			equalReference,
			containsReference
		);
		var oldI = 0;
		var newI = 0;
		var l = changes.length;
		var change;
		for (var i = 0; i < l; i++) {
			change = changes[i];
			if (SEQUENCE_UNCHANGED === change) {
				var node = newNodes[newI];
				if (Dom.isElementNode(node)) {
					updateDom(node.reference, node, insert, remove);
				}
				oldI++;
				newI++;
			} else if (SEQUENCE_INSERTED === change) {
				insert(oldTree, oldI, newNodes[newI]);
				oldI++;
				newI++;
			} else if (SEQUENCE_REMOVED === change) {
				remove(oldTree, oldI);
			} else {
				insert(oldTree, oldI, oldNodes[oldI]);
				oldI++;
				newI++;
			}
		}
	}

	function insertNode(tree, index, node) {
		var kids = Dom.children(tree);
		if (0 === kids.length) {
			Dom.append(node, tree);
		} else if (index === kids.length) {
			Dom.moveAfter([node], Arrays.last(kids));
		} else {
			Dom.moveBefore([node], kids[index]);
		}
	}

	function removeNode(tree, index) {
		Dom.remove(Dom.children(tree)[index]);
	}

	/**
	 * Checks whether spans a and b overlap.
	 *
	 * @private
	 * @param {!Span} a
	 * @param {!Span} b
	 * return {boolean}
	 */
	function overlaps(a, b) {
		if (a[0] >= b[1]) {
			return false;
		}
		var bStartInA = a[0] <= b[0] && b[0] <= a[1];
		var bEndInA = a[0] <= b[1] && b[1] <= a[1];
		if (bStartInA && bEndInA) {
			return false;
		}
		var checkedBinA = arguments[2];
		return checkedBinA || overlaps(b, a, true);
	}

	/**
	 * Adds a format into the given sequence's formatting array.
	 *
	 * @param    {!Sequence}    sequence
	 * @param    {Span}         span
	 * @param    {string}       formatting
	 * @return   {Array.<Span>}
	 * @memberOf sequence
	 */
	function format(sequence, span, formatting) {
		var doc = sequence.element.ownerDocument;
		var node = doc.createElement(formatting);
		var bounds = span.concat(node);
		var formats = sequence.formatting.sort(compareSpans);
		return formats.reduce(function (list, span) {
			if (!overlaps(span, bounds)) {
				return list.concat([span]);
			}
			var trail = span.slice(2);
			// ,- span
			// | ,- item
			// | |
			// v v
			// [ { ] }
			if (span[0] < bounds[0]) {
				return list.concat([
					[span[0], bounds[0]].concat(trail),
					[bounds[0], span[1]].concat(trail)
				]);
			}
			// ,- item
			// | ,- span
			// | |
			// v v
			// { [ } ]
			return list.concat([
				[span[0], bounds[1]].concat(trail),
				[bounds[1], span[1]].concat(trail)
			]);
		}, []).concat([bounds]).sort(compareSpans);
	}

	//@fixme
	var __ = ['sup', 'sub', 's', 'u', 'b', 'i'];

	/**
	 *
	 * @param  {!Sequence} sequence
	 */
	function update(sequence) {
		sequence.formatting = format(sequence, sequence.boundaries[0], __.pop());
		var seq = returnWhitespaces(sequence);
		var oldTree = seq.element;
		var newTree = oldTree.ownerDocument.createElement(oldTree.nodeName);
		Dom.setAttr(newTree, 'contentEditable', 'true');
		newTree = buildReferenceTree(
			buildReferenceStructure(seq.content, seq.formatting),
			newTree
		);
		updateDom(oldTree, newTree, insertNode, removeNode);
		return seq;
	}

	return {
		is             : is,
		hint           : hint,
		create         : create,
		remove         : remove,
		update         : update,
		format         : format,
		insertAfter    : insertAfter,
		insertBefore   : insertBefore,
		VOID_CHARACTER : VOID_CHARACTER
	};
});
