/** Aloha Editor | Version 1.0 | github.com/alohaeditor */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @warning_level VERBOSE
// @jscomp_warning missingProperties
// @output_file_name aloha.min.js
// @check_types
// ==/ClosureCompiler==

define([
	'arrays',
	'boundaries',
	'boundary-markers',
	'browser',
	'caret',
	'content',
	'colors',
	'cursors',
	'dom',
	'dom-to-xhtml',
	'editing',
	'ephemera',
	'events',
	'functions',
	'html',
	'mouse',
	'pubsub',
	'keys',
	'maps',
	'ranges',
	'strings',
	'traversing',
	'typing',
	'undo'
], function Aloha(
	arrays,
	boundaries,
	boundarymarkers,
	browser,
	caret,
	content,
	colors,
	cursors,
	dom,
	xhtml,
	editing,
	ephemera,
	events,
	fn,
	html,
	mouse,
	pubsub,
	keys,
	maps,
	ranges,
	strings,
	traversing,
	typing,
	undo
) {
	'use strict';

	events.add(document, 'keyup',     keys.onUp);
	events.add(document, 'keydown',   keys.onDown);
	events.add(document, 'keypress',  keys.onPress);
	events.add(document, 'mouseup',   mouse.onUp);
	events.add(document, 'mousedown', mouse.onDown);
	events.add(document, 'mousemove', mouse.onMove);

	var context = {
		settings: {
			defaultBlockNodeName: 'div'
		},
		overrides: []
	};

	keys.down(function (msg) {
		typing.down(msg, context);
	});
	keys.press(function (msg) {
		typing.press(msg, context);
	});

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 */
	function aloha(element) {
		element.setAttribute('contentEditable', 'true');
	}

	function mahalo(element) {
		element.removeAttribute('contentEditable');
	}

	aloha['aloha'] = aloha;
	aloha['mahalo'] = mahalo;
	aloha['arrays'] = arrays;
	aloha['boundaries'] = boundaries;
	aloha['boundarymarkers'] = boundarymarkers;
	aloha['browser'] = browser;
	aloha['caret'] = caret;
	aloha['content'] = content;
	aloha['colors'] = colors;
	aloha['cursors'] = cursors;
	aloha['dom'] = dom;
	aloha['editing'] = editing;
	aloha['ephemera'] = ephemera;
	aloha['events'] = events;
	aloha['fn'] = fn;
	aloha['html'] = html;
	aloha['typing'] = typing;
	aloha['keys'] = keys;
	aloha['mouse'] = mouse;
	aloha['maps'] = maps;
	aloha['pubsub'] = pubsub;
	aloha['ranges'] = ranges;
	aloha['strings'] = strings;
	aloha['traversing'] = traversing;
	aloha['xhtml'] = xhtml;
	aloha['undo'] = undo;

	window['aloha'] = aloha;

	return aloha;
});
