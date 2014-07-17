/**
 * editables.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'dom',
	'undo',
	'boundaries'
], function (
	Dom,
	Undo,
	Boundaries
) {
	'use strict';

	/**
	 * Returns an editable object for the given editable DOM element.
	 *
	 * @param  {Editor}  editor
	 * @param  {Element} elem
	 * @return {?Editable}
	 */
	function fromElem(editor, elem) {
		return editor.editables[Dom.ensureExpandoId(elem)];
	}

	/**
	 * Returns an editable object for the given boundary.
	 *
	 * @param  {Editor}    editor
	 * @param  {Boundary} boundary
	 * @return {?Editable}
	 */
	function fromBoundary(editor, boundary) {
		var container = Boundaries.container(boundary);
		var elem = Dom.upWhile(container, function (node) {
			return !editor.editables[Dom.ensureExpandoId(node)];
		});
		return elem && fromElem(editor, elem);
	}

	function Editable(elem) {
		Dom.addClass(elem, 'aloha-editable');
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
		Undo.close(editable['undoContext']);
	}

	/**
	 * Initializes an editable.
	 *
	 * @param  {function(AlohaEvent)} editor
	 * @param  {Element}              element
	 * @param  {string}               defaultBlock
	 * @return {Editable}
	 */
	function create(editor, element, defaultBlock) {
		var editable = Editable(element);
		Dom.setStyle(element, 'cursor', 'text');
		editable.settings = {defaultBlockNodeName: defaultBlock};
		assocIntoEditor(editor, editable);
		Undo.enter(editable.undoContext, {
			meta             : {type: 'external'},
			partitionRecords : true
		});
		return editable;
	}

	/**
	 * Associates an editable to the given AlohaEvent.
	 *
	 * Require:
	 * 		type
	 * 		editor
	 * Provides:
	 * 		editable
	 *
	 * @param  {AlohaEvent} event
	 * @return {AlohaEvent}
	 */
	function handle(event) {
		if ('aloha' === event.type) {
			event.editable = create(
				event.editor,
				event.element,
				event.defaultBlock
			);
		} else if (event.range && Dom.isEditableNode(event.range.commonAncestorContainer)) {
			event.editable = fromBoundary(
				event.editor,
				Boundaries.fromRangeStart(event.range)
			);
		}
		return event;
	}

	return {
		Editable         : Editable,
		fromElem         : fromElem,
		fromBoundary     : fromBoundary,
		assocIntoEditor  : assocIntoEditor,
		dissocFromEditor : dissocFromEditor,
		close            : close,
		handle           : handle,
		create           : create
	};
});
