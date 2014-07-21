/** Aloha Editor | Version 1.0 | github.com/alohaeditor */
define([
	'api',
	'dom',
	'blocks',
	'dragdrop',
	'editables',
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
	Blocks,
	DragDrop,
	Editables,
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

	function editor(nativeEvent, custom) {
		var event = custom || {nativeEvent : nativeEvent};
		event.editor = editor;
		event.type = event.type || (nativeEvent && nativeEvent.type) || 'unknown';
		Selections.select(Fn.comp.apply(editor.stack, editor.stack)(event));
	}

	editor.BLOCK_CLASS = 'aloha-block';
	editor.CARET_CLASS = 'aloha-caret';
	editor.selectionContext = Selections.Context(doc);
	editor.dndContext = null;
	editor.editables = {};
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

	Events.setup(doc, editor);
	Events.add(win, 'resize', editor);

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 *
	 * @param  {Element} element
	 */
	function aloha(element) {
		Dom.addClass(element, '✪');
		editor(null, {
			type         : 'aloha',
			element      : element,
			defaultBlock : 'p'
		});
	}

	function mahalo(elem) {
		var editable = Editables.fromElem(editor, elem);
		Editables.close(editable);
		Editables.dissocFromEditor(editor, editable);
		elem.removeAttribute('contentEditable');
		editor(null, {
			type     : 'mahalo',
			editable : editable
		});
	}

	Api['aloha'] = aloha;
	Api['mahalo'] = mahalo;
	Api['editor'] = editor;
	Api['buildcommit'] = '%buildcommit%';

	// cssminimizer.com
	var METAVIEW_CSS = '.✪{outline:5px solid #fce05e;padding:10px}.✪ td,.✪ th,.✪ b,.✪ i,.✪ u,.✪ p,.✪ ul,.✪ ol,.✪ li,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div{position:relative;padding:2px 4px;margin:2px;border:1px solid rgba(0,0,0,0.1)}.✪ td::before,.✪ th::before,.✪ b::before,.✪ i::before,.✪ u::before,.✪ p::before,.✪ ul::before,.✪ ol::before,.✪ li::before,.✪ h1::before,.✪ h2::before,.✪ h3::before,.✪ h4::before,.✪ h5::before,.✪ h6::before,.✪ div::before{position:absolute;top:0;left:0;line-height:8px;font-size:8px;font-weight:bold;font-style:normal;letter-spacing:0.5px;background:#fff;color:#111}.✪ td::before{content:"TD"}.✪ th::before{content:"TH"}.✪ b::before{content:"B"}.✪ i::before{content:"I"}.✪ u::before{content:"U"}.✪ p::before{content:"P"}.✪ ul::before{content:"UL"}.✪ ol::before{content:"OL"}.✪ li::before{content:"LI"}.✪ h1::before{content:"H1"}.✪ h2::before{content:"H2"}.✪ h3::before{content:"H3"}.✪ h4::before{content:"H4"}.✪ h5::before{content:"H5"}.✪ h6::before{content:"H6"}.✪ div::before{content:"DIV"}.✪ p,.✪ ul,.✪ ol,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div{border-width:2px}.✪ b{border-color:#f47d43}.✪ i{border-color:#82b5e0}.✪ u{border-color:#bb94b7}.✪ ul,.✪ ol{border-color:#91c9cf}.✪ p{border-color:#bdd74b}.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6{border-color:#f47d43}';

	/**
	 * Toggles metaview mode.
	 */
	Api['metaview'] = function () {
		var metaview = doc.querySelector('style#metaview');
		if (metaview) {
			Dom.remove(metaview);
		} else {
			var text = doc.createTextNode(METAVIEW_CSS);
			var style = doc.createElement('style');
			Dom.setAttr(style, 'id', 'metaview');
			Dom.append(text, style);
			Dom.append(style, doc.head);
		}
	};

	win['aloha'] = aloha = Maps.extend(aloha, Api);

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
