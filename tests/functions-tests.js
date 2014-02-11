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
			                  .replace(/\s+noop\s*\(\)\s*/, '()')
			                  .replace(/['"]use strict['"]\;/, '')
			                  .replace(/\{\s*\}/g, '{}')
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

	test('partial', function () {
		tested.push('partial');
		equal(fn.partial(function (arg) {
			return arg.foo;
		}, {foo: 'foo'})(), 'foo');
	});

	test('outparameter', function() {
		tested.push('outparameter');
		equal(fn.outparameter(true)(), true);
		equal(fn.outparameter('hello')(), 'hello');
	});

	test('strictEquals', function() {
		tested.push('strictEquals');

		equal(fn.strictEquals('thing', 'thing'), true);
		equal(fn.strictEquals(false, 0), false);
	});

	test('comp', function() {
		tested.push('comp');

		function multiplyBy2(number) {
			return number * 2;
		}

		function add4(number) {
			return number + 4;
		}

		equal(fn.comp(multiplyBy2, add4)(2), 12);
		equal(fn.comp(multiplyBy2, add4)(5), 18);
		equal(fn.comp(multiplyBy2, add4, multiplyBy2)(5), 28);
	});

	//testCoverage(test, tested, fn);

}(window.aloha));
