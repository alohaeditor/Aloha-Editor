Aloha.require(['util/strings'], function (Strings) {
	'use strict';

	function fromDashesToCamelCaseAndBack(dashes, expectedCamelCase) {
		var camelCase = Strings.dashesToCamelCase(dashes);
		var dashesAgain = Strings.camelCaseToDashes(camelCase);
		equal(camelCase, expectedCamelCase);
		equal(dashesAgain, dashes);
	}

	module('Strings');
	test('dashesToCamelCase, camelCaseToDashes', function () {
		fromDashesToCamelCaseAndBack('data-a-b', 'dataAB');
		fromDashesToCamelCaseAndBack('data-some-attr', 'dataSomeAttr');
	});

	test('words', function () {
		deepEqual(Strings.words(''), []);
		deepEqual(Strings.words(' '), []);
		deepEqual(Strings.words('abc'), ['abc']);
		deepEqual(Strings.words('  abc  def  '), ['abc', 'def']);
		deepEqual(Strings.words('\nabc\ndef\rghi\r\n'), ['abc', 'def', 'ghi']);
	});
});
