(function (aloha) {
	'use strict';

	var Strings = aloha.strings;
	var tested = [];

	function fromDashesToCamelCaseAndBack(dashes, expectedCamelCase) {
		var camelCase = Strings.dashesToCamelCase(dashes);
		var dashesAgain = Strings.camelCaseToDashes(camelCase);
		equal(camelCase, expectedCamelCase);
		equal(dashesAgain, dashes);
	}

	module('Strings');

	test('words()', function () {
		tested.push('words');
		deepEqual(Strings.words(''), []);
		deepEqual(Strings.words(' '), []);
		deepEqual(Strings.words('abc'), ['abc']);
		deepEqual(Strings.words('  abc  def  '), ['abc', 'def']);
		deepEqual(Strings.words('\nabc\ndef\rghi\r\n'), ['abc', 'def', 'ghi']);
	});

	test('dashesToCamelCase(), camelCaseToDashes()', function () {
		tested.push('dashesToCamelCase');
		tested.push('camelCaseToDashes');
		fromDashesToCamelCaseAndBack('data-a-b', 'dataAB');
		fromDashesToCamelCaseAndBack('data-some-attr', 'dataSomeAttr');
	});

	test('splitIncl()', function () {
		tested.push('splitIncl');
		var parts = Strings.splitIncl('foo-bar', /\-/g);
		equal(3, parts.length);
		if (3 === parts.length) {
			equal('foo', parts[0]);
			equal('-', parts[1]);
			equal('bar', parts[2]);
		}
		equal('foo', Strings.splitIncl('foo', /\-/g));
	});

	test('empty()', function () {
		tested.push('empty');
		equal(true, Strings.empty(''));
		equal(true, Strings.empty(null));
		equal(true, Strings.empty(void 0));
	});

	test('isControlCharacter', function () {
		tested.push('isControlCharacter');
		equal(Strings.isControlCharacter('\0'), true);
		equal(Strings.isControlCharacter('\b'), true);
		equal(Strings.isControlCharacter('\n'), true);
		equal(Strings.isControlCharacter('\r'), true);
		equal(Strings.isControlCharacter('\t'), true);
		equal(Strings.isControlCharacter('\f'), true);
		equal(Strings.isControlCharacter('\v'), true);
		equal(Strings.isControlCharacter('\u0000'), true);
		equal(Strings.isControlCharacter('0'), false);
		equal(Strings.isControlCharacter(''), false);
		equal(Strings.isControlCharacter('a'), false);
	});

	testCoverage(test, tested, Strings);
}(window.aloha));
