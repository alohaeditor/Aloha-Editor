define([
	'arrays',
	'browser',
	'content',
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
], function AlohaAPI(
	Arrays,
	Browser,
	Content,
	Cursors,
	Dom,
	Xhtml,
	Editing,
	Ephemera,
	Events,
	Functions,
	Html,
	Keys,
	Maps,
	Ranges,
	Strings,
	Traversing
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('Aloha');
	}

	/**
	 * Aloha Editor API
	 *
	 * The Aloha Editor API provides facilities to build advanced content
	 * editing solutions in HTML.
	 */
	var Aloha = {
		Arrays     : Arrays,
		Browser    : Browser,
		Content    : Content,
		Cursors    : Cursors,
		Dom        : Dom,
		Editing    : Editing,
		Ephemera   : Ephemera,
		Events     : Events,
		Functions  : Functions,
		Html       : Html,
		Keys       : Keys,
		Maps       : Maps,
		Ranges     : Ranges,
		Strings    : Strings,
		Traversing : Traversing,
		Xhtml      : Xhtml
	};

	return Aloha;
});
