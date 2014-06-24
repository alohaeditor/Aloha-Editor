(function (aloha) {
	'use strict';

	var Strings = aloha.strings;

	function fromDashesToCamelCaseAndBack(dashes, expectedCamelCase) {
		var camelCase = Strings.dashesToCamelCase(dashes);
		var dashesAgain = Strings.camelCaseToDashes(camelCase);
		equal(camelCase, expectedCamelCase);
		equal(dashesAgain, dashes);
	}

	module('strings');

	test('words', function () {
		deepEqual(Strings.words(''), []);
		deepEqual(Strings.words(' '), []);
		deepEqual(Strings.words('\u0009\u000A\u000B\u000C\u000D\u0020' +
			'\u0085\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004' +
			'\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000'), []);
		deepEqual(Strings.words('abc'), ['abc']);
		deepEqual(Strings.words('  \u000Aabc  def  '), ['abc', 'def']);
		deepEqual(Strings.words('\nabc\ndef\rghi\r\n'), ['abc', 'def', 'ghi']);
	});

	test('dashesToCamelCase, camelCaseToDashes', function () {
		fromDashesToCamelCaseAndBack('data-a-b', 'dataAB');
		fromDashesToCamelCaseAndBack('data-some-attr', 'dataSomeAttr');
	});

	test('splitIncl', function () {
		var parts = Strings.splitIncl('foo-bar', /\-/g);
		equal(3, parts.length);
		if (3 === parts.length) {
			equal('foo', parts[0]);
			equal('-', parts[1]);
			equal('bar', parts[2]);
		}
		equal('foo', Strings.splitIncl('foo', /\-/g));
	});

	test('isEmpty', function () {
		equal(true, Strings.isEmpty(''));
		equal(true, Strings.isEmpty(null));
		equal(true, Strings.isEmpty(void 0));
	});

	test('isControlCharacter', function () {
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

	test('addToList', function () {
		equal(Strings.addToList('one two', 'three'), 'one two three');
		equal(Strings.addToList('one two', 'three', 'four'), 'one two three four');
		equal(Strings.addToList('', 'one'), 'one');
		equal(Strings.addToList('one', ''), 'one');
		equal(Strings.addToList('one', '', 'two', '', 'three'), 'one two three');
		equal(Strings.addToList('one\n  two\t three\n\n\t\tfour', 'five'), 'one two three four five');
	});

	test('removeFromList', function () {
		equal(Strings.removeFromList('one two three', 'one'), 'two three');
		equal(Strings.removeFromList('one two three', 'two'), 'one three');
		equal(Strings.removeFromList('one two three', 'three'), 'one two');
		equal(Strings.removeFromList('one two three', 'bla'), 'one two three');
		equal(Strings.removeFromList('one two three', ''), 'one two three');
		equal(Strings.removeFromList('', 'one'), '');
		equal(Strings.removeFromList('one\n  two\t three\n\n\t\tfour', 'three'), 'one two four');
	});

	test('uniqueList', function () {
		equal(Strings.uniqueList('one two two'), 'one two');
		equal(Strings.uniqueList('one two two three'), 'one two three');
		equal(Strings.uniqueList('one two two three four four four three five'), 'one two three four five');
		equal(Strings.uniqueList('one\n two\t\t two three\n\n\t one\tfour'), 'one two three four');
	});

}(window.aloha));
