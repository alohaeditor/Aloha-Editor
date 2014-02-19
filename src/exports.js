/**
 * exports.js is part of Aloha Editor project http://aloha-editor.org
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
	'image',
	'keys',
	'list',
	'list/list-selection',
	'maps',
	'mouse',
	'mutation',
	'overrides',
	'paths',
	'paste',
	'predicates',
	'ranges',
	'selection-change',
	'selections',
	'stable-range',
	'strings',
	'dom/traversing',
	'trees',
	'typing',
	'undo',
	'transform/ms-word/utils',
	'transform'
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
	Image,
	Keys,
	List,
	ListSelection,
	Maps,
	Mouse,
	Mutation,
	Overrides,
	Paths,
	Paste,
	Predicates,
	Ranges,
	SelectionChange,
	Selections,
	StableRange,
	Strings,
	Traversing,
	Trees,
	Typing,
	Undo,
	WordTransformUtils,
	Transform
) {
	'use strict';

	var exports = {};

	exports['arrays'] = Arrays;
	exports['blocks'] = Blocks;
	exports['boundaries'] = Boundaries;
	exports['boundarymarkers'] = Boundarymarkers;
	exports['browsers'] = Browsers;
	exports['colors'] = Colors;
	exports['content'] = Content;
	exports['cursors'] = Cursors;
	exports['dom'] = Dom;
	exports['dragdrop'] = DragDrop;
	exports['editables'] = Editables;
	exports['editing'] = Editing;
	exports['ephemera'] = Ephemera;
	exports['events'] = Events;
	exports['fn'] = Fn;
	exports['html'] = Html;
	exports['image'] = Image;
	exports['keys'] = Keys;
	exports['list'] = List;
	exports['listselection'] = ListSelection;
	exports['maps'] = Maps;
	exports['mouse'] = Mouse;
	exports['mutation'] = Mutation;
	exports['overrides'] = Overrides;
	exports['paths'] = Paths;
	exports['paste'] = Paste;
	exports['predicates'] = Predicates;
	exports['ranges'] = Ranges;
	exports['selectionchange'] = SelectionChange;
	exports['selections'] = Selections;
	exports['strings'] = Strings;
	exports['transform'] = Transform
	exports['traversing'] = Traversing;
	exports['trees'] = Trees;
	exports['typing'] = Typing;
	exports['undo'] = Undo;
	exports['wordTransformUtils'] = WordTransformUtils;
	exports['xhtml'] = Xhtml;

	return exports;
});
