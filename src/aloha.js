/** Aloha Editor | Version 1.0 | github.com/alohaeditor */
alert('123test?!')
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
	'dom',
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
], function (
	Api,
	Boundaries,
	Blocks,
	Dom,
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

	/**
	 * Sets the given AlohaEvent's range to the document.
	 *
	 * @private
	 * @param  {AlohaEvent} alohaEvent
	 * @return {AlohaEvent}
	 */
	function setSelection(alohaEvent) {
		if (alohaEvent.range && alohaEvent.editable) {
			Ranges.select(alohaEvent.range);
		}
		return alohaEvent;
	}

	function editor(nativeEvent, custom) {
		var alohaEvent = custom || {'nativeEvent' : nativeEvent};
		alohaEvent.editor = editor;
		alohaEvent = Fn.comp.apply(editor.stack, editor.stack)(alohaEvent);
		setSelection(alohaEvent);
	}

	editor.editables = {};
	editor.BLOCK_CLASS = 'aloha-block';
	editor.CARET_CLASS = 'aloha-caret';
	editor.selectionContext = Selections.Context(document);
	editor.stack = [
		Selections.handle,
		Typing.handle,
		Blocks.handle,
		DragDrop.handle,
		Paste.handle,
		Editables.handle,
		Mouse.handle,
		Keys.handle
	];

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
	Api['editor'] = editor;

	aloha = Maps.extend(aloha, Api);

	window['aloha'] = aloha;

	var egg = '%c'
	        + '       _       _                      _ _ _\n'
	        + '  __ _| | ___ | |__   __ _    ___  __| (_) |_ ___  _ __\n'
	        + ' / _` | |/ _ \\| \'_ \\ / _` |  / _ \\/ _` | | __/ _ \\| \'__|\n'
	        + '| (_| | | (_) | | | | (_| | |  __/ (_| | | || (_) | |\n'
	        + ' \\__,_|_|\\___/|_| |_|\\__,_|  \\___|\\__,_|_|\\__\\___/|_|.org\n'
	        + '\n'
	        + '%c'
	        + ' Aloha! '
	        + '\n'
	        + ' Help us shape the future of content editing on the web! '
	        + '\n'
	        + ' Join the team at %c http://github.com/alohaeditor ♥ ';

	console.log(
		egg,
		'color: #09d;',
		'font-size: 14px; background: #09d; color: #fff; padding: 0.5em 0; line-height: 2em;',
		'font-size: 14px; background: #fe7; color: #111; padding: 0.5em 0; line-height: 2em;'
	);

	return aloha;
});
