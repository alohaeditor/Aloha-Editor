/** Aloha Editor | Version 1.0 | github.com/alohaeditor */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name aloha.min.js
// @check_types
// ==/ClosureCompiler==

define([
	'exports',
	'boundaries',
	'blocks',
	'dragdrop',
	'editables',
	'events',
	'functions',
	'keys',
	'maps',
	'mouse',
	'paste',
	'ranges',
	'selections',
	'selection-change',
	'typing',
	'undo'
], function Aloha(
	Api,
	Boundaries,
	Blocks,
	DragDrop,
	Editables,
	Events,
	Fn,
	Keys,
	Maps,
	Mouse,
	Paste,
	Ranges,
	Selections,
	SelectionChange,
	Typing,
	Undo
) {
	'use strict';

	function setSelection(event) {
		if (event.range) {
			Ranges.select(event.range);
		}
		return event;
	}

	function editor(nativeEvent, custom) {
		var alohaEvent = custom || {'nativeEvent' : nativeEvent};
		alohaEvent.editor = editor;
		Fn.comp(
			setSelection,
			//Selections.handle,
			Typing.handle,
			Blocks.handle,
			DragDrop.handle,
			Paste.handle,
			function (alohaEvent) {
				alohaEvent.editable = alohaEvent.editor.editables[1];
				return alohaEvent;
			},
			Mouse.handle,
			Keys.handle
		)(alohaEvent);
	}

	editor.editables = {};
	editor.BLOCK_CLASS = 'aloha-block';
	editor.CARET_CLASS = 'aloha-caret';
	editor.selectionContext = Selections.Context();

	Events.setup(editor, document);

	SelectionChange.addHandler(document, SelectionChange.handler(
		Fn.partial(Boundaries.get, document),
		Boundaries.fromEndOfNode(document),
		function (boundaries, event) {
			editor(event);
		}
	));

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 */
	function aloha(elem) {
		var editable = Editables.Editable(elem);
		editable.overrides = [];
		editable.settings = {
			defaultBlockNodeName: 'div'
		};
		Editables.assocIntoEditor(editor, editable);
		elem.setAttribute('contentEditable', 'true');
		Undo.enter(editable.undoContext, {
			meta: {type: 'external'},
			partitionRecords: true
		});
		editor(null, {
			'type'     : 'aloha',
			'editable' : editable
		});
	}

	function mahalo(elem) {
		var editable = Editables.fromElem(editor, elem);
		Editables.close(editable);
		Editables.dissocFromEditor(editor, editable);
		elem.removeAttribute('contentEditable');
		editor(null, {
			'type'     : 'mahalo',
			'editable' : editable
		});
	}

	Api['aloha'] = aloha;
	Api['mahalo'] = mahalo;

	aloha = Maps.extend(aloha, Api);

	window['aloha'] = aloha;

	var teaser = "       _       _                      _ _ _              \n"
	           + "  __ _| | ___ | |__   __ _    ___  __| (_) |_ ___  _ __  \n"
	           + " / _` | |/ _ \\| '_ \\ / _` |  / _ \\/ _` | | __/ _ \\| '__| \n"
	           + "| (_| | | (_) | | | | (_| | |  __/ (_| | | || (_) | |    \n"
	           + " \\__,_|_|\\___/|_| |_|\\__,_|  \\___|\\__,_|_|\\__\\___/|_|.org\n"
	           + "\n"
	           + "Aloha, there!\n"
	           + "\n"
	           + "Would you like to contribute to shaping the future of "
	           + "content editing on the web?\n"
	           + "\n"
	           + "Join the team at http://github.com/alohaeditor!";

	console.log(teaser);

	return aloha;
});
