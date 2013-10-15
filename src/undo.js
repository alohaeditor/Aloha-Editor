/* undo.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['arrays', 'dom'], function Undo(Arrays, Dom) {
	'use strict'

	var observeAll = {
		'childList': true,
		'attributes': true,
		'characterData': true,
		'subtree': true,
		'attributeOldValue': true,
		'characterDataOldValue': true
	};

	function assertEqual(a, b) {
		if (a !== b) {
			throw Error('assertion error ' + a + ' !== ' + b);
		}
	}

	function assertNotEqual(a, b) {
		if (a === b) {
			throw Error('assertion error ' + a + ' === ' + b);
		}
	}

	function createContext(opts) {
		var elem = opts.elem;
		var context = {
			elem: elem,
			observer: null,
			stack: [],
			frame: null
		};
		context.observer = new MutationObserver(elem, function (mutations) {});
		return context;
	}

	function changeFromFrame(frame) {
		return {
			// API
			'changes': frame.changes,
			'meta': frame.meta
		};
	}

	function addNodePosition(pos, nodeAtAddedPosition, len) {
		var lastStep = Arrays.last(pos);
		pos[pos.length - 1] = [nodeAtAddedPosition.nodeName, lastStep[1] + len];
	}

	function descNodePosition(pos, nodeAtOff, off) {
		pos.push([nodeAtOff.nodeName, off]);
	}

	function nodePosition(container, node) {
		var pos = [];
		var parent = node;
		while (parent && container !== parent) {
			pos.push([parent.nodeName, Dom.normalizedNodeIndex(parent)]);
			parent = parent.parentNode;
		}
		return pos;
	}

	function position(container, node, textOff) {
		textOff = textOff || 0;
		var skip = node.previousSibling;
		while (skip && Dom.isTextNode(skip)) {
			textOff += Dom.nodeLength(skip);
			node = skip;
			skip = skip.previousSibling;
		}
		var pos = nodePosition(container, node);
		// NB positions with textOff = 0 are invalid because empty text
		// nodes should be treated as if they are not present and if a
		// position in an empty text node is taken, the same position would
		// become invalid when the empty text node is removed.
		if (textOff) {
			pos.push(['#text', textOff]);
		}
		return pos;
	}

	function boundaryFromPosition(container, pos) {
		for (var i = 0; i < pos.length - 1; i++) {
			var step = pos[i];
			container = Dom.nthChild(container, step[1]);
			assertEqual(step[0], container.nodeName);
		}
		var lastStep = Arrays.last(pos);
		var boundary;
		if (Dom.isTextNode(container)) {
			var textOff = lastStep[1];
			assertNotEqual(textOff, 0);
			assertEqual(lastStep[0], container.nodeName);
			boundary = [container, textOff];
		} else {
			// Because the last step may have become invalid due to a
			// change being reversed and because recordsToChanges()
			// creates positions with inserted nodes, we don't do an
			// assertion here.
			boundary = [container, lastStep[1]];
		}
		return boundary;
	}

	function recordsToChanges(container, records) {
		var changes = [];
		for (var i = 0; i < records.length; i++) {
			var target = record['target'];
			var oldValue = record['oldValue'];
			var change;
			switch(record['type']) {
			case 'attributes':
				var name = record['attributeName'];
				var ns = record['attributeNamespace'];
				var newValue = target.getAttribute(name);
				var pos = position(container, target);
				changes.push({
					'type': 'update-attr',
					'pos': pos,
					'oldValue': oldValue,
					'newValue': newValue,
					'name': name,
					'ns': ns
				});
				break;
			case 'characterData':
				var text = target.data;
				var pos = position(container, target);
				changes.push({
					'type': 'delete',
					'pos': pos,
					'content': [document.createTextNode(oldValue)]
				});
				changes.push({
					'type': 'insert',
					'pos': pos,
					'content': [document.createTextNode(newValue)]
				});
				break;
			case 'childList':
				var nextSibling = record['nextSibling'];
				var prevSibling = record['previousSibling'];
				var added = record['addedNodes'];
				var deleted = record['deletedNodes'];
				var pos;
				if (deleted.length) {
					if (prevSibling
					    && Dom.isTextNode(prevSibling)
					    && Dom.isTextNode(deleted[0])) {
						// NB may result in a ['#text', textNode.length]
						// position which should really be a
						// nodePosition as its not inside a text node.
						var textOff = Dom.nodeLength(prevSibling);
						pos = position(container, prevSibling, textOff);
					} else if (prevSibling) {
						pos = nodePosition(container, prevSibling);
						addNodePosition(pos, deleted[0], 1);
					} else {
						pos = nodePosition(container, target);
						descNodePosition(pos, deleted[0], 0);
					}
					changes.push({
						'type': 'delete',
						'pos': pos,
						'content': Arrays.coerce(deleted).map(Dom.clone)
					});
				}
				if (added.length) {
					pos = position(container, added[0])
					changes.push({
						'type': 'insert',
						'pos': pos,
						'content': Arrays.coerce(added).map(Dom.clone)
					});
				}
				break;
			default:
				throw Error('unknown type');
			}
		}
		return changes;
	}

	function pushChanges(context, frame) {
		var records = context.observer.takeRecords();
		var changes = recordsToChanges(context.elem, records)
		frame.changes = frame.changes.concat();
	}

	function enter(context, meta) {
		var frame = context.frame;
		if (frame) {
			pushChanges(context, frame);
			context.stack.push(frame);
		} else {
			observer.observe(context.elem, observeAll);
		}
		context.frame = {
			changes: [],
			meta: meta
		};
	}

	function leave(context) {
		var frame = context.frame;
		pushChanges(context, frame);
		var change = changeFromFrame(frame);
		var upperFrame = context.stack.pop();;
		if (upperFrame) {
			upperFrame.changes.push(change);
		} else {
			context.observer.disconnect();
		}
		context.frame = upperFrame;
		return change;
	}

	function capture(context, meta, fn) {
		enter(context, meta);
		try {
			fn();
		} finally {
			return leave(context);
		}
	}

	function inverseChange(change) {
		var type = change['type'];
		switch (type) {
		case 'update-attr':
			var oldValue = change['oldValue'];
			var newValue = change['newValue'];
			inverse = Maps.merge(change, {'oldValue': newValue, 'newValue': oldValue});
			break;
		case 'insert':
		case 'delete':
			inverse = Maps.merge(change, {'type': ('insert' === type ? 'delete' : 'insert')});
			break;
		default:
			throw Error('unknown type');
		}
		return inverse;
	}

	function applyChange(container, change, ranges) {
		var pos = change['pos'];
		var type = change['type'];
		var boundary = boundaryFromPosition(container, pos);
		switch (type) {
		case 'update-attr':
			var node = Dom.nodeAtBoundary(boundary);
			var ns = change['ns'];
			var name = change['name'];
			var value = change['newValue'];
			Dom.setAttributeNS(ns, name, value);
			break;
		case 'insert':
			Dom.insertNodesAtBoundary(change.content, boundary, ranges);
			break;
		case 'delete':
			boundary = splitBoundary(boundary, ranges);
			var node = Dom.nodeAtBoundary(boundary);
			var parent = node.parentNode;
			change.content.forEach(function (deletedNode) {
				var next;
				if (Dom.isTextNode(deletedNode)) {
					var deletedLen = Dom.nodeLength(deletedNode);
					while (deletedLen) {
						next = node.nextSibling;
						assertEqual(node.nodeName, deletedNode.nodeName);
						var len = Dom.nodeLength(node);
						if (deletedLen >= len) {
							Dom.removePreservingRanges(node, ranges);
							deletedLen -= len;
						} else {
							var beforeSplit = Dom.splitBoundary([node, deletedLen], ranges);
							Dom.removePreservingRanges(beforeSplit, ranges);
							deletedLen = 0;
						}
						node = next;
					}
				} else {
					next = node.nextSibling;
					assertEqual(node.nodeName, deletedNode.nodeName);
					Dom.removePreservingRanges(node, ranges);
					node = next;
				}
			});
			break;
		default:
			throw Error('unknown type');
		}
	}

	/**
	 * Stateless functions for undo support.
	 */
	var exports = {
		createContext: createContext,
		capture: capture
	};

	exports['createContext'] = exports.createContext;
	exports['capture'] = exports.capture;

	return exports;
});
