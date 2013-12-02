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
	'blocks',
	'dragdrop',
	'editables',
	'events',
	'functions',
	'keys',
	'mouse',
	'ranges',
	'selections',
	'typing',
	'undo'
], function Aloha(
	Api,
	Blocks,
	DragDrop,
	Editables,
	Events,
	Fn,
	Keys,
	Mouse,
	Ranges,
	Selections,
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
			Selections.handle,
			Typing.handle,
			Blocks.handle,
			DragDrop.handle,
			Mouse.handle,
			Keys.handle
		)(alohaEvent);
	}

	editor.editables = {};
	editor.BLOCK_CLASS = 'aloha-block';
	editor.CARET_CLASS = 'aloha-caret';
	editor.selectionContext = Selections.Context();

	Events.setup(editor, document);

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
		//elem.setAttribute('contentEditable', 'true');
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
	window['aloha'] = Api;

	return Api;
});
