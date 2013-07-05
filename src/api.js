define([
	'../src/strings',
	'../src/arrays',
	'../src/maps',
	'../src/functions',
	'../src/dom',
	'../src/cursor',
	'../src/range',
	'../src/range-context',
	'../src/browser',
	'../src/content'
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
	Content
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
		Content      : Content
	};
});
