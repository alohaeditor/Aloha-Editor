/**
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Aloha Editor 2.0.0 - JavaScript Content Editing Library       │
 * ├───────────────────────────────────────────────────────────────┤
 * │ Copyright © 2010-2015 Gentics Software GmbH, Vienna, Austria. │
 * ├───────────────────────────────────────────────────────────────┤
 * │ aloha-editor.org | github.com/alohaeditor                     │
 * └───────────────────────────────────────────────────────────────┘
 * @preserve
 */
/**
 * Aloha Editor API root.
 * @namespace aloha
 */
define([
	'api',
	'dom',
	'links',
	'arrays',
	'blocks',
	'dragdrop',
	'editables',
	'autoformat',
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
	AutoFormat,
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

	/**
	 * Editor function/namespace.
	 *
	 * This is where state is surfaced.
	 *
	 * @param {Event}      nativeEvent
	 * @param {AlohaEvent} event
	 * @memberOf aloha
	 */
	function editor(nativeEvent, event) {
		event = event || Selections.selectionEvent(editor, nativeEvent);
		if (event) {
			event = Fn.comp.apply(editor.stack, editor.stack)(event);
			var selection = Selections.update(event);
			if (selection) {
				editor.selection = Maps.merge(selection);
			}
			if (event.dnd) {
				editor.dnd = Maps.merge(event.dnd);
			}
		}
	}

	editor.dnd       = null;
	editor.selection = null;
	editor.editables = {};
	
	/**
	 * Aloha Editor stack.
	 *
	 * Aloha Editor’s aloha.editor.stack uses the middleware pattern to thread a
	 * browser event through a series of ordered functions called handlers. Each
	 * handler receives an event (a map of properties), operates on it, and
	 * returns an potentially modified version of that object.
	 *
	 * Order matters.
	 *
	 * It is important to remember that when it comes to middleware order
	 * matters. Middlewares that depend on particular properties to be in the
	 * event object, need to be ordered after middleware that provide those
	 * required properties. e.g.: handleKeys must be ordered before
	 * handleTyping.
	 *
	 * Where’s the `next()` argument?
	 *
	 * Unlike other middleware implementations, Aloha Editor’s does not require
	 * calling a next() function to continue the execution of the middlewares
	 * function chain. This is because aloha.editor.middleware, assume
	 * synchronous execution for the purpose of processing editing events.
	 *
	 * @type {Array.<Function(AlohaEvent):AlohaEvent>}
	 * @memberOf aloha
	 */
	editor.stack     = [
		Selections.middleware,
		Links.middleware,
		Typing.middleware,
		AutoFormat.middleware,
		Blocks.middleware,
		DragDrop.middleware,
		Paste.middleware,
		Keys.middleware,
		Mouse.middleware
	];

	function documents(editor) {
		var docs = [];
		for (var expando in editor.editables) {
			docs.push(editor.editables[expando].elem.ownerDocument);
		}
		return docs;
	}

	/**
	 * Transforms the given element into an Aloha editable region.
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

	var a = 'color: #7ad; background: #f8f6f5; padding: 5px 0;';
	var b = 'color: #aaa; background: #f8f6f5; padding: 5px 0;';
	console.log('%c ✔%c Invoke Aloha by calling: %caloha(document.querySelector(".editable")) ', a, b, a);

	return aloha;
});
