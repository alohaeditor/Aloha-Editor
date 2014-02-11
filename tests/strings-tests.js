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
		deepEqual(Strings.words('\u0009\u000A\u000B\u000C\u000D\u0020' +
			'\u0085\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004' +
			'\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000'), []);
		deepEqual(Strings.words('abc'), ['abc']);
		deepEqual(Strings.words('  \u000Aabc  def  '), ['abc', 'def']);
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

	test('isEmpty()', function () {
		tested.push('isEmpty');
		equal(true, Strings.isEmpty(''));
		equal(true, Strings.isEmpty(null));
		equal(true, Strings.isEmpty(void 0));
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

	//testCoverage(test, tested, Strings);

}(window.aloha));
