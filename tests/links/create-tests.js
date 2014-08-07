(function (aloha, module, test, equal) {
	'use strict';

	var Links = aloha.links;
	var Markers = aloha.markers;

	module('links');

	function run(href, before, after) {
		var dom = $('<div>' + before + '</div>')[0];
		var boundaries = Markers.extract(dom);
		Links.create(href, boundaries[0], boundaries[1]);
		equal(dom.innerHTML, after, before, before + ' ⇒ ' + after);
	}

	test('Create Anchors', function () {
		var href = 'http://www.aloha-editor.org';
		[
			[
				'<p>Some Te[]xt</p>',
				'<p>Some Te<a href="' + href + '">' + href + '</a>xt</p>'
			], [
				'<p>S[ome Te]xt</p>',
				'<p>S<a href="' + href + '">ome Te</a>xt</p>'
			], [
				'<p><b>S[ome</b> Te]xt</p>',
				'<p><b>S</b><a href="' + href + '"><b>ome</b> Te</a>xt</p>'
			], [
				'<p><b>S[ome </b></p>  <p>Some</p> <p> Te]xt</p>',
				'<p><b>S</b><a href="' + href + '"><b>ome </b></a></p>  ' +
					'<p><a href="' + href + '">Some</a></p> ' +
					'<p><a href="' + href + '"> Te</a>xt</p>'
			]
		].forEach(function (parts) {
			run(href, parts[0], parts[1]);
		});
	});

})(window.aloha, window.module, window.test, window.equal);
