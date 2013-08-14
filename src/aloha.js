define([
	'arrays',
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
	'keys',
	'maps',
	'ranges',
	'strings',
	'traversing'
], function Aloha(
	arrays,
	browser,
	content,
	colors,
	cursors,
	dom,
	xhtml,
	editing,
	ephemera,
	events,
	functions,
	html,
	keys,
	maps,
	ranges,
	strings,
	traversing
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('aloha');
	}

	/**
	 * Aloha Editor API
	 *
	 * The Aloha Editor API provides facilities to build advanced content
	 * editing solutions in HTML.
	 */
	var aloha = {
		arrays     : arrays,
		browser    : browser,
		content    : content,
		colors     : colors,
		cursors    : cursors,
		dom        : dom,
		editing    : editing,
		ephemera   : ephemera,
		events     : events,
		functions  : functions,
		html       : html,
		keys       : keys,
		maps       : maps,
		ranges     : ranges,
		strings    : strings,
		traversing : traversing,
		xhtml      : xhtml
	};

	return aloha;
});
