/* undo.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
// TODO Turn delete-insert sequences into moves.
// TODO A change set should be a tree with a root path and nested
//      changes that have a relative path.
define(['arrays', 'maps', 'dom', 'functions', 'traversing'], function Undo(Arrays, Maps, Dom, Fn, Traversing) {
	'use strict'


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

	function assertFalse(value) {
		assertEqual(value, false);
	}

	function Context(elem, opts) {
		opts = opts || {};
		var context = {
			elem: elem,
			observer: null,
			stack: [],
			frame: null,
			opts: opts
		};
		context.observer = (!opts.noMutationObserver && window.MutationObserver
		                    ? ObserverUsingMutationObserver()
		                    : ObserverUsingSnapshots());
		return context;
	}

	function makeChangeSet(meta, changes) {
		return {
			// API
			'changes': changes,
			'meta': meta
		};
	}

	function stepDownPath(path, containerName, off) {
		path.push([off, containerName]);
	}

	function nodePath(container, node) {
		var path = [];
		while (node && container !== node) {
			var parent = node.parentNode;
			if (!parent) {
				return null;
			}
			stepDownPath(path, parent.nodeName, Dom.normalizedNodeIndex(node));
			node = parent;
		}
		return path;
	}

	function precedingTextLength(node) {
		var index = 0;
		var skip = node.previousSibling;
		while (skip && Dom.isTextNode(skip)) {
			index += Dom.nodeLength(skip);
			node = skip;
			skip = skip.previousSibling;
		}
		return index;
	}

	/**
	 * A path is an array of arrays where each member represents the
	 * offset of a child in a parent. The empty array represents the
	 * path of the top-most container from which the path was
	 * calculated.
	 *
	 * Paths with textOff = 0 are invalid because empty text nodes
	 * should be treated as if they are not present and if a path in an
	 * empty text node is taken, the same path would become invalid when
	 * the empty text node is removed.
	 *
	 * @param textOff if node is a text node, may be a valid offset in
	 *        the text node except the last offset (off == length),
	 *        otherwise must be null/undefined.
	 */
	function makePath(container, node, textOff) {
		textOff = textOff || 0;
		var effectiveNode = Traversing.nextWhile(node, Dom.isEmptyTextNode);
		if (!effectiveNode) {
			return nodePath(container, node);
		}
		if (Dom.isTextNode(effectiveNode)) {
			textOff += precedingTextLength(effectiveNode);
		}
		var path = nodePath(container, effectiveNode);
		if (!path) {
			return null;
		}
		if (textOff) {
			stepDownPath(path, '#text', textOff);
		}
		return path;
	}

	function boundaryFromPath(container, path) {
		for (var i = 0; i < path.length - 1; i++) {
			var step = path[i];
			assertEqual(step[1], container.nodeName);
			container = Dom.normalizedNthChild(container, step[0]);
		}
		var lastStep = Arrays.last(path);
		var off = lastStep[0];
		container = Traversing.nextWhile(container, Dom.isEmptyTextNode);
		// NB: container must be non-null at this point.
		assertEqual(lastStep[1], container.nodeName);
		if (Dom.isTextNode(container)) {
			// Because text offset paths with value 0 are invalid.
			assertNotEqual(off, 0);
			while (off > Dom.nodeLength(container)) {
				off -= Dom.nodeLength(container);
				container = container.nextSibling;
			}
			// Because we don't want to generate boundaries with text
			// offset == text length.
			if (off === Dom.nodeLength(container)) {
				off = Dom.nodeIndex(container) + 1;
				container = container.parentNode;
			}
		} else {
			off = Dom.realFromNormalizedIndex(container, off);
		}
		return [container, off];
	}

	function takeRecords(context, frame) {
		// TODO takeRecords() implementation defined
		var records = context.observer.takeRecords();
		frame.records = frame.records.concat(records);
	}

	function enter(context, opts) {
		opts = opts || {};
		var frame = context.frame;
		var observer = context.observer;
		if (frame) {
			if (!observer.takeRecordsSlow || context.opts.noCombineRecords) {
				takeRecords(context, frame);
			}
			context.stack.push(frame);
		} else {
			observer.observeAll(context.elem);
		}
		context.frame = {
			records: [],
			opts: opts,
			isFrame: true
		};
	}

	function leave(context) {
		var frame = context.frame;
		var observer = context.observer;
		var upperFrame = context.stack.pop();;
		if (upperFrame) {
			if (!observer.takeRecordsSlow || context.opts.noCombineRecords) {
				takeRecords(context, frame);
			}
			upperFrame.records.push(frame);
		} else {
			takeRecords(context, frame);
			observer.disconnect();
		}
		context.frame = upperFrame;
		return frame;
	}

	function capture(context, opts, fn) {
		enter(context, opts);
		try {
			fn();
		} finally {
			return leave(context);
		}
	}

	function makeInsertDeleteChange(type, path, content) {
		return {
			'type': type,
			'path': path,
			'content': content
		};
	}

	function makeInsertChange(path, content) {
		return makeInsertDeleteChange('insert', path, content);
	}

	function makeDeleteChange(path, content) {
		return makeInsertDeleteChange('delete', path, content);
	}

	function makeUpdateAttrChange(path, node, attrs) {
		var attrs = [];
		Maps.forEach(attrs, function (attr) {
			var name = attr.name;
			var ns = attr.ns;
			attrs.push({
				'name': name,
				'ns': ns,
				'oldValue': attr.oldValue,
				'newValue': Dom.getAttributeNS(node, ns, name)
			});
		});
		return {
			'type': 'update-attr',
			'path': path,
			'attrs': attrs
		};
	}

	var INSERT = 0;
	var UPDATE_ATTR = 1;
	var UPDATE_TEXT = 2;
	var DELETE_FLAG = 4;
	var DELETE = DELETE_FLAG;
	var COMPOUND_DELETE = DELETE_FLAG + 1;

	function makeDelete(node, target, prevSibling) {
		return {
			type: DELETE,
			node: node,
			target: target,
			prevSibling: prevSibling,
			contained: [],
			updateAttr: null,
			updateText: null
		};
	}

	function makeMultiDelete(delRecords, target, prevSibling) {
		return {
			type: COMPOUND_DELETE,
			records: delRecords,
			target: target,
			prevSibling: prevSibling
		};
	}

	function makeInsert(node) {
		return {type: INSERT, node: node, contained: []};
	}

	function makeUpdateAttr(node, attrs) {
		return {type: UPDATE_ATTR, node: node, attrs: {}};
	}

	function makeUpdateText(node, oldValue) {
		return {type: UPDATE_TEXT, node: node, oldValue: oldValue};
	}

	function anchorNode(record) {
		if (DELETE_FLAG & record.type) {
			return record.prevSibling || record.target;
		} else {
			return record.node;
		}
	}

	function setOrRemoveAttribute(node, ns, name, value) {
		if (null == value) {
			Dom.removeAttributeNS(node, ns, name);
		} else {
			Dom.setAttributeNS(node, ns, name, value);
		}
	}

	// NB: All insert-delete sequences in this table are no-ops:
	// insert-delete               => no-op
	// insert-delete-insert        => insert (in inserted)
	// insert-delete-insert-delete => no-op
	// delete-insert               => move   (in delsBy*, inserted)
	// delete-insert-delete        => delete (in delsBy*)
	// delete-insert-delete-insert => move   (in delsBy*, inserted)
	function normalizeInsertDeletePreserveAnchors(moves, inserted, delsByPrevSibling, delsByTarget) {
		moves.forEach(function (move) {
			var node = move.node;
			var id = Dom.ensureExpandoId(node);
			switch (move.type) {
			case DELETE:
				var ref = move.prevSibling ? move.prevSibling : move.target;
				var map = move.prevSibling ? delsByPrevSibling : delsByTarget;
				var refId = Dom.ensureExpandoId(ref);
				var dels = map[refId] = map[refId] || [];

				if (inserted[id]) {
					// Because an insert-delete sequence will become a
					// no-op, and we just pretend that it didn't happen.
					delete inserted[id];
				} else {
					dels.push(move);
				}

				// Because it may be that the deleted node is the
				// prevSibling reference of a previous delete.
				var delsHavingRefs = delsByPrevSibling[id];
				if (delsHavingRefs) {
					delete delsByPrevSibling[id];
					// Because by eliminating delete-inserts above we
					// may have eliminated the first delete in the
					// delete sequence that must have a valid anchor.
					if (!dels.length && delsHavingRefs.length) {
						var refDel = delsHavingRefs[0];
						refDel.prevSibling = move.prevSibling;
						refDel.target = move.target;
					}
					map[refId] = dels.concat(delsHavingRefs);
				}
				break;
			case INSERT:
				assertFalse(!!inserted[id]);
				inserted[id] =  move;
				break;
			default:
				// NB: moves should only contains INSERTs and DELETEs
				// (not COMPOUND_DELETEs).
				throw Error();
			}
		});
	}

	function records(record) {
		return (COMPOUND_DELETE === record.type) ? record.records : [record];
	}

	function nodeContainsRecord(containerNode, record) {
		return (((DELETE_FLAG & record.type) && containerNode === record.target)
		        || Dom.contains(containerNode, anchorNode(record)));
	}

	function containsRecord(recordA, recordB) {
		return nodeContainsRecord(recordA.node, recordB);
	}

	// Each delete is contained by not more than a single container
	// delete, if any.
	//
	// We only need inserts at the top-level, or inside deletes. Inserts
	// and deletes inside new inserts must be completely
	// ignored. Inserts and deletes inside delete-insert sequences must
	// be contained by the delete, but not by the insert.
	//
	// When all deletes are processed first, and then all inserts, the
	// insert of a delete-insert sequence would not contain any of the
	// inserts or deletes that happened in the delete, since the insert
	// of a delete-insert sequence doesn't contain the delete of the
	// delete-insert sequence.
	//
	// Given above, if an insert contains deletes, the insert is not
	// part of an delete-insert sequence, since the delete of the
	// delete-insert sequence already contains all the deletes, and the
	// deletes can be discarded.
	//
	// For the same reason, if an insert contains inserts, they can be
	// discarded in favor of the container insert.
	function intoRecordTree(tree, record) {
		var containerRecord;
		// Because we need all operations that happened inside deletions
		// in order to reconstruct the structure before deletion.
		containerRecord = Arrays.some(tree, function (containerRecord) {
			if (DELETE_FLAG & containerRecord.type) {
				return Arrays.some(records(containerRecord), function (containerRecord) {
					if (containsRecord(containerRecord, record)) {
						return containerRecord;
					}
				});
			}
		});
		if (containerRecord) {
			containerRecord.contained = intoRecordTree(containerRecord.contained, record);
			return tree;
		}
		// Because an insert already contains all necessary information,
		// we can just discard any records that occur in inserts. For
		// delete-insert sequences, we don't loose any information
		// because the deletes already have all been processed.
		containerRecord = Arrays.some(tree, function (containerRecord) {
			if (INSERT === containerRecord.type) {
				if (containsRecord(containerRecord, record)) {
					return containerRecord;
				}
			}
		});
		if (containerRecord) {
			return tree;
		}
		// Because we can assume that any other records are updates that
		// are disconnected from structural changes (deletes already
		// have consumed the updateAttr and updateText information and
		// inserts don't need any update information) it is sufficient
		// to just add them without checking whether they contain other
		// records.
		var type = record.type;
		if (INSERT === type || (DELETE_FLAG & type)) {
			records(record).forEach(function (containerRecord) {
				var notContained = [];
				tree.forEach(function (record) {
					if (containsRecord(containerRecord, record)) {
						// Because an insert already contains all
						// necessary information, we can just discard
						// all contained records.
						if (DELETE === containerRecord.type) {
							containerRecord.contained.push(record);
						}
					} else {
						notContained.push(record);
					}
				});
				tree = notContained;
			});
		}
		tree.push(record);
		return tree;
	}

	function sortRecordTree(tree) {
		tree.sort(function (recordA, recordB) {
			var anchorA = anchorNode(recordA);
			var anchorB = anchorNode(recordB);
			// Because a delete's anchor precedes it, an insert with the
			// same anchor as the del's node will always precede it.
			if (anchorA === anchorB) {
				return (DELETE_FLAG & recordB.type) ? -1 : 1;
			}
			return Dom.following(anchorA, anchorB) ? -1 : 1;
		});
		tree.forEach(function (record) {
			if (record.contained) {
				sortRecordTree(record.contained);
			}
		});
	}

	function makeRecordTree(container, moves, updateAttr, updateText) {
		var delsByPrevSibling = {};
		var delsByTarget = {};
		var inserted = {};
		normalizeInsertDeletePreserveAnchors(moves, inserted, delsByPrevSibling, delsByTarget);
		var delss = Maps.vals(delsByPrevSibling).concat(Maps.vals(delsByTarget));
		// Because normalizeInsertDeletePreserveAnchors may cause empty
		// del arrays.
		delss = delss.filter(function (dels) {
			return dels.length;
		});
		function consumeUpdates(record) {
			var id = Dom.ensureExpandoId(record.node);
			if (DELETE === record.type) {
				record.updateAttr = updateAttr[id];
				record.updateText = updateText[id];
			}
			delete updateAttr[id];
			delete updateText[id];
		}
		var dels = delss.map(function (dels){
			var refDel = dels[0];
			dels.forEach(consumeUpdates);
			return makeMultiDelete(dels, refDel.target, refDel.prevSibling);
		});
		var inss = Maps.vals(inserted);
		inss.forEach(consumeUpdates);
		var recordTree = [];
		// NB: the order in which dels and inss and updates are added to
		// the tree is significant.
		recordTree = dels.reduce(intoRecordTree, recordTree);
		recordTree = inss.reduce(intoRecordTree, recordTree);
		recordTree = Maps.vals(updateAttr).reduce(intoRecordTree, recordTree);
		recordTree = Maps.vals(updateText).reduce(intoRecordTree, recordTree);
		recordTree = recordTree.filter(function (record) {
			return nodeContainsRecord(container, record);
		});
		sortRecordTree(recordTree);
		return recordTree;
	}

	function delPath(container, delRecord) {
		var prevSibling = delRecord.prevSibling;
		var path;
		if (prevSibling) {
			var nextSibling = prevSibling.nextSibling;
			if (nextSibling) {
				path = makePath(container, nextSibling);
			} else {
				var parent = prevSibling.parentNode
				path = makePath(container, parent);
				stepDownPath(path, parent.nodeName, Dom.normalizedNumChildren(parent));
			}
		} else {
			var target = delRecord.target;
			path = makePath(container, target);
			stepDownPath(path, target.nodeName, 0);
		}
		return path;
	}

	function reconstructNodeFromDelRecord(delRecord) {
		var node = delRecord.node;
		var reconstructedNode;
		if (Dom.isTextNode(node)) {
			var updateText = delRecord.updateText;
			if (updateText) {
				reconstructedNode = node.ownerDocument.createTextNode(updateText.oldValue);
			} else {
				reconstructedNode = Dom.clone(node);
			}
		} else {
			reconstructedNode = Dom.clone(node);
			var updateAttr = delRecord.updateAttr;
			if (updateAttr) {
				Maps.forEach(updateAttr.attrs, function (attr) {
					setOrRemoveAttribute(reconstructedNode, attr.ns, attr.name, attr.oldValue);
				});
			}
		}
		return reconstructedNode;
	}

	function generateChanges(containerPath, container, changes, recordTree) {
		var lastInsertContent = null;
		var lastInsertNode = null;
		recordTree.forEach(function (record) {
			switch (record.type) {
			case COMPOUND_DELETE:
				var path = containerPath.concat(delPath(container, record));
				record.records.forEach(function (record) {
					generateChanges(path, record.node, changes, record.contained);
				});
				changes.push(makeDeleteChange(path, record.records.map(reconstructNodeFromDelRecord)));
				break;
			case INSERT:
				var node = record.node;
				var path = containerPath.concat(makePath(container, node));
				if (lastInsertNode && lastInsertNode === node.previousSibling) {
					lastInsertContent.push(Dom.clone(node));
				} else {
					lastInsertContent = [Dom.clone(node)];
					changes.push(makeInsertChange(path, lastInsertContent));
				}
				lastInsertNode = node;
				break;
			case UPDATE_ATTR:
				var node = record.node;
				var path = containerPath.concat(makePath(container, node));
				changes.push(makeUpdateAttrChange(path, node, record.attrs));
				break
			case UPDATE_TEXT:
				var node = record.node;
				var path = containerPath.concat(makePath(container, node));
				changes.push(makeDeleteChange(path, [document.createTextNode(record.oldValue)]));
				changes.push(makeInsertChange(path, [Dom.clone(node)]));
				break;
			default:
				// NB: only COMPOUND_DELETEs should occur in a recordTree,
				// DELETEs should not except as part of a COMPOUND_DELETE.
				throw Error();
			}
		});
	}

	function changesFromMutationRecords(container, records) {
		var updateAttr = {};
		var updateText = {};
		var moves = [];
		records.forEach(function (record) {
			var target = record.target;
			var oldValue = record.oldValue;
			switch(record.type) {
			case 'attributes':
				var name = record.attributeName;
				var ns = record.attributeNamespace;
				var id = Dom.ensureExpandoId(target);
				var updateAttrRecord = updateAttr[id] = updateAttr[id] || makeUpdateAttr(target, {});
				var attrs = updateAttrRecord.attrs;
				var attr = {oldValue: oldValue, name: name, ns: ns};
				var key = name + ' ' + ns;
				attrs[key] = attrs[key] || attr;
				break;
			case 'characterData':
				var id = Dom.ensureExpandoId(target);
				updateText[id] = updateText[id] || makeUpdateText(target, oldValue);
				break;
			case 'childList':
				var prevSibling = record.previousSibling;
				Arrays.coerce(record.removedNodes).forEach(function (node) {
					moves.push(makeDelete(node, target, prevSibling));
				});
				Arrays.coerce(record.addedNodes).forEach(function (node) {
					moves.push(makeInsert(node));
				});
				break;
			default:
				throw Error();
			};
		});
		var recordTree = makeRecordTree(container, moves, updateAttr, updateText);
		var changes = [];
		var rootPath = [];
		generateChanges(rootPath, container, changes, recordTree);
		return changes;
	}

	function changesFromSnapshots(container, snapshots) {
		var changes = [];
		snapshots.forEach(function (snapshot) {
			var path = makePath(container, container);
			stepDownPath(path, container.nodeName, 0);
			// NB: We don't clone the children because a snapshot is
			// already a copy of the actual content and is supposed to
			// be immutable.
			changes.push(makeDeleteChange(path, Dom.children(snapshot.before)));
			changes.push(makeInsertChange(path, Dom.children(snapshot.after)));
		});
		return changes;
	}

	function ObserverUsingMutationObserver() {
		var observer = new MutationObserver(Fn.noop);

		function observeAll(elem) {
			var observeAllFlags = {
				'childList': true,
				'attributes': true,
				'characterData': true,
				'subtree': true,
				'attributeOldValue': true,
				'characterDataOldValue': true
			};
			observer.observe(elem, observeAllFlags);
		}

		function takeRecords() {
			return observer.takeRecords();
		}

		function disconnect() {
			observer.disconnect();
		}

		return {
			observeAll: observeAll,
			takeRecords: takeRecords,
			disconnect: disconnect,
			changesFromRecords: changesFromMutationRecords
		};
	}

	function ObserverUsingSnapshots() {
		var observedElem = null;
		var beforeSnapshot = null;

		function observeAll(elem) {
			observedElem = elem;
			beforeSnapshot = Dom.clone(elem);
		}

		function takeRecords() {
			if (Dom.isEqualNode(beforeSnapshot, observedElem)) {
				return [];
			}
			var before = beforeSnapshot;
			var after = Dom.clone(observedElem);
			beforeSnapshot = after;
			return [{before: before, after: after}];
		}

		function disconnect() {
			observedElem = null;
			beforeSnapshot = null;
		}

		return {
			observeAll: observeAll,
			takeRecords: takeRecords,
			disconnect: disconnect,
			changesFromRecords: changesFromSnapshots,
			takeRecordsSlow: true
		};
	}

	function applyChange(container, change, ranges, textNodes) {
		var path = change.path;
		var type = change.type;
		var boundary = boundaryFromPath(container, path);
		switch (type) {
		case 'update-attr':
			var node = Dom.nodeAtBoundary(boundary);
			change.attrs.forEach(function (attr) {
				setOrRemoveAttribute(node, change.ns, change.name, change.value);
			});
			break;
		case 'insert':
			change.content.forEach(function (node) {
				var insertNode = Dom.clone(node);
				if (Dom.isTextNode(insertNode)) {
					textNodes.push(insertNode);
				}
				boundary = Dom.insertNodeAtBoundary(insertNode, boundary, true, ranges);
			});
			break;
		case 'delete':
			boundary = Dom.splitBoundary(boundary, ranges);
			var node = Dom.nodeAtBoundary(boundary);
			var parent = node.parentNode;
			change.content.forEach(function (removedNode) {
				var next;
				if (Dom.isTextNode(removedNode)) {
					var removedLen = Dom.nodeLength(removedNode);
					while (removedLen) {
						next = node.nextSibling;
						assertEqual(node.nodeName, removedNode.nodeName);
						var len = Dom.nodeLength(node);
						if (removedLen >= len) {
							Dom.removePreservingRanges(node, ranges);
							removedLen -= len;
						} else {
							var beforeSplit = Dom.splitBoundary([node, removedLen], ranges);
							Dom.removePreservingRanges(beforeSplit, ranges);
							removedLen = 0;
						}
						node = next;
					}
				} else {
					next = node.nextSibling;
					assertEqual(node.nodeName, removedNode.nodeName);
					Dom.removePreservingRanges(node, ranges);
					node = next;
				}
			});
			break;
		default:
			throw Error();
		}
	}

	function applyChanges(container, changes, ranges) {
		// Because a changeSet was calculated with an exact node
		// structure, we mustn't do any additional modifications like
		// joining text nodes while applying the entire changeSet. Doing
		// it afterward is OK.
		var textNodes = [];
		changes.forEach(function (change) {
			applyChange(container, change, ranges, textNodes);
		});
		textNodes.forEach(function (node) {
			Dom.joinTextNode(node, ranges);
		});
	}

	function applyChangeSet(container, changeSet, ranges) {
		applyChanges(container, changeSet.changes, ranges);
	}

	function inverseChange(change) {
		var type = change.type;
		var inverse;
		switch (type) {
		case 'update-attr':
			var oldValue = change.oldValue;
			var newValue = change.newValue;
			inverse = Maps.merge(change, {oldValue: newValue, newValue: oldValue});
			break;
		case 'insert':
		case 'delete':
			inverse = Maps.merge(change, {type: ('insert' === type ? 'delete' : 'insert')});
			break;
		default:
			throw Error();
		}
		return inverse;
	}

	function inverseChangeSet(changeSet) {
		var changes = changeSet.changes.slice(0).reverse().map(inverseChange);
		return makeChangeSet(changeSet.meta, changes);
	}

	function collectRecordsFromFrame(frame, records) {
		frame.records.forEach(function (record) {
			// Because a frame may have nested frames mixed in among its
			// records.
			if (record.isFrame) {
				collectRecordsFromFrame(record, records);
			} else {
				records.push(record);
			}
		});
	}

	function changeSetFromFrame(context, frame) {
		var records = [];
		collectRecordsFromFrame(frame, records)
		var changes = context.observer.changesFromRecords(context.elem, records);
		return makeChangeSet(frame.opts.meta, changes);
	}

	/**
	 * Stateless functions for undo support.
	 */
	var exports = {
		Context: Context,
		enter: enter,
		leave: leave,
		capture: capture,
		changeSetFromFrame: changeSetFromFrame,
		inverseChangeSet: inverseChangeSet,
		applyChangeSet: applyChangeSet
	};

	exports['Context'] = exports.Context;
	exports['enter'] = exports.enter;
	exports['leave'] = exports.leave;
	exports['capture'] = exports.capture;
	exports['inverseChangeSet'] = exports.inverseChangeSet;
	exports['applyChangeSet'] = exports.applyChangeSet;

	return exports;
});
