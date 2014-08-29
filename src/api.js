/**
 * api.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * This module exports the Aloha Editor API in a way that will be safe from
 * mungling by the Google Closure Compiler when comipling in advanced
 * compilation mode.
 */
define([
	'arrays',
	'blocks',
	'boromir',
	'boundaries',
	'browsers',
	'carets',
	'colors',
	'content',
	'delayed-map',
	'dom',
	'dragdrop',
	'editables',
	'editing',
	'events',
	'formatting',
	'functions',
	'html',
	'image',
	'keys',
	'links',
	'lists',
	'maps',
	'markers',
	'metaview',
	'mouse',
	'mutation',
	'overrides',
	'paste',
	'paths',
	'record',
	'selection-change',
	'selections',
	'searching',
	'strings',
	'transform',
	'traversing',
	'typing',
	'undo',
	'mutation-trees'
], function (
	Arrays,
	Blocks,
	Boromir,
	Boundaries,
	Browsers,
	Carets,
	Colors,
	Content,
	DelayedMap,
	Dom,
	DragDrop,
	Editables,
	Editing,
	Events,
	Formatting,
	Fn,
	Html,
	Images,
	Keys,
	Links,
	Lists,
	Maps,
	Markers,
	Metaview,
	Mouse,
	Mutation,
	Overrides,
	Paste,
	Paths,
	Record,
	SelectionChange,
	Selections,
	Searching,
	Strings,
	Transform,
	Traversing,
	Typing,
	Undo,
	MutationTrees
) {
	'use strict';

	var exports = {};

	exports['Boromir'] = Boromir;
	exports['DelayedMap'] = DelayedMap;
	exports['Record'] = Record;

	exports['arrays'] = new Object();
	exports['arrays']['contains']   = Arrays.contains;
	exports['arrays']['difference'] = Arrays.difference;
	exports['arrays']['equal']      = Arrays.equal;
	exports['arrays']['intersect']  = Arrays.intersect;
	exports['arrays']['second']     = Arrays.second;
	exports['arrays']['last']       = Arrays.last;
	exports['arrays']['coerce']     = Arrays.coerce;
	exports['arrays']['mapcat']     = Arrays.mapcat;
	exports['arrays']['partition']  = Arrays.partition;
	exports['arrays']['some']       = Arrays.some;
	exports['arrays']['someIndex']  = Arrays.someIndex;
	exports['arrays']['split']      = Arrays.split;
	exports['arrays']['unique']     = Arrays.unique;


	exports['blocks'] = new Object();
	exports['blocks']['read']   = Blocks.read;
	exports['blocks']['write']  = Blocks.write;
	exports['blocks']['handle'] = Blocks.handle;

	exports['boundaries'] = new Object();
	exports['boundaries']['get']                 = Boundaries.get;
	exports['boundaries']['select']              = Boundaries.select;
	exports['boundaries']['raw']                 = Boundaries.raw;
	exports['boundaries']['create']              = Boundaries.create;
	exports['boundaries']['normalize']           = Boundaries.normalize;
	exports['boundaries']['equals']              = Boundaries.equals;
	exports['boundaries']['container']           = Boundaries.container;
	exports['boundaries']['offset']              = Boundaries.offset;
	exports['boundaries']['document']            = Boundaries.document;
	exports['boundaries']['fromRange']           = Boundaries.fromRange;
	exports['boundaries']['fromRanges']          = Boundaries.fromRanges;
	exports['boundaries']['fromRangeStart']      = Boundaries.fromRangeStart;
	exports['boundaries']['fromRangeEnd']        = Boundaries.fromRangeEnd;
	exports['boundaries']['fromNode']            = Boundaries.fromNode;
	exports['boundaries']['fromEndOfNode']       = Boundaries.fromEndOfNode;
	exports['boundaries']['fromPosition']        = Boundaries.fromPosition;
	exports['boundaries']['setRange']            = Boundaries.setRange;
	exports['boundaries']['setRanges']           = Boundaries.setRanges;
	exports['boundaries']['setRangeStart']       = Boundaries.setRangeStart;
	exports['boundaries']['setRangeEnd']         = Boundaries.setRangeEnd;
	exports['boundaries']['isAtStart']           = Boundaries.isAtStart;
	exports['boundaries']['isAtEnd']             = Boundaries.isAtEnd;
	exports['boundaries']['isAtRawStart']        = Boundaries.isAtRawStart;
	exports['boundaries']['isAtRawEnd']          = Boundaries.isAtRawEnd;
	exports['boundaries']['isTextBoundary']      = Boundaries.isTextBoundary;
	exports['boundaries']['isNodeBoundary']      = Boundaries.isNodeBoundary;
	exports['boundaries']['next']                = Boundaries.next;
	exports['boundaries']['prev']                = Boundaries.prev;
	exports['boundaries']['nextRawBoundary']     = Boundaries.nextRawBoundary;
	exports['boundaries']['prevRawBoundary']     = Boundaries.prevRawBoundary;
	exports['boundaries']['jumpOver']            = Boundaries.jumpOver;
	exports['boundaries']['nextWhile']           = Boundaries.nextWhile;
	exports['boundaries']['prevWhile']           = Boundaries.prevWhile;
	exports['boundaries']['stepWhile']           = Boundaries.stepWhile;
	exports['boundaries']['walkWhile']           = Boundaries.walkWhile;
	exports['boundaries']['nextNode']            = Boundaries.nextNode;
	exports['boundaries']['prevNode']            = Boundaries.prevNode;
	exports['boundaries']['nodeAfter']           = Boundaries.nodeAfter;
	exports['boundaries']['nodeBefore']          = Boundaries.nodeBefore;
	exports['boundaries']['commonContainer']     = Boundaries.commonContainer;
	exports['boundaries']['range']               = Boundaries.range;

	exports['markers'] = new Object();
	exports['markers']['hint']    = Markers.hint;
	exports['markers']['insert']  = Markers.insert;
	exports['markers']['extract'] = Markers.extract;

	exports['browsers'] = new Object();
	exports['browsers']['ie7']           = Browsers.ie7;
	exports['browsers']['chrome']        = Browsers.chrome;
	exports['browsers']['webkit']        = Browsers.webkit;
	exports['browsers']['safari']        = Browsers.safari;
	exports['browsers']['vendor']        = Browsers.vendor;
	exports['browsers']['version']       = Browsers.version;
	exports['browsers']['VENDOR_PREFIX'] = Browsers.VENDOR_PREFIX;

	exports['colors'] = new Object();
	exports['colors']['hex']      = Colors.hex;
	exports['colors']['rgb']      = Colors.rgb;
	exports['colors']['cross']    = Colors.cross;
	exports['colors']['equals']   = Colors.equals;
	exports['colors']['toString'] = Colors.toString;

	exports['content'] = new Object();
	exports['content']['allowsNesting']        = Content.allowsNesting;
	exports['content']['NODES_BLACKLIST']      = Content.NODES_BLACKLIST;
	exports['content']['STYLES_WHITELIST']     = Content.STYLES_WHITELIST;
	exports['content']['ATTRIBUTES_WHITELIST'] = Content.ATTRIBUTES_WHITELIST;

	exports['dom'] = new Object();
	exports['dom']['Nodes']                        = Dom.Nodes;
	exports['dom']['offset']                       = Dom.offset;
	exports['dom']['cloneShallow']                 = Dom.cloneShallow;
	exports['dom']['clone']                        = Dom.clone;
	exports['dom']['text']                         = Dom.text;
	exports['dom']['children']                     = Dom.children;
	exports['dom']['nthChild']                     = Dom.nthChild;
	exports['dom']['numChildren']                  = Dom.numChildren;
	exports['dom']['nodeIndex']                    = Dom.nodeIndex;
	exports['dom']['nodeLength']                   = Dom.nodeLength;
	exports['dom']['hasChildren']                  = Dom.hasChildren;
	exports['dom']['nodeAtOffset']                 = Dom.nodeAtOffset;
	exports['dom']['normalizedNthChild']           = Dom.normalizedNthChild;
	exports['dom']['normalizedNodeIndex']          = Dom.normalizedNodeIndex;
	exports['dom']['realFromNormalizedIndex']      = Dom.realFromNormalizedIndex;
	exports['dom']['normalizedNumChildren']        = Dom.normalizedNumChildren;
	exports['dom']['isTextNode']                   = Dom.isTextNode;
	exports['dom']['isElementNode']                = Dom.isElementNode;
	exports['dom']['isFragmentNode']               = Dom.isFragmentNode;
	exports['dom']['isEmptyTextNode']              = Dom.isEmptyTextNode;
	exports['dom']['isSameNode']                   = Dom.isSameNode;
	exports['dom']['equals']                       = Dom.equals;
	exports['dom']['contains']                     = Dom.contains;
	exports['dom']['followedBy']                   = Dom.followedBy;
	exports['dom']['hasText']                      = Dom.hasText;
	exports['dom']['outerHtml']                    = Dom.outerHtml;
	exports['dom']['append']                       = Dom.append;
	exports['dom']['merge']                        = Dom.merge;
	exports['dom']['moveNextAll']                  = Dom.moveNextAll;
	exports['dom']['moveBefore']                   = Dom.moveBefore;
	exports['dom']['moveAfter']                    = Dom.moveAfter;
	exports['dom']['move']                         = Dom.move;
	exports['dom']['copy']                         = Dom.copy;
	exports['dom']['wrap']                         = Dom.wrap;
	exports['dom']['wrapWith']                     = Dom.wrapWith;
	exports['dom']['insert']                       = Dom.insert;
	exports['dom']['insertAfter']                  = Dom.insertAfter;
	exports['dom']['replace']                      = Dom.replace;
	exports['dom']['replaceShallow']               = Dom.replaceShallow;
	exports['dom']['remove']                       = Dom.remove;
	exports['dom']['removeShallow']                = Dom.removeShallow;
	exports['dom']['removeChildren']               = Dom.removeChildren;
	exports['dom']['addClass']                     = Dom.addClass;
	exports['dom']['removeClass']                  = Dom.removeClass;
	exports['dom']['hasClass']                     = Dom.hasClass;
	exports['dom']['attrNames']                    = Dom.attrNames;
	exports['dom']['hasAttrs']                     = Dom.hasAttrs;
	exports['dom']['attrs']                        = Dom.attrs;
	exports['dom']['setAttr']                      = Dom.setAttr;
	exports['dom']['setAttrNS']                    = Dom.setAttrNS;
	exports['dom']['getAttr']                      = Dom.getAttr;
	exports['dom']['getAttrNS']                    = Dom.getAttrNS;
	exports['dom']['removeAttr']                   = Dom.removeAttr;
	exports['dom']['removeAttrNS']                 = Dom.removeAttrNS;
	exports['dom']['removeAttrs']                  = Dom.removeAttrs;
	exports['dom']['removeStyle']                  = Dom.removeStyle;
	exports['dom']['setStyle']                     = Dom.setStyle;
	exports['dom']['getStyle']                     = Dom.getStyle;
	exports['dom']['getComputedStyle']             = Dom.getComputedStyle;
	exports['dom']['getComputedStyles']            = Dom.getComputedStyles;
	exports['dom']['query']                        = Dom.query;
	exports['dom']['nextNonAncestor']              = Dom.nextNonAncestor;
	exports['dom']['nextWhile']                    = Dom.nextWhile;
	exports['dom']['nextUntil']                    = Dom.nextUntil;
	exports['dom']['nextSibling']                  = Dom.nextSibling;
	exports['dom']['nextSiblings']                 = Dom.nextSiblings;
	exports['dom']['prevWhile']                    = Dom.prevWhile;
	exports['dom']['prevUntil']                    = Dom.prevUntil;
	exports['dom']['prevSibling']                  = Dom.prevSibling;
	exports['dom']['prevSiblings']                 = Dom.prevSiblings;
	exports['dom']['nodeAndNextSiblings']          = Dom.nodeAndNextSiblings;
	exports['dom']['nodeAndPrevSiblings']          = Dom.nodeAndPrevSiblings;
	exports['dom']['walk']                         = Dom.walk;
	exports['dom']['walkRec']                      = Dom.walkRec;
	exports['dom']['walkUntilNode']                = Dom.walkUntilNode;
	exports['dom']['forward']                      = Dom.forward;
	exports['dom']['backward']                     = Dom.backward;
	exports['dom']['findForward']                  = Dom.findForward;
	exports['dom']['findBackward']                 = Dom.findBackward;
	exports['dom']['upWhile']                      = Dom.upWhile;
	exports['dom']['climbUntil']                   = Dom.climbUntil;
	exports['dom']['childAndParentsUntil']         = Dom.childAndParentsUntil;
	exports['dom']['childAndParentsUntilIncl']     = Dom.childAndParentsUntilIncl;
	exports['dom']['childAndParentsUntilNode']     = Dom.childAndParentsUntilNode;
	exports['dom']['childAndParentsUntilInclNode'] = Dom.childAndParentsUntilInclNode;
	exports['dom']['stringify']                    = Dom.stringify;
	exports['dom']['stringifyReplacer']            = Dom.stringifyReplacer;
	exports['dom']['parseReviver']                 = Dom.parseReviver;
	exports['dom']['ensureExpandoId']              = Dom.ensureExpandoId;
	exports['dom']['enableSelection']              = Dom.enableSelection;
	exports['dom']['disableSelection']             = Dom.disableSelection;
	exports['dom']['isEditable']                   = Dom.isEditable;
	exports['dom']['isEditableNode']               = Dom.isEditableNode;
	exports['dom']['isEditingHost']                = Dom.isEditingHost;
	exports['dom']['isContentEditable']            = Dom.isContentEditable;
	exports['dom']['documentWindow']               = Dom.documentWindow;
	exports['dom']['editingHost']                  = Dom.editingHost;
	exports['dom']['editableParent']               = Dom.editableParent;
	exports['dom']['scrollTop']                    = Dom.scrollTop;
	exports['dom']['scrollLeft']                   = Dom.scrollLeft;

	exports['dragdrop'] = new Object();
	exports['dragdrop']['handle']      = DragDrop.handle;
	exports['dragdrop']['Context']     = DragDrop.Context;
	exports['dragdrop']['isDraggable'] = DragDrop.isDraggable;

	exports['editables'] = new Object();
	exports['editables']['Editable']         = Editables.Editable;
	exports['editables']['fromElem']         = Editables.fromElem;
	exports['editables']['fromBoundary']     = Editables.fromBoundary;
	exports['editables']['assocIntoEditor']  = Editables.assocIntoEditor;
	exports['editables']['dissocFromEditor'] = Editables.dissocFromEditor;
	exports['editables']['close']            = Editables.close;
	exports['editables']['handle']           = Editables.handle;
	exports['editables']['create']           = Editables.create;

	exports['editing'] = new Object();
	exports['editing']['wrap']      = Editing.wrap;
	exports['editing']['unformat']  = Editing.unformat;
	exports['editing']['format']    = Editing.format;
	exports['editing']['style']     = Editing.style;
	exports['editing']['split']     = Editing.split;
	exports['editing']['remove']    = Editing.remove;
	exports['editing']['breakline'] = Editing.breakline;
	exports['editing']['insert']    = Editing.insert;

	exports['formatting'] = new Object();
	exports['formatting']['format'] = Formatting.format;

	exports['events'] = new Object();
	exports['events']['add']             = Events.add;
	exports['events']['remove']          = Events.remove;
	exports['events']['setup']           = Events.setup;
	exports['events']['hasKeyModifier']  = Events.hasKeyModifier;
	exports['events']['dispatch']        = Events.dispatch;
	exports['events']['nextTick']        = Events.nextTick;
	exports['events']['preventDefault']  = Events.preventDefault;
	exports['events']['stopPropagation'] = Events.stopPropagation;
	exports['events']['suppress']        = Events.suppress;

	exports['fn'] = new Object();
	exports['fn']['identity']     = Fn.identity;
	exports['fn']['noop']         = Fn.noop;
	exports['fn']['returnTrue']   = Fn.returnTrue;
	exports['fn']['returnFalse']  = Fn.returnFalse;
	exports['fn']['complement']   = Fn.complement;
	exports['fn']['partial']      = Fn.partial;
	exports['fn']['strictEquals'] = Fn.strictEquals;
	exports['fn']['comp']         = Fn.comp;
	exports['fn']['and']          = Fn.and;
	exports['fn']['constantly']   = Fn.constantly;
	exports['fn']['is']           = Fn.is;
	exports['fn']['isNou']        = Fn.isNou;
	exports['fn']['asMethod']     = Fn.asMethod;
	exports['fn']['extendType']   = Fn.extendType;

	exports['html'] = new Object();
	exports['html']['__']                        = Html.__;
	exports['html']['isRenderedBr']              = Html.isRenderedBr;
	exports['html']['isRendered']                = Html.isRendered;
	exports['html']['isUnrendered']              = Html.isUnrendered;
	exports['html']['isUnrenderedWhitespace']    = Html.isUnrenderedWhitespace;
	exports['html']['parse']                     = Html.parse;
	exports['html']['isVoidType']                = Html.isVoidType;
	exports['html']['isStyleInherited']          = Html.isStyleInherited;
	exports['html']['isWhiteSpacePreserveStyle'] = Html.isWhiteSpacePreserveStyle;
	exports['html']['hasBlockStyle']             = Html.hasBlockStyle;
	exports['html']['hasInlineStyle']            = Html.hasInlineStyle;
	exports['html']['hasLinebreakingStyle']      = Html.hasLinebreakingStyle;
	exports['html']['prop']                      = Html.prop;
	exports['html']['insertBreak']               = Html.insertBreak;
	exports['html']['removeBreak']               = Html.removeBreak;
	exports['html']['insertLineBreak']           = Html.insertLineBreak;
	exports['html']['prev']                      = Html.prev;
	exports['html']['next']                      = Html.next;
	exports['html']['prevNode']                  = Html.prevNode;
	exports['html']['nextNode']                  = Html.nextNode;
	exports['html']['prevSignificantOffset']     = Html.prevSignificantOffset;
	exports['html']['nextSignificantOffset']     = Html.nextSignificantOffset;
	exports['html']['prevSignificantBoundary']   = Html.prevSignificantBoundary;
	exports['html']['nextSignificantBoundary']   = Html.nextSignificantBoundary;
	exports['html']['isAtStart']                 = Html.isAtStart;
	exports['html']['isAtEnd']                   = Html.isAtEnd;
	exports['html']['isBoundariesEqual']         = Html.isBoundariesEqual;
	exports['html']['expandBackward']            = Html.expandBackward;
	exports['html']['expandForward']             = Html.expandForward;
	exports['html']['isBlockNode']               = Html.isBlockNode;
	exports['html']['isGroupContainer']          = Html.isGroupContainer;
	exports['html']['isGroupedElement']          = Html.isGroupedElement;
	exports['html']['isHeading']                 = Html.isHeading;
	exports['html']['isInlineNode']              = Html.isInlineNode;
	exports['html']['isListContainer']           = Html.isListContainer;
	exports['html']['isListItem']                = Html.isListItem;
	exports['html']['isTableContainer']          = Html.isTableContainer;
	exports['html']['isTextLevelSemanticNode']   = Html.isTextLevelSemanticNode;
	exports['html']['isVoidNode']                = Html.isVoidNode;

	exports['images'] = new Object();
	exports['images']['insert'] = Images.insert;
	exports['images']['setAttributes'] = Images.setAttributes;

	exports['keys'] = new Object();
	exports['keys']['handle'] = Keys.handle;
	exports['keys']['ARROWS'] = Keys.ARROWS;
	exports['keys']['CODES']  = Keys.CODES;

	exports['links'] = new Object();
	exports['links']['create'] = Links.create;
	exports['links']['remove'] = Links.remove;

	exports['lists'] = new Object();
	exports['lists']['format'] = Lists.format;
	exports['lists']['unformat'] = Lists.unformat;
	exports['lists']['toggle'] = Lists.toggle;

	exports['maps'] = new Object();
	exports['maps']['isEmpty']     = Maps.isEmpty;
	exports['maps']['fillKeys']    = Maps.fillKeys;
	exports['maps']['keys']        = Maps.keys;
	exports['maps']['vals']        = Maps.vals;
	exports['maps']['selectVals']  = Maps.selectVals;
	exports['maps']['filter']      = Maps.filter;
	exports['maps']['forEach']     = Maps.forEach;
	exports['maps']['extend']      = Maps.extend;
	exports['maps']['merge']       = Maps.merge;
	exports['maps']['isMap']       = Maps.isMap;
	exports['maps']['clone']       = Maps.clone;
	exports['maps']['cloneSet']    = Maps.cloneSet;
	exports['maps']['cloneDelete'] = Maps.cloneDelete;
	exports['maps']['create']      = Maps.create;
	exports['maps']['mapTuples']   = Maps.mapTuples;

	exports['metaview'] = new Object();
	exports['metaview']['toggle'] = Metaview.toggle;

	exports['mouse'] = new Object();
	exports['mouse']['handle'] = Mouse.handle;
	exports['mouse']['EVENTS'] = Mouse.EVENTS;

	exports['mutation'] = new Object();
	exports['mutation']['replaceShallowPreservingBoundaries'] = Mutation.replaceShallowPreservingBoundaries;
	exports['mutation']['removeShallowPreservingCursors']     = Mutation.removeShallowPreservingCursors;
	exports['mutation']['removePreservingRange']              = Mutation.removePreservingRange;
	exports['mutation']['removePreservingRanges']             = Mutation.removePreservingRanges;
	exports['mutation']['removeNode']                         = Mutation.removeNode;
	exports['mutation']['insertTextAtBoundary']               = Mutation.insertTextAtBoundary;
	exports['mutation']['insertNodeAtBoundary']               = Mutation.insertNodeAtBoundary;
	exports['mutation']['splitTextNode']                      = Mutation.splitTextNode;
	exports['mutation']['splitTextContainers']                = Mutation.splitTextContainers;
	exports['mutation']['joinTextNodeAdjustRange']            = Mutation.joinTextNodeAdjustRange;
	exports['mutation']['joinTextNode']                       = Mutation.joinTextNode;
	exports['mutation']['splitBoundary']                      = Mutation.splitBoundary;
	exports['mutation']['splitBoundaryUntil']                 = Mutation.splitBoundaryUntil;

	exports['overrides'] = new Object();
	exports['overrides']['indexOf']     = Overrides.indexOf;
	exports['overrides']['unique']      = Overrides.unique;
	exports['overrides']['toggle']      = Overrides.toggle;
	exports['overrides']['harvest']     = Overrides.harvest;
	exports['overrides']['consume']     = Overrides.consume;
	exports['overrides']['nodeToState'] = Overrides.nodeToState;

	exports['paste'] = new Object();
	exports['paste']['handle'] = Paste.handle;

	exports['paths'] = new Object();
	exports['paths']['toBoundary']   = Paths.toBoundary;
	exports['paths']['fromBoundary'] = Paths.fromBoundary;

	exports['carets'] = new Object();
	exports['carets']['box']      = Carets.box;
	exports['carets']['showHint'] = Carets.showHint;
	exports['carets']['hideHint'] = Carets.hideHint;

	exports['selectionchange'] = new Object();
	exports['selectionchange']['handler']       = SelectionChange.handler;
	exports['selectionchange']['addHandler']    = SelectionChange.addHandler;
	exports['selectionchange']['removeHandler'] = SelectionChange.removeHandler;

	exports['selections'] = new Object();
	exports['selections']['show']             = Selections.show;
	exports['selections']['focus']            = Selections.focus;
	exports['selections']['select']           = Selections.select;
	exports['selections']['handle']           = Selections.handle;
	exports['selections']['Context']          = Selections.Context;
	exports['selections']['hideCarets']       = Selections.hideCarets;
	exports['selections']['unhideCarets']     = Selections.unhideCarets;
	exports['selections']['handleSelections'] = Selections.handleSelections;

	exports['searching'] = new Object();
	exports['searching']['search']   = Searching.search;
	exports['searching']['forward']  = Searching.forward;
	exports['searching']['backward'] = Searching.backward;

	exports['strings'] = new Object();
	exports['strings']['addToList']                     = Strings.addToList;
	exports['strings']['removeFromList']                = Strings.removeFromList;
	exports['strings']['uniqueList']                    = Strings.uniqueList;
	exports['strings']['words']                         = Strings.words;
	exports['strings']['splitIncl']                     = Strings.splitIncl;
	exports['strings']['dashesToCamelCase']             = Strings.dashesToCamelCase;
	exports['strings']['camelCaseToDashes']             = Strings.camelCaseToDashes;
	exports['strings']['isEmpty']                       = Strings.isEmpty;
	exports['strings']['isControlCharacter']            = Strings.isControlCharacter;
	exports['strings']['CONTROL_CHARACTER']             = Strings.CONTROL_CHARACTER;
	exports['strings']['SPACE']                         = Strings.SPACE;
	exports['strings']['NOT_SPACE']                     = Strings.NOT_SPACE;
	exports['strings']['WHITE_SPACE']                   = Strings.WHITE_SPACE;
	exports['strings']['WHITE_SPACES']                  = Strings.WHITE_SPACES;
	exports['strings']['ZERO_WIDTH_SPACE']              = Strings.ZERO_WIDTH_SPACE;
	exports['strings']['NON_BREAKING_SPACE']            = Strings.NON_BREAKING_SPACE;
	exports['strings']['WORD_BOUNDARY']                 = Strings.WORD_BOUNDARY;
	exports['strings']['WORD_BOUNDARY_FROM_END']        = Strings.WORD_BOUNDARY_FROM_END;
	exports['strings']['WORD_BREAKING_CHARACTER']       = Strings.WORD_BREAKING_CHARACTER;
	exports['strings']['TERMINAL_WHITE_SPACES']         = Strings.TERMINAL_WHITE_SPACES;
	exports['strings']['ZERO_WIDTH_CHARACTERS']         = Strings.ZERO_WIDTH_CHARACTERS;
	exports['strings']['WHITE_SPACE_CHARACTERS']        = Strings.WHITE_SPACE_CHARACTERS;
	exports['strings']['WORD_BREAKING_CHARACTERS']      = Strings.WORD_BREAKING_CHARACTERS;
	exports['strings']['NON_BREAKING_SPACE_CHARACTERS'] = Strings.NON_BREAKING_SPACE_CHARACTERS;

	exports['transform'] = new Object();
	exports['transform']['html']   = Transform.html;
	exports['transform']['plain']  = Transform.plain;
	exports['transform']['msword'] = Transform.msword;

	exports['traversing'] = new Object();
	exports['traversing']['next']   = Traversing.next;
	exports['traversing']['prev']   = Traversing.prev;
	exports['traversing']['expand'] = Traversing.expand;

	exports['typing'] = new Object();
	exports['typing']['handle']  = Typing.handle;
	exports['typing']['actions'] = Typing.actions;

	exports['undo'] = new Object();
	exports['undo']['Context'] = Undo.Context;
	exports['undo']['enter']   = Undo.enter;
	exports['undo']['close']   = Undo.close;
	exports['undo']['leave']   = Undo.leave;
	exports['undo']['capture'] = Undo.capture;
	exports['undo']['undo']    = Undo.undo;
	exports['undo']['redo']    = Undo.redo;

	exports['MutationTrees'] = new Object();
	exports['MutationTrees'].split  = MutationTrees.split;
	exports['MutationTrees'].insert = MutationTrees.insert;
	exports['MutationTrees'].create = MutationTrees.create;
	exports['MutationTrees'].update = MutationTrees.update;

	return exports;
});
