(function (aloha) {
	'use strict';

	var Link = aloha.link;
	var Ranges = aloha.ranges;
	var BoundaryMarkers = aloha.boundarymarkers;

	module('Link');

	function testLink(href, originalText, expected) {
		var result = $("<div>" + originalText + "</div>")[0];

		var range = Ranges.create(document.documentElement, 0);

		BoundaryMarkers.extract(result, range);

		Link.createLinkFromRange(href, range, document);

		equal(result.innerHTML, $("<div>" + expected + "</div>")[0].innerHTML);
	}

	function testWithParameters(href, parameters) {
		for (var i = 0, len = parameters.length; i < len; i++) {
			testLink(href, parameters[i][0], parameters[i][1]);
		}
	}

	test('Create Anchors', function () {
		var href = "http://www.gentics.com";
		var params = [
			[
				"<p>Some Te[]xt</p>",
				"<p>Some Text</p>"
			],
			[
				"<p>S[ome Te]xt</p>",
				"<p>S<a href='" + href + "'>ome Te</a>xt</p>"
			],
			[
				"<p><b>S[ome</b> Te]xt</p>",
				"<p><b>S</b><a href='" + href + "'><b>ome</b> Te</a>xt</p>"
			],
			[
				"<p><b>S[ome </b></p>  <p>Some</p> <p> Te]xt</p>",
				"<p><b>S</b><a href='" + href + "'><b>ome </b></a></p>  " +
					"<p><a href='" + href + "'>Some</a></p> " +
					"<p><a href='" + href + "'> Te</a>xt</p>"
			]
		];

		testWithParameters(href, params);
	});

})(window.aloha);