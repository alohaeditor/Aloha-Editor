/**
 * editables.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'maps',
	'dom',
	'boundaries',
	'functions',
	'dom/traversing',
	'undo'
], function Editables(
	Arrays,
	Maps,
	Dom,
	Boundaries,
	Fn,
	Traversing,
	Undo
) {
	'use strict';

	function fromElem(editor, elem) {
		return editor.editables[Dom.ensureExpandoId(elem)];
	}

	function fromBoundary(editor, boundary) {
		var container = Boundaries.container(boundary);
		var elem = Traversing.upWhile(container, function (node) {
			return !editor.editables[Dom.ensureExpandoId(node)];
		});
		return elem && fromElem(editor, elem);
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

	return {
		Editable         : Editable,
		fromElem         : fromElem,
		fromBoundary     : fromBoundary,
		assocIntoEditor  : assocIntoEditor,
		dissocFromEditor : dissocFromEditor,
		close            : close
	};
});
