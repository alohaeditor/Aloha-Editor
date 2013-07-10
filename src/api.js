define([
	'strings',
	'arrays',
	'maps',
	'functions',
	'dom',
	'cursors',
	'range',
	'range-context',
	'browser',
	'content',
	'ephemera'
], function API(
	Strings,
	Arrays,
	Maps,
	Functions,
	Dom,
	Cursors,
	Range,
	RangeContext,
	Browser,
	Content,
	Ephemera
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
		Strings      : Strings,
		Arrays       : Arrays,
		Maps         : Maps,
		Functions    : Functions,
		Dom          : Dom,
		Cursors      : Cursors,
		Range        : Range,
		RangeContext : RangeContext,
		Browser      : Browser,
		Content      : Content,
		Ephemera     : Ephemera
	};

	return Aloha;
});
