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
	'keys',
	'maps',
	'mouse',
	'mutation',
	'overrides',
	'paste',
	'paste-transform-html',
	'paste-transform-plaintext',
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
	'ms-word-transform',
	'ms-word-transform-utils'
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
	Paste,
	PasteTransform,
	PasteTransformPlainText,
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
	WordTransform,
	WordTransformUtils
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
	exports['keys'] = Keys;
	exports['maps'] = Maps;
	exports['mouse'] = Mouse;
	exports['mutation'] = Mutation;
	exports['overrides'] = Overrides;
	exports['paste'] = Paste;
	exports['pasteTransform'] = PasteTransform;
	exports['pasteTransformPlainText'] = PasteTransformPlainText;
	exports['predicates'] = Predicates;
	exports['ranges'] = Ranges;
	exports['selectionchange'] = SelectionChange;
	exports['selections'] = Selections;
	exports['strings'] = Strings;
	exports['traversing'] = Traversing;
	exports['trees'] = Trees;
	exports['typing'] = Typing;
	exports['undo'] = Undo;
	exports['wordTransform'] = WordTransform;
	exports['wordTransformUtils'] = WordTransformUtils;
	exports['xhtml'] = Xhtml;

	return exports;
});
