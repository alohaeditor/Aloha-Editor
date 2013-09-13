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
	*/
	keys.down('delete', typing.delete);

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
		'typing'          : typing,
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
