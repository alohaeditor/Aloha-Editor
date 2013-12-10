/**
 * exports.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * This module exports the Aloha Editor API in a way that will be safe from
 * mungling by the Google Closure Compiler when comipling in advanced
 * compilation mode.
 */
define([
	'arrays',
	'blocks',
	'boundaries',
	'boundary-markers',
	'browsers',
	'colors',
	'content',
	'cursors',
	'dom',
	'dom-to-xhtml',
	'dragdrop',
	'editables',
	'editing',
	'ephemera',
	'events',
	'functions',
	'html',
	'keys',
	'maps',
	'mouse',
	'mutation',
	'overrides',
	'predicates',
	'ranges',
	'selection-change',
	'selections',
	'stable-range',
	'strings',
	'traversing',
	'trees',
	'typing',
	'undo',
], function Exports(
	Arrays,
	Blocks,
	Boundaries,
	Boundarymarkers,
	Browsers,
	Colors,
	Content,
	Cursors,
	Dom,
	Xhtml,
	DragDrop,
	Editables,
	Editing,
	Ephemera,
	Events,
	Fn,
	Html,
	Keys,
	Maps,
	Mouse,
	Mutation,
	Overrides,
	Predicates,
	Ranges,
	SelectionChange,
	Selections,
	StableRange,
	Strings,
	Traversing,
	Trees,
	Typing,
	Undo
) {
	'use strict';

	var exports = {};

	exports['arrays'] = Arrays;
	exports['arrays']['contains'] = Arrays.contains;
	exports['arrays']['difference'] = Arrays.difference;
	exports['arrays']['equal'] = Arrays.equal;
	exports['arrays']['intersect'] = Arrays.intersect;
	exports['arrays']['second'] = Arrays.second;
	exports['arrays']['last'] = Arrays.last;
	exports['arrays']['coerce'] = Arrays.coerce;
	exports['arrays']['mapcat'] = Arrays.mapcat;
	exports['arrays']['partition'] = Arrays.partition;

	exports['blocks'] = Blocks;
	exports['blocks']['read'] = Blocks.read;
	exports['blocks']['write'] = Blocks.write;
	exports['blocks']['handle'] = Blocks.handle;

	exports['boundaries'] = Boundaries;
	exports['create'] = Boundaries.create;
	exports['equals'] = Boundaries.equals;
	exports['normalize'] = Boundaries.normalize;
	exports['container'] = Boundaries.container;
	exports['offset'] = Boundaries.offset;
	exports['fromRange'] = Boundaries.fromRange;
	exports['fromRanges'] = Boundaries.fromRanges;
	exports['fromRangeStart'] = Boundaries.fromRangeStart;
	exports['fromRangeEnd'] = Boundaries.fromRangeEnd;
	exports['fromNode'] = Boundaries.fromNode;
	exports['isAtStart'] = Boundaries.isAtStart;
	exports['isAtEnd'] = Boundaries.isAtEnd;
	exports['isNodeBoundary'] = Boundaries.isNodeBoundary;
	exports['next'] = Boundaries.next;
	exports['prev'] = Boundaries.prev;
	exports['nextWhile'] = Boundaries.nextWhile;
	exports['prevWhile'] = Boundaries.prevWhile;
	exports['nextNode'] = Boundaries.nextNode;
	exports['prevNode'] = Boundaries.prevNode;
	exports['nodeAfter'] = Boundaries.nodeAfter;
	exports['nodeBefore'] = Boundaries.nodeBefore;
	exports['setRange'] = Boundaries.setRange;
	exports['setRanges'] = Boundaries.setRanges;
	exports['precedingTextLength'] = Boundaries.precedingTextLength;

	exports['boundarymarkers'] = Boundarymarkers;
	exports['boundarymarkers']['hint'] = Boundarymarkers.hint;
	exports['boundarymarkers']['insert'] = Boundarymarkers.insert;
	exports['boundarymarkers']['extract'] = Boundarymarkers.extract;

	exports['browsers'] = Browsers;
	exports['browsers']['ie7'] = Browsers.ie7;
	exports['browsers']['chrome'] = Browsers.chrome;
	exports['browsers']['webkit'] = Browsers.webkit;
	exports['browsers']['safari'] = Browsers.safari;
	exports['browsers']['vendor'] = Browsers.vendor;
	exports['browsers']['version'] = Browsers.version;
	exports['browsers']['hasRemoveProperty'] = Browsers.hasRemoveProperty;
	exports['browsers']['VENDOR_PREFIX'] = Browsers.VENDOR_PREFIX;

	exports['selections'] = Selections;
	exports['selections']['show'] = Selections.show;
	exports['selections']['handle'] = Selections.handle;
	exports['selections']['context'] = Selections.context;
	exports['selections']['hideCarets'] = Selections.hideCarets;
	exports['selections']['unhideCarets'] = Selections.unhideCarets;

	exports['content'] = Content;
	exports['content']['allowsNesting'] = Content.allowsNesting;

	exports['colors'] = Colors;
	exports['colors']['hex'] = Colors.hex;
	exports['colors']['getTextColor'] = Colors.getTextColor;
	exports['colors']['setTextColor'] = Colors.setTextColor;
	exports['colors']['unsetTextColor'] = Colors.unsetTextColor;
	exports['colors']['getBackgroundColor'] = Colors.getBackgroundColor;
	exports['colors']['setBackgroundColor'] = Colors.setBackgroundColor;
	exports['colors']['unsetBackgroundColor'] = Colors.unsetBackgroundColor;

	exports['cursors'] = Cursors;
	exports['cursors']['cursor'] = Cursors.cursor;
	exports['cursors']['cursor']['cursorFromBoundaryPoint'] = Cursors.cursorFromBoundaryPoint;
	exports['cursors']['cursor']['create'] = Cursors.create;
	exports['cursors']['cursor']['createFromBoundary'] = Cursors.createFromBoundary;
	exports['cursors']['cursor']['setToRange'] = Cursors.setToRange;

	exports['dom'] = Dom;
	exports['dom']['offset'] = Dom.offset;
	exports['dom']['remove'] = Dom.remove;
	exports['dom']['merge'] = Dom.merge;
	exports['dom']['addClass'] = Dom.addClass;
	exports['dom']['removeClass'] = Dom.removeClass;
	exports['dom']['hasClass'] = Dom.hasClass;
	exports['dom']['getElementsByClassNames'] = Dom.getElementsByClassNames;
	exports['dom']['attrNames'] = Dom.attrNames;
	exports['dom']['hasAttrs'] = Dom.hasAttrs;
	exports['dom']['setAttr'] = Dom.setAttr;
	exports['dom']['removeAttr'] = Dom.removeAttr;
	exports['dom']['setAttrNS'] = Dom.setAttrNS;
	exports['dom']['removeAttrNS'] = Dom.removeAttrNS;
	exports['dom']['attrs'] = Dom.attrs;
	exports['dom']['indexByClass'] = Dom.indexByClass;
	exports['dom']['indexByName'] = Dom.indexByName;
	exports['dom']['indexByClassHaveList'] = Dom.indexByClassHaveList;
	exports['dom']['outerHtml'] = Dom.outerHtml;
	exports['dom']['moveNextAll'] = Dom.moveNextAll;
	exports['dom']['cloneShallow'] = Dom.cloneShallow;
	exports['dom']['clone'] = Dom.clone;
	exports['dom']['wrap'] = Dom.wrap;
	exports['dom']['insert'] = Dom.insert;
	exports['dom']['removeShallow'] = Dom.removeShallow;
	exports['dom']['replaceShallow'] = Dom.replaceShallow;
	exports['dom']['isAtEnd'] = Dom.isAtEnd;
	exports['dom']['isAtStart'] = Dom.isAtStart;
	exports['dom']['nthChild'] = Dom.nthChild;
	exports['dom']['children'] = Dom.children;
	exports['dom']['nodeIndex'] = Dom.nodeIndex;
	exports['dom']['nodeLength'] = Dom.nodeLength;
	exports['dom']['nodeAtOffset'] = Dom.nodeAtOffset;
	exports['dom']['isTextNode'] = Dom.isTextNode;
	exports['dom']['isEmptyTextNode'] = Dom.isEmptyTextNode;
	exports['dom']['contains'] = Dom.contains;
	exports['dom']['followedBy'] = Dom.followedBy;
	exports['dom']['setStyle'] = Dom.setStyle;
	exports['dom']['getStyle'] = Dom.getStyle;
	exports['dom']['getComputedStyle'] = Dom.getComputedStyle;
	exports['dom']['removeStyle'] = Dom.removeStyle;
	exports['dom']['isEditable'] = Dom.isEditable;
	exports['dom']['isEditableNode'] = Dom.isEditableNode;
	exports['dom']['isEditingHost'] = Dom.isEditingHost;
	exports['dom']['editingHost'] = Dom.editingHost;
	exports['dom']['stringify'] = Dom.stringify;
	exports['dom']['stringifyReplacer'] = Dom.stringifyReplacer;
	exports['dom']['parseReviver'] = Dom.parseReviver;
	exports['dom']['Nodes'] = Dom.Nodes;
	exports['dom']['ensureExpandoId'] = Dom.ensureExpandoId;

	exports['dom']['Nodes']['ELEMENT'] = Dom.Nodes.ELEMENT;
	exports['dom']['Nodes']['ATTR'] = Dom.Nodes.ATTR;
	exports['dom']['Nodes']['TEXT'] = Dom.Nodes.TEXT;
	exports['dom']['Nodes']['CDATA_SECTION'] = Dom.Nodes.CDATA_SECTION;
	exports['dom']['Nodes']['ENTITY_REFERENCE'] = Dom.Nodes.ENTITY_REFERENCE;
	exports['dom']['Nodes']['ENTITY'] = Dom.Nodes.ENTITY;
	exports['dom']['Nodes']['PROCESSING_INSTRUCTION'] = Dom.Nodes.PROCESSING_INSTRUCTION;
	exports['dom']['Nodes']['COMMENT'] = Dom.Nodes.COMMENT;
	exports['dom']['Nodes']['DOCUMENT'] = Dom.Nodes.DOCUMENT;
	exports['dom']['Nodes']['DOCUMENTTYPE'] = Dom.Nodes.DOCUMENTTYPE;
	exports['dom']['Nodes']['DOCUMENT_FRAGMENT'] = Dom.Nodes.DOCUMENT_FRAGMENT;
	exports['dom']['Nodes']['NOTATION'] = Dom.Nodes.NOTATION;

	exports['dragdrop'] = DragDrop;
	exports['dragdrop']['handle'] = DragDrop.handle;
	exports['dragdrop']['Context'] = DragDrop.Context;
	exports['dragdrop']['isDraggable'] = DragDrop.isDraggable;

	exports['editables'] = Editables;
	exports['editables']['fromElem'] = Editables.fromElem;
	exports['editables']['fromBoundary'] = Editables.fromBoundary;
	exports['editables']['assocIntoEditor'] = Editables.assocIntoEditor;
	exports['editables']['dissocFromEditor'] = Editables.dissocFromEditor;
	exports['editables']['close'] = Editables.close;

	exports['mutation'] = Mutation;
	exports['mutation']['removeShallowPreservingCursors'] = Mutation.removeShallowPreservingCursors;
	exports['mutation']['removePreservingRange'] = Mutation.removePreservingRange;
	exports['mutation']['removePreservingRanges'] = Mutation.removePreservingRanges;
	exports['mutation']['insertTextAtBoundary'] = Mutation.insertTextAtBoundary;
	exports['mutation']['insertNodeAtBoundary'] = Mutation.insertNodeAtBoundary;
	exports['mutation']['splitTextNode'] = Mutation.splitTextNode;
	exports['mutation']['splitTextContainers'] = Mutation.splitTextContainers;
	exports['mutation']['joinTextNodeAdjustRange'] = Mutation.joinTextNodeAdjustRange;
	exports['mutation']['joinTextNode'] = Mutation.joinTextNode;
	exports['mutation']['splitBoundary'] = Mutation.splitBoundary;

	exports['predicates'] = Predicates;
	exports['predicates']['isVoidNode'] = Predicates.isVoidNode;
	exports['predicates']['isBlockNode'] = Predicates.isBlockNode;
	exports['predicates']['isInlineNode'] = Predicates.isInlineNode;
	exports['predicates']['isTextLevelSemanticNode'] = Predicates.isTextLevelSemanticNode;

	exports['editing'] = Editing;
	exports['editing']['wrap'] = Editing.wrap;
	exports['editing']['format'] = Editing.format;
	exports['editing']['split'] = Editing.split;
	exports['editing']['delete'] = Editing.delete;

	exports['ephemera'] = Ephemera;
	exports['ephemera']['classes'] = Ephemera.classes;
	exports['ephemera']['attributes'] = Ephemera.attributes;
	exports['ephemera']['markElement'] = Ephemera.markElement;
	exports['ephemera']['markAttr'] = Ephemera.markAttr;
	exports['ephemera']['markWrapper'] = Ephemera.markWrapper;
	exports['ephemera']['markFiller'] = Ephemera.markFiller;
	exports['ephemera']['prune'] = Ephemera.prune;
	exports['ephemera']['isAttrEphemeral'] = Ephemera.isAttrEphemeral;

	exports['events'] = Events;
	exports['events']['add'] = Events.add;
	exports['events']['remove'] = Events.remove;
	exports['events']['setup'] = Events.setup;
	exports['events']['isWithCtrl'] = Events.isWithCtrl;
	exports['events']['isWithShift'] = Events.isWithShift;
	exports['events']['dispatch'] = Events.dispatch;
	exports['events']['nextTick'] = Events.nextTick;

	exports['fn'] = Fn;
	exports['fn']['identity'] = Fn.identity;
	exports['fn']['noop'] = Fn.noop;
	exports['fn']['returnTrue'] = Fn.returnTrue;
	exports['fn']['returnFalse'] = Fn.returnFalse;
	exports['fn']['complement'] = Fn.complement;
	exports['fn']['partial'] = Fn.partial;
	exports['fn']['outparameter'] = Fn.outparameter;
	exports['fn']['comp'] = Fn.comp;

	exports['html'] = Html;
	exports['html']['isUnrendered'] = Html.isUnrendered;
	exports['html']['isRendered'] = Html.isRendered;
	exports['html']['isStyleInherited'] = Html.isStyleInherited;
	exports['html']['hasBlockStyle'] = Html.hasBlockStyle;
	exports['html']['hasInlineStyle'] = Html.hasInlineStyle;
	exports['html']['isUnrenderedWhitespace'] = Html.isUnrenderedWhitespace;
	exports['html']['isWhiteSpacePreserveStyle'] = Html.isWhiteSpacePreserveStyle;
	exports['html']['skipUnrenderedToStartOfLine'] = Html.skipUnrenderedToStartOfLine;
	exports['html']['skipUnrenderedToEndOfLine'] = Html.skipUnrenderedToEndOfLine;
	exports['html']['normalizeBoundary'] = Html.normalizeBoundary;
	exports['html']['isEmpty'] = Html.isEmpty;
	exports['html']['hasLinebreakingStyle'] = Html.hasLinebreakingStyle;
	exports['html']['isVisuallyAdjacent'] = Html.isVisuallyAdjacent;
	exports['html']['removeVisualBreak'] = Html.removeVisualBreak;
	exports['html']['nextWordBoundary'] = Html.nextWordBoundary;
	exports['html']['prevWordBoundary'] = Html.prevWordBoundary;

	exports['typing'] = Typing;
	exports['typing']['handle'] = Typing.handle;
	exports['typing']['actions'] = Typing.actions;

	exports['keys'] = Keys;
	exports['handle'] = Keys.handle;
	exports['ARROWS'] = Keys.ARROWS;
	exports['CODES']  = Keys.CODES;

	exports['mouse'] = Mouse;
	exports['handle'] = Mouse.handle;

	exports['maps'] = Maps;
	exports['isEmpty'] = Maps.isEmpty;
	exports['fillTuples'] = Maps.fillTuples;
	exports['fillKeys'] = Maps.fillKeys;
	exports['keys'] = Maps.keys;
	exports['vals'] = Maps.vals;
	exports['forEach'] = Maps.forEach;
	exports['extend'] = Maps.extend;
	exports['merge'] = Maps.merge;
	exports['isMap'] = Maps.isMap;

	exports['trees'] = Trees;
	exports['trees']['prewalk'] = Trees.prewalk;
	exports['trees']['postwalk'] = Trees.postwalk;
	exports['trees']['preprune'] = Trees.preprune;
	exports['trees']['postprune'] = Trees.postprune;
	exports['trees']['leaves'] = Trees.leaves;
	exports['trees']['clone'] = Trees.clone;
	exports['trees']['flatten'] = Trees.flatten;
	exports['trees']['deepEqual'] = Trees.deepEqual;
	exports['trees']['walkContainer'] = Trees.walk;
	exports['trees']['walkContainerInplace'] = Trees.walkInplace;
	exports['trees']['walk'] = Trees.walk;
	exports['trees']['walkRec'] = Trees.walkRec;
	exports['trees']['identityStep'] = Trees.identityStep;

	exports['overrides'] = Overrides;
	exports['overrides']['map'] = Overrides.map;
	exports['overrides']['lookup'] = Overrides.lookup;
	exports['overrides']['harvest'] = Overrides.harvest;
	exports['overrides']['consume'] = Overrides.consume;

	exports['ranges'] = Ranges;
	exports['ranges']['box'] = Ranges.box;
	exports['ranges']['get'] = Ranges.get;
	exports['ranges']['select'] = Ranges.select;
	exports['ranges']['create'] = Ranges.create;
	exports['ranges']['equals'] = Ranges.equals;
	exports['ranges']['collapseToEnd'] = Ranges.collapseToEnd;
	exports['ranges']['collapseToStart'] = Ranges.collapseToStart;
	exports['ranges']['expandBoundaries'] = Ranges.expandBoundaries;
	exports['ranges']['expandToWord'] = Ranges.expandToWord;
	exports['ranges']['expandForwardToVisiblePosition'] = Ranges.expandForwardToVisiblePosition;
	exports['ranges']['expandBackwardToVisiblePosition'] = Ranges.expandBackwardToVisiblePosition;
	exports['ranges']['insertTextBehind'] = Ranges.insertTextBehind;
	exports['ranges']['trim'] = Ranges.trim;
	exports['ranges']['nearestEditingHost'] = Ranges.getNearestEditingHost;

	exports['stablerange'] = StableRange;

	exports['strings'] = Strings;
	exports['strings']['words'] = Strings.words;
	exports['strings']['dashesToCamelCase'] = Strings.dashesToCamelCase;
	exports['strings']['camelCaseToDashes'] = Strings.camelCaseToDashes;
	exports['strings']['splitIncl'] = Strings.splitIncl;
	exports['strings']['empty'] = Strings.empty;
	exports['strings']['isControlCharacter'] = Strings.isControlCharacter;

	exports['traversing'] = Traversing;
	exports['traversing']['backward'] = Traversing.backward;
	exports['traversing']['forward'] = Traversing.forward;
	exports['traversing']['nextWhile'] = Traversing.nextWhile;
	exports['traversing']['prevWhile'] = Traversing.prevWhile;
	exports['traversing']['upWhile'] = Traversing.upWhile;
	exports['traversing']['walk'] = Traversing.walk;
	exports['traversing']['walkRec'] = Traversing.walkRec;
	exports['traversing']['walkUntil'] = Traversing.walkUntil;
	exports['traversing']['walkUntilNode'] = Traversing.walkUntilNode;
	exports['traversing']['find'] = Traversing.find;
	exports['traversing']['findBackward'] = Traversing.findBackward;
	exports['traversing']['findForward'] = Traversing.findForward;
	exports['traversing']['parentsUntil'] = Traversing.parentsUntil;
	exports['traversing']['parentsUntilIncl'] = Traversing.parentsUntilIncl;
	exports['traversing']['childAndParentsUntil'] = Traversing.childAndParentsUntil;
	exports['traversing']['childAndParentsUntilIncl'] = Traversing.childAndParentsUntilIncl;
	exports['traversing']['childAndParentsUntilNode'] = Traversing.childAndParentsUntilNode;
	exports['traversing']['childAndParentsUntilInclNode'] = Traversing.childAndParentsUntilInclNode;
	exports['traversing']['climbUntil'] = Traversing.climbUntil;
	exports['traversing']['getNonAncestor'] = Traversing.getNonAncestor;
	exports['traversing']['previousNonAncestor'] = Traversing.previousNonAncestor;
	exports['traversing']['nextNonAncestor'] = Traversing.nextNonAncestor;
	exports['traversing']['findAncestor'] = Traversing.findAncestor;

	exports['xhtml'] = Xhtml;
	exports['xhtml']['contentsToXhtml'] = Xhtml.contentsToXhtml;
	exports['xhtml']['nodeToXhtml'] = Xhtml.nodeToXhtml;

	exports['undo'] = Undo;
	exports['undo']['Context'] = Undo.Context;
	exports['undo']['enter'] = Undo.enter;
	exports['undo']['leave'] = Undo.leave;
	exports['undo']['capture'] = Undo.capture;
	exports['undo']['pathFromBoundary'] = Undo.pathFromBoundary;
	exports['undo']['changeSetFromFrame'] = Undo.changeSetFromFrame;
	exports['undo']['inverseChangeSet'] = Undo.inverseChangeSet;
	exports['undo']['applyChangeSet'] = Undo.applyChangeSet;
	exports['undo']['advanceHistory'] = Undo.advanceHistory;
	exports['undo']['makeInsertChange'] = Undo.makeInsertChange;
	exports['undo']['undo'] = Undo.undo;
	exports['undo']['redo'] = Undo.redo;

	exports['selection_change'] = SelectionChange;
	exports['selection_change']['handler'] = SelectionChange.handler;
	exports['selection_change']['addHandler'] = SelectionChange.addHandler;
	exports['selection_change']['removeHandler'] = SelectionChange.removeHandler;

	return exports;
});
