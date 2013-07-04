define([
	'../src/strings',
	'../src/arrays',
	'../src/maps',
	'../src/functions',
	'../src/dom',
	'../src/cursor',
	'../src/range',
	'../src/range-context',
	'../src/browser'
], function API(
	Strings,
	Arrays,
	Maps,
	Functions,
	Dom,
	Cursor,
	Range,
	RangeContext,
	Browser
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
		Browser      : Browser
	};
});
