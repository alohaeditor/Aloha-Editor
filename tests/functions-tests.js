(function (aloha) {
	'use strict';

	var fn = aloha.fn;
	var tested = [];

    module('functions');

	test('identity', function () {
		tested.push('identity');
		var func = function () {};
		equal(func, fn.identity(func));
	});

	test('noop', function () {
		tested.push('noop');
		equal(
			fn.noop.toString().replace(/[\r\n]/g, '')
			                  .replace(/\{\s*\}/g, '{}')
			                  .replace(/\s+noop\s*\(\)\s*/, '()')
			                  .replace(/function\s+\(/, 'function('),
			'function(){}'
		);
	});

	test('returnTrue', function () {
		tested.push('returnTrue');
		equal(fn.returnTrue(), true);
	});

	test('returnFalse', function () {
		tested.push('returnFalse');
		equal(fn.returnFalse(), false);
	});

	test('complement', function () {
		tested.push('complement');
		equal(fn.complement(fn.returnFalse)(), true);
	});

	test('bind', function () {
		tested.push('bind');
		equal(fn.bind(function () {
			return this.foo;
		}, {foo: 'foo'})(), 'foo');
	});

	testCoverage(test, tested, fn);
}(window.aloha));
