/* editables.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['arrays', 'maps', 'dom', 'functions', 'traversing', 'undo'], function (Arrays, Maps, Dom, Fn, Traversing, Undo) {
	'use strict';
	
	function fromElem(editor, elem) {
		return editor.editables[Dom.ensureExpandoId(elem)];
	}

	function fromBoundary(editor, boundary) {
		var node = Dom.nodeAtBoundary(boundary);
		var elem = Traversing.upWhile(node, function (node) {
			return !editor.editables[Dom.ensureExpandoId(node)];
		});
		return elem ? fromElem(editor, elem) : null;
	}

	function Editable(elem) {
		var undoContext = Undo.Context(elem);
		var id = Dom.ensureExpandoId(elem);
		var editable = {
			id: id,
			elem: elem,
			undoContext: undoContext
		};
		return editable;
	}

	function dissocFromEditor(editor, editable) {
		delete editor.editables[editable.id];
	}

	function assocIntoEditor(editor, editable) {
		editor.editables[editable.id] = editable;
	}

	function close(editable) {
		Undo.close(editable.undoContext);
	}

	var exports = {
		Editable: Editable,
		fromElem: fromElem,
		fromBoundary: fromBoundary,
		assocIntoEditor: assocIntoEditor,
		dissocFromEditor: dissocFromEditor,
		close: close
	};

	return exports;
});
