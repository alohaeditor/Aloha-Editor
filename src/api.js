define([
	'strings',
	'arrays',
	'maps',
	'functions',
	'dom',
	'cursor',
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
	Cursor,
	Range,
	RangeContext,
	Browser,
	Content,
	Ephemera
) {
	'use strict';
	return {
		Strings      : Strings,
		Arrays       : Arrays,
		Maps         : Maps,
		Functions    : Functions,
		Dom          : Dom,
		Cursor       : Cursor,
		Range        : Range,
		RangeContext : RangeContext,
		Browser      : Browser,
		Content      : Content,
		Ephemera     : Ephemera
	};
});
