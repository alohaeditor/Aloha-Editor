Aloha.require(['util/strings'], function(Strings){
	'use strict';

	function fromDashesToCamelCaseAndBack(dashes, expectedCamelCase) {
		var camelCase = Strings.dashesToCamelCase(dashes);
		var dashesAgain = Strings.camelCaseToDashes(camelCase);
		equal(camelCase, expectedCamelCase);
		equal(dashesAgain, dashes);
	}

	module('Strings');
	test('dashesToCamelCase, camelCaseToDashes', function() {
		fromDashesToCamelCaseAndBack('data-a-b', 'dataAB');
		fromDashesToCamelCaseAndBack('data-some-attr', 'dataSomeAttr');
	});
});
