/** Aloha Editor | Version 1.0 | github.com/alohaeditor */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name aloha.min.js
// @check_types
// ==/ClosureCompiler==

define([
	'arrays',
	'boundaries',
	'boundary-markers',
	'browser',
	'caret',
	'content',
	'colors',
	'cursors',
	'dom',
	'predicates',
	'dom-to-xhtml',
	'editing',
	'ephemera',
	'events',
	'functions',
	'html',
	'mouse',
	'pubsub',
	'keys',
	'maps',
	'ranges',
	'strings',
	'traversing',
	'typing',
	'undo',
	'editables'
], function Aloha(
	Arrays,
	Boundaries,
	Boundarymarkers,
	Browser,
	Caret,
	Content,
	Colors,
	Cursors,
	Dom,
	Predicates,
	Xhtml,
	Editing,
	Ephemera,
	Events,
	Fn,
	Html,
	Mouse,
	Pubsub,
	Keys,
	Maps,
	Ranges,
	Strings,
	Traversing,
	Typing,
	Undo,
	Editables
) {
	'use strict';

	Events.add(document, 'keyup',     Keys.onUp);
	Events.add(document, 'keydown',   Keys.onDown);
	Events.add(document, 'keypress',  Keys.onPress);
	Events.add(document, 'mouseup',   Mouse.onUp);
	Events.add(document, 'mousedown', Mouse.onDown);
	Events.add(document, 'mousemove', Mouse.onMove);

	var editor = {
		settings: {
			defaultBlockNodeName: 'div'
		},
		overrides: [],
		editables: {}
	};

	Keys.down(function (msg) {
		Typing.down(msg, editor);
	});

	Keys.press(function (msg) {
		Typing.press(msg, editor);
	});

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 */
	function aloha(elem) {
		var editable = Editables.Editable(elem);
		Editables.assocIntoEditor(editor, editable);
		elem.setAttribute('contentEditable', 'true');
		Undo.enter(editable.undoContext, {
			meta: {type: 'external'},
			partitionRecords: true
		});
	}

	function mahalo(elem) {
		var editable = Editables.fromElem(editor, elem);
		Editables.close(editable);
		Editables.dissocFromEditor(editor, editable);
		elem.removeAttribute('contentEditable');
	}

	aloha['aloha'] = aloha;
	aloha['mahalo'] = mahalo;
	aloha['arrays'] = Arrays;
	aloha['boundaries'] = Boundaries;
	aloha['boundarymarkers'] = Boundarymarkers;
	aloha['browser'] = Browser;
	aloha['caret'] = Caret;
	aloha['content'] = Content;
	aloha['colors'] = Colors;
	aloha['cursors'] = Cursors;
	aloha['dom'] = Dom;
	aloha['predicates'] = Predicates;
	aloha['editing'] = Editing;
	aloha['ephemera'] = Ephemera;
	aloha['events'] = Events;
	aloha['fn'] = Fn;
	aloha['html'] = Html;
	aloha['typing'] = Typing;
	aloha['keys'] = Keys;
	aloha['mouse'] = Mouse;
	aloha['maps'] = Maps;
	aloha['pubsub'] = Pubsub;
	aloha['ranges'] = Ranges;
	aloha['strings'] = Strings;
	aloha['traversing'] = Traversing;
	aloha['xhtml'] = Xhtml;
	aloha['undo'] = Undo;

	window['aloha'] = aloha;

	return aloha;
});
