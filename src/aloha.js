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
	'traversing'
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
	traversing
) {
	'use strict';

	/**
	 * Aloha Editor API
	 *
	 * The Aloha Editor API provides facilities to build advanced content
	 * editing solutions in HTML.
	 */
	var aloha = {
		'arrays'          : arrays,
		'boundarymarkers' : boundarymarkers,
		'browser'         : browser,
		'content'         : content,
		'colors'          : colors,
		'cursors'         : cursors,
		'dom'             : dom,
		'editing'         : editing,
		'ephemera'        : ephemera,
		'events'          : events,
		'fn'              : fn,
		'html'            : html,
		'keys'            : keys,
		'maps'            : maps,
		'pubsub'          : pubsub,
		'ranges'          : ranges,
		'strings'         : strings,
		'traversing'      : traversing,
		'xhtml'           : xhtml
	};

	window['aloha'] = aloha;

	return aloha;
});
