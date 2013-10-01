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
	'boundary-markers',
	'browser',
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
	'pubsub',
	'keys',
	'maps',
	'ranges',
	'strings',
	'traversing',
	'typing'
], function Aloha(
	arrays,
	boundarymarkers,
	browser,
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
	pubsub,
	keys,
	maps,
	ranges,
	strings,
	traversing,
	typing
) {
	'use strict';
 
	/*
	keys.down('enter', typing.enter);
	keys.down('space', typing.space);
	keys.down(typing.down);
	*/
	keys.down('delete', typing.delete);
	keys.press(typing.positionCaretOnPress);
	keys.down(typing.positionCaretOnDown);

	/**
	 * The Aloha Editor namespace root.
	 *
	 * Also serves as short aloha.aloha.
	 */
	function aloha(element) {
		if (!dom.isTextNode(element)) {
			dom.setAttr(element, 'contentEditable', 'true');
		}
	}

	function mahalo(element) {
		if (!dom.isTextNode(element)) {
			dom.removeAttr(element, 'contentEditable');
		}
	}

	aloha['aloha'] = aloha;
	aloha['mahalo'] = mahalo;
	aloha['arrays'] = arrays;
	aloha['boundarymarkers'] = boundarymarkers;
	aloha['browser'] = browser;
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
	aloha['maps'] = maps;
	aloha['pubsub'] = pubsub;
	aloha['ranges'] = ranges;
	aloha['strings'] = strings;
	aloha['traversing'] = traversing;
	aloha['xhtml'] = xhtml;

	window['aloha'] = aloha;

	return aloha;
});
