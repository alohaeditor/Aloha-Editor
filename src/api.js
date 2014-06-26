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
	'boundary-markers',
	'browsers',
	'colors',
	'content',
	'delayed-map',
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
	'links',
	'lists',
	'maps',
	'mouse',
	'mutation',
	'overrides',
	'paste',
	'paths',
	'ranges',
	'record',
	'selection-change',
	'selections',
	'strings',
	'transform',
	'traversing',
	'typing',
	'undo'
], function (
	Arrays,
	Blocks,
	Boromir,
	Boundaries,
	Boundarymarkers,
	Browsers,
	Colors,
	Content,
	DelayedMap,
	Dom,
	DomXhtml,
	DragDrop,
	Editables,
	Editing,
	Ephemera,
	Events,
	Fn,
	Html,
	Images,
	Keys,
	Links,
	Lists,
	Maps,
	Mouse,
	Mutation,
	Overrides,
	Paste,
	Paths,
	Ranges,
	Record,
	SelectionChange,
	Selections,
	Strings,
	Transform,
	Traversing,
	Trees,
	Typing,
	Undo
) {
	'use strict';

	var exports = {};

	exports['Boromir'] = Boromir;
	exports['DelayedMap'] = DelayedMap;
	exports['Record'] = Record;
	exports['arrays'] = Arrays;
	exports['blocks'] = Blocks;
	exports['boundaries'] = Boundaries;
	exports['boundarymarkers'] = Boundarymarkers;
	exports['browsers'] = Browsers;
	exports['colors'] = Colors;
	exports['content'] = Content;
	exports['dom'] = Dom;
	exports['dragdrop'] = DragDrop;
	exports['editables'] = Editables;
	exports['editing'] = Editing;
	exports['ephemera'] = Ephemera;
	exports['events'] = Events;
	exports['fn'] = Fn;
	exports['html'] = Html;
	exports['images'] = Images;
	exports['keys'] = Keys;
	exports['links'] = Links;
	exports['lists'] = Lists;
	exports['maps'] = Maps;
	exports['mouse'] = Mouse;
	exports['mutation'] = Mutation;
	exports['overrides'] = Overrides;
	exports['paste'] = Paste;
	exports['paths'] = Paths;
	exports['ranges'] = Ranges;
	exports['selectionchange'] = SelectionChange;
	exports['selections'] = Selections;
	exports['strings'] = Strings;
	exports['transform'] = Transform;
	exports['traversing'] = Traversing;
	exports['typing'] = Typing;
	exports['undo'] = Undo;
	exports['xhtml'] = DomXhtml;

	return exports;
});
