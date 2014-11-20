/**
 * editables.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace editables
 */
define([
	'dom',
	'maps',
	'undo',
	'content',
	'boundaries'
], function (
	Dom,
	Maps,
	Undo,
	Content,
	Boundaries
) {
	'use strict';

	/**
	 * Returns an editable object for the given editable DOM element.
	 *
	 * @param  {Editor}  editor
	 * @param  {Element} elem
	 * @return {?Editable}
	 * @memberOf editables
	 */
	function fromElem(editor, elem) {
		return editor.editables[Dom.ensureExpandoId(elem)];
	}

	/**
	 * Returns an editable object for the given boundary.
	 *
	 * @param  {Editor}   editor
	 * @param  {Boundary} boundary
	 * @return {?Editable}
	 * @memberOf editables
	 */
	function fromBoundary(editor, boundary) {
		var container = Boundaries.container(boundary);
		var elem = Dom.upWhile(container, function (node) {
			return !editor.editables[Dom.ensureExpandoId(node)];
		});
		return elem && fromElem(editor, elem);
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editables
	 */
	function Editable(elem) {
		Dom.addClass(elem, 'aloha-editable');
		if (!Dom.getStyle(elem, 'min-height')) {
			Dom.setStyle(elem, 'min-height', '1em');
		}
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

	var DEFAULTS = {
		defaultBlock      : 'p',
		allowedStyles     : Content.allowedStyles(),
		allowedAttributes : Content.allowedAttributes(),
		disallowedNodes   : Content.disallowedNodes(),
		nodeTranslations  : Content.nodeTranslations()
	};

	/**
	 * Initializes an editable.
	 *
	 * @param  {function(AlohaEvent)} editor
	 * @param  {Element}              element
	 * @param  {Object}               options
	 * @return {Editable}
	 * @memberOf editables
	 */
	function create(editor, element, options) {
		var editable = Editable(element);
		Dom.setStyle(element, 'cursor', 'text');
		editable.settings = Maps.merge({}, DEFAULTS, options);
		assocIntoEditor(editor, editable);
		Undo.enter(editable.undoContext, {
			meta             : {type: 'external'},
			partitionRecords : true
		});
		return editable;
	}

	/**
	 * This function is missing documentation.
	 * @TODO Complete documentation.
	 *
	 * @memberOf editables
	 */
	function destroy(editor, element)  {
		var editable = fromElem(editor, element);
		close(editable);
		dissocFromEditor(editor, editable);
		return editable;
	}

	return {
		Editable         : Editable,
		fromElem         : fromElem,
		fromBoundary     : fromBoundary,
		assocIntoEditor  : assocIntoEditor,
		dissocFromEditor : dissocFromEditor,
		close            : close,
		create           : create,
		destroy          : destroy
	};
});
