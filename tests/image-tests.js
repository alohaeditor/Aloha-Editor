(function (aloha) {

	'use strict';

	var Image = aloha.image;
	var BoundaryMarkers = aloha.boundarymarkers;

	module('Image');

	function compareHtml(cases, attrs, fn) {
		for (var i = 0, len = cases.length; i < len; i++) {
			var div = document.createElement('div');
			div.innerHTML = cases[i][0];

			var range = document.createRange();
			BoundaryMarkers.extract(div, range);

			fn(range, attrs);

			equal(div.innerHTML, $('<div>' + cases[i][1] + '</div>')[0].innerHTML, cases[i][0] + ' => ' + cases[i][1]);
		}
	}

	function testInsertImage(cases, attrs) {
		compareHtml(cases, attrs, Image.insertFromRange);
	}

	function testChangeSize(cases, attrs) {
		compareHtml(cases, attrs, Image.setAttributesFromRange);
	}


	test('Inside paragraph', function() {
		var src = 'http://google.com';

		var cases = [
			[
				'<p>image[]</p>',
				'<p>image<img src="' + src + '"/></p>'
			],
			[
				'<p>[image]</p>',
				'<p><img src="' + src + '"/></p>'
			]
		];

		testInsertImage(cases, {src: src});
	});


	test('height and width attributes', function() {
		var src = 'http://google.com';
		var height = '45';
		var width = '45';

		var cases = [
			[
				'<p>image[]</p>',
				'<p>image<img src="' + src + '" height="' + height + '" width="' + width + '"/></p>'
			]
		];

		testInsertImage(cases, {src: src, height: height, width: width});
	});


	test('several images selected', function () {
		var cases = [
			[
				'<p>[<img title="One" height="40" width="40"/> <img title="Two" height="40" width="40"/>]</p>',
				'<p><img title="One" height="15" width="15"/> <img title="Two" height="15" width="15"/></p>'
			],
			[
				'<p><b>Something <span>mor<i>e[e</i>e</span> less</b><img title="One" height="40" width="40"/> ' +
					'<b><span><i><img title="Two" height="40" width="40"/>la]st</i></span></b> </p>',
				'<p><b>Something <span>mor<i>ee</i>e</span> less</b><img title="One" height="15" width="15"/> ' +
					'<b><span><i><img title="Two" height="15" width="15"/>last</i></span></b> </p>'
			],
			[
				'<p><b>Something <span>mor<i>e[e</i>e <img></span> less</b><img title="One" height="40" width="40"/> ' +
					'<b><span><i><img title="Two" height="40" width="40"/>la]st</i></span></b> </p>',
				'<p><b>Something <span>mor<i>ee</i>e <img height="15" width="15"/></span> less</b><img title="One" height="15" width="15"/> ' +
					'<b><span><i><img title="Two" height="15" width="15"/>last</i></span></b> </p>'
			]
		];

		testChangeSize(cases, {height: 15, width: 15});
	});

})(window.aloha);
