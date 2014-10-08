/**
 * mutation-trees.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @deprecated
 */
define([
	'dom',
	'paths',
	'arrays',
	'record',
	'boromir',
	'boundaries',
	'functions'
], function (
	Dom,
	Paths,
	Arrays,
	Record,
	Boromir,
	Boundaries,
	Fn
) {
	'use strict';

	/**
	 * FIXME: isFragmentedText and original and isMarker won't be preserved on cloning.
	 */
	function Marker() {
		var node = document.createElement('code');
		node.innerHTML = '|';
		var record = Boromir(node);
		record.isMarker = true;
		return record;
	}

	function isMarker(record) {
		return true === record.isMarker;
	}

	/**
	 * FragmentedText implementation is backed by a 'Q' element so in order to
	 * be able to visualize it in the document for debugging.
	 *
	 * FIXME: isFragmentedText and original won't be preserved on cloning.
	 */
	function FragmentedText(original, fragments) {
		//var doc = original.domNode().ownerDocument;
		var doc = document;
		var record = Boromir(doc.createElement('q')).children(fragments);
		record.isFragmentedText = true;
		record.original = original;
		return record;
	}

	function isFragmentedText(record) {
		return 'Q' === record.name();
	}

	function clone(record) {
		if (isFragmentedText(record)) {
			return FragmentedText(record.original, record.children);
		}
		return Boromir(Dom.cloneShallow(record.domNode()));
	}

	function splitTree(record, path) {
		if (0 === path.length) {
			return [[], []];
		}
		var children;
		var offset = path[0];
		var trail = path.slice(1);
		// Because of <a/>|<b/> or <#text "foo|bar"> or <FragmentedText "foo|bar">
		if (0 === trail.length) {
			if (isTextRecord(record)) {
				var text = record.text();
				return [text.substr(0, offset), text.substr(offset)];
			}
			offset = normalizeOffset(record, offset);
			children = record.children();
			return [children.slice(0, offset), children.slice(offset)];
		}
		offset = normalizeOffset(record, offset);
		children = record.children();
		var node = children[offset];
		var left = clone(node);
		var right = clone(node);
		var halves = splitTree(node, trail);
		if (isTextRecord(node)) {
			left = left.text(halves[0]);
			right = right.text(halves[1]);
		} else {
			left = left.children(halves[0]);
			right = right.children(halves[1]);
		}
		return [
			children.slice(0, offset).concat(left),
			[right].concat(children.slice(offset + 1))
		];
	}

	function isTextRecord(record) {
		return '#text' === record.name();
	}

	function spliceContent(index, count, record, insertion) {
		if (isTextRecord(record)) {
			var text = record.text();
			return [clone(record).text(text.substr(0, index))]
			     .concat(insertion || [])
			     .concat(clone(record).text(text.substr(index + count)));
		}
		var children = record.children();
		return children.slice(0, index)
		     .concat(insertion || [])
		     .concat(children.slice(index + count));
	}

	function fragmentedOffset(record, offset) {
		var fragments = record.children();
		var len = fragments.length;
		var remainder = offset;
		var index = 0;
		var overflow;
		var fragment;
		while (index < len) {
			fragment = fragments[index];
			if (isMarker(fragment)) {
				index++;
				continue;
			}
			overflow = remainder - fragment.text().length;
			if (0 === overflow) {
				return [index + 1];
			}
			if (overflow < 0) {
				return [index, remainder];
			}
			index++;
			remainder = overflow;
		}
		throw 'Text offset out of bounds';
	}

	function normalizeOffset(record, offset) {
		if (isTextRecord(record)) {
			return offset;
		}
		var children = record.children();
		var len = children.length;
		if (offset >= len) {
			return offset;
		}
		var count = 0;
		var index = 0;
		while (index < len) {
			if (!isMarker(children[index])) {
				if (count === offset) {
					return index;
				}
				count++;
			}
			index++;
		}
		return index;
	}

	function insertRecords(record, offset, records) {
		if (isTextRecord(record)) {
			return spliceContent(offset, 0, record, records);
		}
		if (isFragmentedText(record)) {
			var offsets = fragmentedOffset(record, offset);
			offset = offsets[0];
			if (2 === offsets.length) {
				var text = record.children()[offset];
				var fragments = spliceContent(offsets[1], 0, text, records);
				return record.children(spliceContent(offset, 1, record, fragments));
			}
		} else {
			offset = normalizeOffset(record, offset);
		}
		return record.children(spliceContent(offset, 0, record, records));
	}

	function insertRec(record, path, insertAt) {
		var trail = path.slice(1);
		var offset = path[0];
		// Because we are at end of the trail: <a/>|<b/> or <#text "foo|bar">
		if (0 === trail.length) {
			return insertAt(record, offset);
		}
		offset = normalizeOffset(record, offset);
		var unchanged = record.children()[offset];
		var changed = insertRec(unchanged, trail, insertAt);
		var children = spliceContent(offset, 1, record, changed);
		return record.children(children);
	}

	function insertPath(record, offset) {
		var records = insertRecords(record, offset, Marker());
		return isTextRecord(record) ? FragmentedText(record, records) : record;
	}

	function insertPathInTree(record, path) {
		return insertRec(record, path, insertPath);
	}

	function boundaryIndexInFragment(fragments, offset) {
		var len = fragments.length;
		var textLength = 0;
		var count = 0;
		var index = 0;
		var record;
		while (index < len) {
			if (textLength === offset) {
				return count;
			}
			record = fragments[index];
			if (!isMarker(record)) {
				textLength += record.text().length;
			}
			count++;
		}
	}

	function joinFragments(record, fragments) {
		var text = fragments.reduce(function (strings, string) {
			return strings.concat(string.text());
		}, []).join('');
		console.log(text);
		//var doc = record.original.domNode().ownerDocument;
		var doc = document;
		return (record.original && record.original.text() === text)
		     ? record.original
		     : Boromir(doc.createTextNode(text)).text(text);
	}

	function removePath(record, offset) {
		if (isFragmentedText(record)) {
			offset = boundaryIndexInFragment(record.children(), offset);
			var fragments = spliceContent(offset, 1, record);
			if (fragments.length > 0 && !fragments.some(isMarker)) {
				return joinFragments(record, fragments);
			}
		}
		return record.children(spliceContent(offset, 1, record));
	}

	function removePathFromTree(record, path) {
		var trail = path.slice(1);
		var offset = path[0];
		// Because we are at end of the trail: <a/>|<b/> or <FragmentedText "foo|bar">
		if (0 === trail.length) {
			return removePath(record, offset);
		}
		var unchanged = record.children()[offset];
		var changed = removePathFromTree(unchanged, trail);
		var children = spliceContent(offset, 1, record, changed);
		return record.children(children);
	}

	function extractPathFromTree(record, paths, trail) {
		paths = paths || [];
		trail = trail || [];
		if (isTextRecord(record)) {
			return paths;
		}
		var textLength = 0;
		var preceedingBoundaries = 0;
		var children = record.children();
		var isInText = isFragmentedText(record);
		return children.reduce(function (list, child, i) {
			if (isMarker(child)) {
				var offset;
				if (isInText) {
					offset = textLength;
				} else {
					offset = i - preceedingBoundaries;
					preceedingBoundaries++;
				}
				return list.concat([trail.concat(offset)]);
			}
			if (isInText) {
				textLength += child.text().length;
			}
			return extractPathFromTree(
				child,
				list,
				trail.concat(i - preceedingBoundaries)
			);
		}, paths);
	}

	/**
	 * @memberOf mutation-trees
	 */
	function update(tree) {
		var paths = extractPathFromTree(tree);
		tree = paths.reduce(removePathFromTree, tree);
		return [tree.updateDom(), paths];
	}

	function clipCommonRoot(root, path) {
		var i;
		for(i = 0; i < root.length; i++) {
			if (path[i] !== root[i]) {
				return [];
			}
		}
		return path.slice(i);
	}

	/**
	 * @memberOf mutation-trees
	 */
	function create(element, boundaries) {
		var body = element.ownerDocument.body;
		var root = Paths.fromBoundary(body, Boundaries.fromFrontOfNode(element));
		var paths = (boundaries || []).map(Fn.partial(Paths.fromBoundary, body));
		var clipped = paths.map(Fn.partial(clipCommonRoot, root)).filter(function (arr) {
			return arr.length > 0;
		});
		return clipped.reduce(insertPathInTree, Boromir(element));
	}

	/**
	 * Splits the given tree along the specified path down to its root node.
	 *
	 * `path` must be a path from the root of the `tree` into the tree.
	 * In other words, the root dom element from which a boundary can be derived
	 * from `path` must be the same root element as that of `tree`.
	 *
	 * @param  {!MutationTree} tree
	 * @param  {!Path}         path
	 * @return {Array.<MutationTree, Path>}
	 * @memberOf mutation-trees
	 */
	function split(tree, path) {
		var halves = splitTree(tree, path);
		return [
			tree.children(halves[0].concat(halves[1])),
			[halves[0].length - halves[0].filter(isMarker).length]
		];
	}

	/**
	 * @memberOf mutation-trees
	 */
	function insert(tree, path, content) {
		if (0 === content.length) {
			return tree;
		}
		if (!('map' in content)) {
			content = [content];
		}
		var records = content.map(function (item) {
			return item instanceof Boromir ? item : Boromir(item);
		});
		return insertRec(tree, path, function (record, offset) {
			return insertRecords(record, offset, records);
		});
	}

	/**
	 * @memberOf mutation-trees
	 */
	function wrap(tree, path, num, domNode) {
		throw 'Not implemented';
	}

	/**
	 * @memberOf mutation-trees
	 */
	function remove(tree, path, num) {
		throw 'Not implemented';
	}

	/**
	 * @memberOf mutation-trees
	 */
	function reduce(tree, path, num, reducer) {
		throw 'Not implemented';
	}

	/**
	 * @memberOf mutation-trees
	 */
	function removePaths(tree) {
		return extractPathFromTree(tree).reduce(removePathFromTree, tree);
	}

	return {
		create      : create,
		split       : split,
		insert      : insert,
		wrap        : wrap,
		remove      : remove,
		reduce      : reduce,
		/**@memberOf mutation-trees*/
		paths       : extractPathFromTree,
		removePaths : removePaths,
		update      : update
	};
});
