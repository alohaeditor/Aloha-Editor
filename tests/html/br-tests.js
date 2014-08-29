(function (aloha, require, equal, module, test) {
	'use strict';

    module('html');

	var Html; require('../src/html', function (Module) { Html = Module; });

	test('isRenderedBr', function () {
		var div = document.createElement('div');
		div.innerHTML = 'one'
		              + '<br>'  // 0. false
		              + '<p>'
		              + '<br>'  // 1. true
		              + 'two'
		              + '<br>'  // 2. false
		              + '</p>'
		              + '<br>'  // 3. true
		              + '<br>'  // 4. true
		              + '<p>'
		              + '<br>'  // 5. true
		              + '</p>'
		              + '<i>'
		              + 'three'
		              + '<br>'  // 6. true
		              + '</i>'
		              + 'four'
		              + '<u>'
		              + 'three'
		              + '<br>'  // 7. false
		              + '</u>'
		              + '<p>'
		              + 'four'
		              + '<i>'
		              + '<br>'
		              + '</i>'  // 8. false
		              + '</p>'
		              + '<br>'; // 9. false

		var brs = $('br', div);
		var t = Html.isRenderedBr;

		equal(t(brs[0]), false);
		equal(t(brs[1]), true);
		equal(t(brs[2]), false);
		equal(t(brs[3]), true);
		equal(t(brs[4]), true);
		equal(t(brs[5]), true);
		equal(t(brs[6]), true);
		equal(t(brs[7]), false);
		equal(t(brs[8]), false);
		equal(t(brs[9]), false);
	});
}(window.aloha, window.require, window.equal, window.module, window.test));
