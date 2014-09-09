/** Aloha Editor | Version 1.0 | github.com/alohaeditor */
define([
	'api',
	'dom',
	'links',
	'blocks',
	'dragdrop',
	'editables',
	'autoformat',
	'boundaries',
	'events',
	'functions',
	'keys',
	'maps',
	'mouse',
	'paste',
	'selections',
	'typing'
], function (
	Api,
	Dom,
	Links,
	Blocks,
	DragDrop,
	Editables,
	AutoFormat,
	Boundaries,
	Events,
	Fn,
	Keys,
	Maps,
	Mouse,
	Paste,
	Selections,
	Typing
) {
	'use strict';

	var doc = document;
	var win = Dom.documentWindow(doc);

	var MOUSE_EVENT = {
		'mousemove'      : true,
		'mousedown'      : true,
		'mouseup'        : true,
		'click'          : true,
		'dblclick'       : true,
		'aloha.dblclick' : true,
		'aloha.tplclick' : true
	};

	var CLICKING_EVENT = {
		'mousedown'      : true,
		'mouseup'        : true,
		'click'          : true,
		'dblclick'       : true,
		'aloha.dblclick' : true,
		'aloha.tplclick' : true
	};

	var MUTLICLICK_EVENT = {
		'dblclick'       : true,
		'aloha.dblclick' : true,
		'aloha.tplclick' : true
	};

	/**
	 * Event cycle:
	 * mousedown
	 * mouseup
	 * click
	 * mousedown -> aloha.dblclick
	 * mouseup
	 * click
	 * dblclick
	 * mousedown -> aloha.tplclick
	 * mouseup
	 * click
	 */
	function processClicking(event, selection) {
		if ('mousedown' !== event.type && 'dbclick' !== event.type && 'aloha.dblclick' !== event.type) {
			return;
		}
		var time = new Date();
		var elapsed = time - selection.clickTimer;
		var multiclick = selection.multiclick;
		selection.multiclick = null;
		selection.clickTimer = time;
		if (elapsed > 500) {
			return;
		}
		if (!selection.event) {
			return;
		}
		if (selection.event.clientX !== event.clientX) {
			return;
		}
		if (selection.event.clientY !== event.clientY) {
			return;
		}
		return MUTLICLICK_EVENT[multiclick] ? 'aloha.tplclick' : 'aloha.dblclick';
	}

	function getDragging(current, selection) {
		if (selection.dragging) {
			return selection.dragging;
		}
		if ('mousemove' !== current) {
			return null;
		}
		var last = selection.lastMouseEvent;
		if ('mousedown'       === last ||
		    'aloha.dblclick'  === last ||
		    'aloha.tplclick'  === last) {
			return last;
		}
		return null;
	}

	/**
	 * Creates an event object that will contain all the following properties:
	 *
	 *		type
	 *		nativeEvent
	 *		editable
	 *		selection
	 *		dnd
	 *		preventSelection
	 *
	 * @param  {!Editor} editor
	 * @param  {!Event}  event
	 * @return {?Event}
	 */
	function createEvent(editor, event) {
		var type = event.type;
		var selection = editor.selection;
		var isClicking = CLICKING_EVENT[type];
		var dragging = getDragging(type, selection);
		var isDragStart = dragging && dragging !== selection.dragging;
		if (isClicking || isDragStart) {
			// Because otherwise if the mouse position is over the caret element
			// Boundaries.fromPosition() will compute the boundaries to be
			// inside the absolutely positioned caret element, which is not we
			// want
			Dom.setStyle(selection.caret, 'display', 'none');
		}
		if (isDragStart) {
			selection.dragging = dragging;
		}
		if ('mousemove' === type) {
			return null;
		}
		if ('mouseup' === type && selection.dragging) {
			type = 'aloha.mouseup';
			selection.dragging = null;
		}
		if (isClicking) {
			type = processClicking(event, selection) || type;
		}
		if (MUTLICLICK_EVENT[type]) {
			selection.multiclick = type;
		}
		if (MOUSE_EVENT[type]) {
			selection.lastMouseEvent = type;
		}
		var doc = event.target.document || event.target.ownerDocument;
		var boundaries = isClicking
		               ? Boundaries.fromPosition(event.clientX, event.clientY, doc)
		               : Boundaries.get(doc);
		if (!boundaries) {
			return null;
		}
		var cac = Boundaries.commonContainer(boundaries[0], boundaries[1]);
		if (!Dom.isEditableNode(cac)) {
			// Because if we are partly inside of an editable, we don't want the
			// back-button to unload the page
			if ('keydown' === type) {
				if (Dom.isEditableNode(Boundaries.container(boundaries[0]))
				 || Dom.isEditableNode(Boundaries.container(boundaries[1]))) {
					Events.preventDefault(event);
				}
			}
			return null;
		}
		var editable = Editables.fromBoundary(editor, boundaries[0]);
		if (!editable) {
			return null;
		}
		selection.previousBoundaries = selection.boundaries;
		selection.boundaries = boundaries;
		selection.event = event;
		return {
			// Because sometimes an interaction going through the editor pipe
			// should not result in an updated selection. eg: When inserting a
			// link you want to focus on an input field in the ui.
			preventSelection : false,
			type             : type,
			nativeEvent      : event,
			editable         : editable,
			selection        : selection,
			dnd              : editor.dnd
		};
	}

	function editor(nativeEvent) {
		var event = createEvent(editor, nativeEvent);
		if (event) {
			event = Fn.comp.apply(editor.stack, editor.stack)(event);
			Selections.update(event);
		}
	}

	editor.BLOCK_CLASS = 'aloha-block';
	editor.CARET_CLASS = 'aloha-caret';
	editor.selection = Selections.Context(doc);
	editor.dnd = DragDrop.Context();
	editor.editables = {};
	editor.stack = [
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

	Events.setup(doc, editor);
	Events.add(win, 'resize', editor);

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 *
	 * @param  {!Element} element
	 * @parma  {Object=}  options
	 * @return {Editable}
	 */
	function aloha(element, options) {
		return Editables.create(editor, element, options);
	}

	/**
	 * Destroys an editable.
	 *
	 * @param {!Element} element
	 * @return {Editable}
	 */
	function mahalo(element) {
		return Editables.destroy(editor, element);
	}

	Api['aloha'] = aloha;
	Api['mahalo'] = mahalo;
	Api['editor'] = editor;
	Api['buildcommit'] = '%buildcommit%';
	win['aloha'] = Maps.extend(aloha, Api);

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
