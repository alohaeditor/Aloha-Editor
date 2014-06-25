(function (aloha) {
	'use strict';

	var LinkSelection = aloha.linkselection;
	var Ranges = aloha.ranges;
	var BoundaryMarkers = aloha.boundarymarkers;

	module('Link');

	function testCreateAnchorsInRange(originalText, expectedText) {
		var result = $("<div>" + originalText + "</div>")[0];
		var expected = $("<div>" + expectedText + "</div>")[0];

		var range = Ranges.create(document.documentElement, 0);

		BoundaryMarkers.extract(result, range);

		LinkSelection.createAnchorsInRange(range, document);

		equal(result.innerHTML, expected.innerHTML);
	}

	function testGetLinkableElements(originalText, array) {
		var result = $("<div>" + originalText + "</div>")[0];

		var range = Ranges.create(document.documentElement, 0);

		BoundaryMarkers.extract(result, range);

		var resultArray = LinkSelection.linkableNodesInsideRange(range);
		var div = document.createElement('div');

		for (var i = 0, len = array.length; i < len; i++) {
			for (var j = 0, lenJ = array[i].length; j < lenJ; j++) {
				div = document.createElement('div');
				div.appendChild(resultArray[i][j]);
				equal(div.innerHTML, $("<div>" + array[i][j] + "</div>")[0].innerHTML);
			}
		}
	}

	function testWithParameters(parameters, callBackFn) {
		for (var i = 0, len = parameters.length; i < len; i++) {
			callBackFn(parameters[i][0], parameters[i][1]);
		}
	}



	test('Get elements inside Range', function () {
		testGetLinkableElements(
			"<p><span>H[i</span> <i>Hola</i> <b>Hal]lo</b></p>",

			[["<span>i</span>", " ", "<i>Hola</i>", " ", "<b>Hal</b>"]]
		);
	});

	test('Get elements inside Range: text', function () {
		testGetLinkableElements(
			"H[i <i>Hola</i> <b>Hal]lo</b>",

			[["i ", "<i>Hola</i>", " ", "<b>Hal</b>"]]
		);
	});

	test('Get elements inside Range: only text Node', function () {
		var params = [
			[
				"<p><span>H[i some ]</span><b>extra</b> text to probe<i>italic</i> Hallo</p>",
				[["i some "]]
			],
			[
				"<p>H[i some <b>extra</b> text to probe<i>italic</i> Hal]lo</p>",
				[["i some ","<b>extra</b>"," text to probe", "<i>italic</i>", " Hal"]]
			],
			["H[i Hal]lo", [["i Hal"]]],
			["[Hi Hallo]", [["Hi Hallo"]]],
			["Hi Hal[lo]", [["lo"]]],
			["[Hi ]Hallo", [["Hi "]]]
		];

		testWithParameters(params, testGetLinkableElements);
	});

	test('Get elements inside Range: paragraphs', function () {
		var params = [
			[
				"<p><b>S[ome</b></p> <p>Some</p> <p> Te]xt</p>",
				[["<b>ome</b>"], ["Some"], [" Te"]]
			],
			[
				"<p><b>S[ome</b> Te]xt</p>",
				[["<b>ome</b>", " Te"]]
			],
			[
				"<p>[<span>Hi</span></p><p><i>Hola</i> <b>Hal]lo</b></p>",
				[["<span>Hi</span>"], ["<i>Hola</i>", " ", "<b>Hal</b>"]]
			],
			[
				"<p><span>H[i</span></p><p><i>Hola</i> <b>Hal]lo</b></p>",
				[["<span>i</span>"], ["<i>Hola</i>", " ", "<b>Hal</b>"]]
			],
			[
				"<p>H[i <span>hallo</span> Ba]d</p>",
				[["i ", "<span>hallo</span>", " Ba"]]
			],
			[
				"<p><span>H[i</span></p><p><i>Hola</i> <b>Hal]lo</b></p>",

				[["<span>i</span>"], ["<i>Hola</i>", " ", "<b>Hal</b>"]]
			],
			[
				"<p><span>H[i</span></p><p>Example <span><b>hi</b></span></p><p><i>Hola</i> <b>Hal]lo</b></p>",

				[["<span>i</span>"], ["Example ", "<span><b>hi</b></span>"], ["<i>Hola</i>", " ", "<b>Hal</b>"]]
			]
		];
		testWithParameters(params, testGetLinkableElements);
	});

	test('Get elements inside Range: Tables', function() {
		var params = [
			[
				"[<table><tr><td>Link</td></tr></table>]",
				[["Link"]]
			]
		];

		testWithParameters(params, testGetLinkableElements);
	});

	test('Get elements inside Range: Lists', function() {
		var params = [
			[
				"[<ul><li>Link</li>  <li>Link 2</li></ul>]",
				[["Link"], ["Link 2"]]
			],
//			[
//				"<ul><li>Li[nk</li> <li>Link 2</li></ul>]",
//				[["nk"], ["Link 2"]]
//			],
//			[
//				"<ul><li>Li[nk</li>  <li>Link] 2</li></ul>",
//				[["nk"], ["Link"]]
//			],
//			[
//				"[<ul><li>Link</li><li>Link] 2</li></ul>",
//				[["Link"], ["Link"]]
//			],
//			[
//				"[<dl><dt>Title</dt><dd>Text</dd></dl>]",
//				[["Title"], ["Text"]]
//			],
//			[
//				"<dl><dt>Ti[tle</dt><dd>Text</dd></dl>]",
//				[["tle"], ["Text"]]
//			],
//			[
//				"[<dl><dt>Title</dt><dd>Te]xt</dd></dl>",
//				[["Title"], ["Te"]]
//			]
		];

		testWithParameters(params, testGetLinkableElements);
	});


	test('Create Anchors: inline elements', function () {
		var params = [
			[
				"<p><span><i>Fine</i>[<i class='italic'> italic </i>]</span></p>",
				"<p><span><i>Fine</i><a><i class='italic'> italic </i></a></span></p>"
			],
			[
				"<p><span><i>F[ine]</i></span></p>",
				"<p><span><i>F<a>ine</a></i></span></p>"
			],
			[
				"<p><span><i>[Fine]</i></span></p>",
				"<p><span><i><a>Fine</a></i></span></p>"
			],
			[
				"<p><span>My [<i>Fine</i>] You</span></p>",
				"<p><span>My <a><i>Fine</i></a> You</span></p>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});

	test('Create Anchors: single paragraph selected', function () {
		var params = [
			[
				"<p><i>Things<b>[<u>Some</u></b></i> Te]xt</p>",
				"<p><i>Things</i><a><i><b><u>Some</u></b></i> Te</a>xt</p>"
			],
			[
				"<p><i>[<b><u>Some</u></b></i> <b><strong><i>]Text</i></strong></b></p>",
				"<p><a><i><b><u>Some</u></b></i> </a><b><strong><i>Text</i></strong></b></p>"
			],
			[
				"<p><i><b><u>S[om]e</u></b></i> <b><strong><i>Text</i></strong></b></p>",
				"<p><i><b><u>S<a>om</a>e</u></b></i> <b><strong><i>Text</i></strong></b></p>"
			],
			[
				"<p><i>[<b><u>Some</u></b></i> ]<b><i>Text</i></b></p>",
				"<p><a><i><b><u>Some</u></b></i> </a><b><i>Text</i></b></p>"
			],
			[
				"<p><i>[<b><u>Some</u></b></i> Te]xt</p>",
				"<p><a><i><b><u>Some</u></b></i> Te</a>xt</p>"
			],
			[
				"<p>[<i><b><u>Some</u></b></i> Te]xt</p>",
				"<p><a><i><b><u>Some</u></b></i> Te</a>xt</p>"
			],
			[
				"<p>[<i><b><u>Some</u></b></i> <span>Te]xt</span></p>",
				"<p><a><i><b><u>Some</u></b></i> <span>Te</span></a><span>xt</span></p>"
			],
			[
				"<p><i><b><u>S[ome</u></b></i> <span><b><i>Te]xt</i></b></span></p>",

				"<p><i><b><u>S</u></b></i>" +
					"<a><i><b><u>ome</u></b></i> " +
					"<span><b><i>Te</i></b></span></a>" +
					"<span><b><i>xt</i></b></span></p>"
			],
			[
				"<p><i><b><u>S[ome</u></b></i> Te]xt</p>",
				"<p><i><b><u>S</u></b></i><a><i><b><u>ome</u></b></i> Te</a>xt</p>"
			],
			[
				"<p>S[ome Te]xt</p>",
				"<p>S<a>ome Te</a>xt</p>"
			],
			[
				"<p><b>S[ome</b> Te]xt</p>",
				"<p><b>S</b><a><b>ome</b> Te</a>xt</p>"
			],
			[
				"<p><br></p>[ <p><b>Some</b> Text</p> ] <p><br></p>",
				"<p><br></p> <p><a><b>Some</b> Text</a></p>  <p><br></p>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});

	test('Create Anchors: several paragraphs selected', function () {
		var params = [
			[
				"<p><b>S[ome </b> </p>  <p>Some</p> <p> Te]xt</p>",
				"<p><b>S</b><a><b>ome </b></a> </p>  <p><a>Some</a></p> <p><a> Te</a>xt</p>"
			],
			[
				" <p> <b>S[ome </b> </p>  <p>Some</p> <p> Te]xt</p>",
				" <p> <b>S</b><a><b>ome </b></a> </p>  <p><a>Some</a></p> <p><a> Te</a>xt</p>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});

	test('Create anchors: nested anchors', function() {
		var params = [
			[
				"<p><a>Some[thing </a>thi]ngs</p>",
				"<p><a>Something thi</a>ngs</p>"
			],
			[
				"<p><a my=''>So[methi]ng happens</a></p>",
				"<p><a>Something happens</a></p>"
			],
			[
				"<a my=''>[Something happens]</a>",
				"<a>Something happens</a>"
			],
			[
				"<p><a my='asdf'>So[me</a><a href='asdf'>thi]ng</a></p>",
				"<p><a>Something</a></p>"
			],
			[
				"<p><a my='asdf'>Some</a>so[me<a href='asdf'>thi]ng</a></p>",
				"<p><a my='asdf'>Some</a>so<a>mething</a></p>"
			],
			[
				"<p>[<a my='asdf'>Some</a>some<a href='asdf'>thi]ng</a></p>",
				"<p><a>Somesomething</a></p>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});

	test('Create anchors: Lists', function() {
		var params = [
			[
				"[<ul><li>Link</li>  <li>Link 2</li></ul>]",
				"<ul><li><a>Link</a></li>  <li><a>Link 2</a></li></ul>"
			],
			[
				"<ul> <li> <span>Li[nk</span></li> <li>Link 2</li></ul>]",
				"<ul> <li> <span>Li</span><a><span>nk</span></a></li> <li><a>Link 2</a></li></ul>"
			],
			[
				"<ul> <li> <span>Li[nk</span></li>  <li><i><b>Link] 2</b></i></li></ul>",
				"<ul> <li> <span>Li</span><a><span>nk</span></a></li>  <li><a><i><b>Link</b></i></a><i><b> 2</b></i></li></ul>"
			],
			[
				"[<ul><li>Link</li>  <li>Link 2</li></ul> <ul><li>Link</li>  <li>Link 2</li></ul>  ]",
				"<ul><li><a>Link</a></li>  <li><a>Link 2</a></li></ul> <ul><li><a>Link</a></li>  <li><a>Link 2</a></li></ul>  "
			],
			[
				"[<dl><dt>Title</dt><dd>text</dd></dl> ]",
				"<dl><dt><a>Title</a></dt><dd><a>text</a></dd></dl> "
			],
			[
				"<dl><dt>Title</dt><dd>te[xt</dd></dl> <dl><dt>Title</dt><dd>te]xt</dd></dl>",
				"<dl><dt>Title</dt><dd>te<a>xt</a></dd></dl> <dl><dt><a>Title</a></dt><dd><a>te</a>xt</dd></dl>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});


	test('Create anchors: Tables', function() {
		var params = [
			[
				"[<table><tr><td>Link]</td> </tr><tr>  <td>Link</td></tr></table>",
				"<table><tr><td><a>Link</a></td> </tr><tr>  <td>Link</td></tr></tr></table>"
			],
			[
				"<table><tr><td>Link1[</td> </tr><tr>  <td>Link2]</td></tr></table>",
				"<table><tr><td>Link1</td> </tr><tr>  <td><a>Link2</a></td></tr></tr></table>"
			],
			[
				"<table><tr><td><i>Lin[k1</i></td> </tr><tr>  <td>Link2]</td></tr></table>",
				"<table><tr><td><i>Lin</i><a><i>k1</i></a></td> </tr><tr>  <td><a>Link2</a></td></tr></tr></table>"
			],
			[
				"[<table><tr><td>Link</td></tr></table>]",
				"<table><tr><td><a>Link</a></td></tr></table>"
			],
			[
				"[<table><tr><td>Link</td></tr></table>   <table><tr><td>Thing</td><td>One</td></tr></table>]",
				"<table><tr><td><a>Link</a></td></tr></table>   <table><tr><td><a>Thing</a></td><td><a>One</a></td></tr></table>"
			],
			[
				"<table><tr><td>Li[nk</td></tr></table>   <table><tr><td>Thing</td><td>O]ne</td></tr></table>",
				"<table><tr><td>Li<a>nk</a></td></tr></table>   <table><tr><td><a>Thing</a></td><td><a>O</a>ne</td></tr></table>"
			],
			[
				"[<table><tr><td>One</td></tr></table> text  ]",
				"<table><tr><td><a>One</a></td></tr></table><a> text  </a>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});

	test('Elements with style', function() {
		var spanAttrs = 'style="color:red" gcn-tag="aloha"';
		var bAttrs = 'style="background: bad" gc-tag="hola" width="208px"';
		var params = [
			[
				"<p><i><b " + bAttrs + "><u>S[ome</u></b></i> <span " + spanAttrs + "><b " + bAttrs + "><i>Te]xt</i></b></span></p>",

				"<p><i><b " + bAttrs + "><u>S</u></b></i>" +
					"<a><i><b " + bAttrs + "><u>ome</u></b></i> " +
					"<span " + spanAttrs + "><b " + bAttrs + "><i>Te</i></b></span></a>" +
					"<span " + spanAttrs + "><b " + bAttrs + "><i>xt</i></b></span></p>"
			]
		];

		testWithParameters(params, testCreateAnchorsInRange);
	});


})(window.aloha);