/*!
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Aloha Editor 2.0.0 - JavaScript Content Editing Library       │
 * ├───────────────────────────────────────────────────────────────┤
 * │ Copyright © 2010-2014 Gentics Software GmbH, Vienna, Austria. │
 * ├───────────────────────────────────────────────────────────────┤
 * │ aloha-editor.org | github.com/alohaeditor                     │
 * └───────────────────────────────────────────────────────────────┘
 */
define([
	'api',
	'dom',
	'links',
	'arrays',
	'blocks',
	'dragdrop',
	'editables',
	'boundaries',
	'autoformat',
	'overrides',
	'events',
	'functions',
	'keys',
	'maps',
	'mouse',
	'paste',
	'typing',
	'selections'
], function (
	Api,
	Dom,
	Links,
	Arrays,
	Blocks,
	DragDrop,
	Editables,
	Boundaries,
	AutoFormat,
	Overrides,
	Events,
	Fn,
	Keys,
	Maps,
	Mouse,
	Paste,
	Typing,
	Selections
) {
	'use strict';

	function editor(nativeEvent, event) {
		event = event || Selections.selectionEvent(editor, nativeEvent);
		if (event) {
			event = Fn.comp.apply(editor.stack, editor.stack)(event);
			var selection = Selections.update(event);
			if (selection) {
				editor.selection = Maps.merge(selection);
			}
		}
	}

	editor.dnd       = DragDrop.Context();
	editor.selection = null;
	editor.editables = {};
	editor.stack     = [
		Selections.handleSelections,
		Links.handleLinks,
		Typing.handleTyping,
		AutoFormat.handleAutoFormat,
		Blocks.handleBlocks,
		DragDrop.handleDragDrop,
		Paste.handlePaste,
		Keys.handleKeys,
		Mouse.handleMouse
	];

	function documents(editor) {
		var docs = [];
		for (var expando in editor.editables) {
			docs.push(editor.editables[expando].elem.ownerDocument);
		}
		return docs;
	}

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as alias for aloha.aloha.
	 *
	 * @param    {!Element} element
	 * @parma    {Object=}  options
	 * @return   {Editable}
	 * @memberOf aloha
	 */
	function aloha(element, options) {
		var doc = element.ownerDocument;
		if (!Arrays.contains(documents(editor), doc)) {
			Events.setup(doc, editor);
			Events.add(Dom.documentWindow(doc), 'resize', editor);
			editor.selection = Selections.Context(doc);
		}
		var editable = Editables.create(editor, element, options);
		Blocks.initializeBlocks(editable.elem);
		return editable;
	}

	/**
	 * Destroys an editable.
	 *
	 * @param    {!Element} element
	 * @return   {Editable}
	 * @memberOf aloha
	 */
	function mahalo(element) {
		return Editables.destroy(editor, element);
	}

	Api['aloha'] = aloha;
	Api['mahalo'] = mahalo;
	Api['editor'] = editor;
	Api['buildcommit'] = '%buildcommit%';
	window['aloha'] = Maps.extend(aloha, Api);

	var egg = '%c       _       _                      _ _ _\n'
	        + '  __ _%c| |%c ___ %c| |%c__   __ _    ___  __%c| (_) |%c_ ___  _ __  '
	        + ' %cAloha! \n'
	        + ' %c/ _` | |/ _ \\| \'_ \\%c %c/ _` |%c  %c/ _ \\/ _` | | __/ _ \\| \'__|%c '
	        + ' %cHelp us shape the future of content editing on the web! \n'
	        + '%c| (%c_%c| | | (%c_%c) | |%c %c| | (%c_%c| |%c %c|  __/ (%c_%c| | | %c||%c (%c_%c) | |%c    '
	        + ' %cJoin the team at http://github.com/alohaeditor \n'
	        + ' %c\\__,_|_|\\___/|_|%c %c|_|\\__,_|%c  %c\\___|\\__,_|_|\\__\\___/|_|%c.org'
			+ ' %c♥';

	var w = 'color: #f34;';
	var x = 'color: #555;';
	var y = 'color: #bbb;';
	var z = 'color: #bbb; background: #f8f6f5;';
	console.log(
		egg,
		y,z,y,z,y,z,y,x,
		z,y,z,y,z,y,x,
		z,y,z,y,z,y,z,y,z,y,z,y,z,y,z,y,z,y,x,
		z,y,z,y,z,y,w
	);

	return aloha;
});
