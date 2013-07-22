define([
	'arrays',
	'browser',
	'content',
	'cursors',
	'dom',
	'ephemera',
	'functions',
	'html',
	'dom-to-xhtml',
	'maps',
	'editing',
	'ranges',
	'strings',
	'traversing'
], function AlohaAPI(
	Arrays,
	Browser,
	Content,
	Cursors,
	Dom,
	Ephemera,
	Functions,
	Html,
	Xhtml,
	Maps,
	Editing,
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
		Functions  : Functions,
		Html       : Html,
		Maps       : Maps,
		Ranges     : Ranges,
		Strings    : Strings,
		Traversing : Traversing,
		Xhtml      : Xhtml
	};

	return Aloha;
});
