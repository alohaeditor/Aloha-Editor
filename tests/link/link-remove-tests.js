(function (aloha) {
	'use strict';

	var LinkRemove = aloha.linkremove;
	var Ranges = aloha.ranges;
	var BoundaryMarkers = aloha.boundarymarkers;

	module('Link');

	function testLink(originalText, expected) {
		var result = $("<div>" + originalText + "</div>")[0];

		var range = Ranges.create(document.documentElement, 0);

		BoundaryMarkers.extract(result, range);

		LinkRemove.removeLinkFromRange(range, document);

		equal(result.innerHTML, $("<div>" + expected + "</div>")[0].innerHTML);
	}

	function testWithParameters(parameters) {
		for (var i = 0, len = parameters.length; i < len; i++) {
			testLink(parameters[i][0], parameters[i][1]);
		}
	}

	test('Remove Anchors', function () {
		var href = "http://www.gentics.com";
		var params = [
			[
				"<p>S<a href='" + href + "'>ome T[]e</a>xt</p>",
				"<p>Some Text</p>"
			],
			[
				"<p>S<a href='" + href + "'>ome Te</a>xt[</p>]",
				"<p>S<a href='" + href + "'>ome Te</a>xt</p>"
			],
			[
				"<p>S<a href='" + href + "'>ome Te</a>xt[</p> <a>mylink</a>]",
				"<p>S<a href='" + href + "'>ome Te</a>xt</p> mylink"
			],
			[
				"<p>S<a href='" + href + "'>o[me T]e</a>xt</p>",
				"<p>Some Text</p>"
			],
			[
				"[<p>S<a href='" + href + "'>ome Te</a>xt</p>  <p><a>Something</a></p>]",
				"<p>Some Text</p>  <p>Something</p>"
			],
			[
				"<p>[<b>S</b><a href='" + href + "'><b>ome</b> Te</a>xt]</p>",
				"<p><b>Some</b> Text</p>"
			],
			[
				"<p>[<b style='width: 100px'><i>italic </i>S</b><a href='" + href + "'><b>ome</b> Te</a>xt]</p>",
				"<p><b style='width: 100px'><i>italic </i>S</b><b>ome</b> Text</p>"
			],
			[
				"<p><b>S</b><a href='" + href + "'><b>o[me </b></a></p>  " +
					"<p><a href='" + href + "'>Some</a></p> " +
					"<p><a href='" + href + "'> T]e</a>xt</p>",
				"<p><b>Some </b></p>  <p>Some</p> <p> Text</p>"
			],
			[
				"<p><br>[</p> <p><a><b>Some</b>] Text</a></p>  <p><br></p>",
				"<p><br></p> <p><b>Some</b> Text</p>  <p><br></p>"
			],
			[
				"<p><i><b><u>S</u></b></i>" +
					"<a>[<i><b><u>ome</u></b></i> " +
					"<span><b><i>Te</i></b>]</span></a>" +
					"<span><b><i>xt</i></b></span></p>",
				"<p><i><b><u>Some</u></b></i> <span><b><i>Text</i></b></span></p>"
			]
		];
		testWithParameters(params);
	});

	test('Remove anchors from lists', function () {
		var params = [
			[
				"<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Link</b></i></a><i><b> 2</b></i>]</li></ul>",
				"<ul> <li> <span>Link</span></li>  <li><i><b>Link 2</b></i></li></ul>"

			],
			[
				"<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a><i><b> 2</b>]</i></li></ul>",
				"<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>"

			],
			[
				"<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a>]<i><b> 2</b></i></li></ul>",
				"<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>"

			],
			[
				"<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a><i>]<b> 2</b></i></li></ul>",
				"<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>"

			],
			[
				"<dl><dt>Title</dt><dd>[te<a>xt</a></dd></dl> <dl><dt><a>Title</a></dt><dd><a>t]e</a>xt</dd></dl>",
				"<dl><dt>Title</dt><dd>text</dd></dl> <dl><dt>Title</dt><dd>text</dd></dl>"
			]
		];

		testWithParameters(params);
	});

	test('Remove anchors from tables', function () {
		var params = [
			[
				"<table><tr><td>Li[<a>nk</a></td></tr></table>   " +
					"<table><tr><td><a>Thing</a></td><td><a>O]</a>ne</td></tr></table>",
				"<table><tr><td>Link</td></tr></table>   <table><tr><td>Thing</td><td>One</td></tr></table>"
			],
			[
				"<table><tr><td>Li<a>nk[</a></td></tr></table>   " +
					"<table><tr><td><a>Thing</a></td><td><a>]O</a>ne</td></tr></table>",
				"<table><tr><td>Link</td></tr></table>   <table><tr><td>Thing</td><td>One</td></tr></table>"
			],
			[
				"<table><tr><td>Li<a>nk</a>[</td></tr></table>   " +
					"<table><tr><td><a>Thing</a></td><td><a>]O</a>ne</td></tr></table>",
				"<table><tr><td>Li<a>nk</a></td></tr></table>   <table><tr><td>Thing</td><td>One</td></tr></table>"
			]
		];
		testWithParameters(params);
	});
})(window.aloha);