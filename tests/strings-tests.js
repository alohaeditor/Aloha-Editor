(function (aloha) {
	'use strict';

	var strings = aloha.strings;

	'use strict';

	function fromDashesToCamelCaseAndBack(dashes, expectedCamelCase) {
		var camelCase = strings.dashesToCamelCase(dashes);
		var dashesAgain = strings.camelCaseToDashes(camelCase);
		equal(camelCase, expectedCamelCase);
		equal(dashesAgain, dashes);
	}

	module('strings');

	test('words', function () {
		deepEqual(strings.words(''), []);
		deepEqual(strings.words(' '), []);
		deepEqual(strings.words('abc'), ['abc']);
		deepEqual(strings.words('  abc  def  '), ['abc', 'def']);
		deepEqual(strings.words('\nabc\ndef\rghi\r\n'), ['abc', 'def', 'ghi']);
	});

	test('dashesToCamelCase, camelCaseToDashes', function () {
		fromDashesToCamelCaseAndBack('data-a-b', 'dataAB');
		fromDashesToCamelCaseAndBack('data-some-attr', 'dataSomeAttr');
	});

	test('splitIncl', function () {
		var parts = strings.splitIncl('foo-bar', /\-/g);
		equal(3, parts.length);
		if (3 === parts.length) {
			equal('foo', parts[0]);
			equal('-', parts[1]);
			equal('bar', parts[2]);
		}
		equal('foo', strings.splitIncl('foo', /\-/g));
	});

	test('empty', function () {
		equal(true, strings.empty(''));
		equal(true, strings.empty(null));
		equal(true, strings.empty(void 0));
	});
}(window.aloha));
