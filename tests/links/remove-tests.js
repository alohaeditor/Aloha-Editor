(function (aloha, module, test, equal) {
	'use strict';

	var Links = aloha.links;
	var Markers = aloha.markers;

	module('links');

	function run(before, after) {
		var dom = $('<div>' + before + '</div>')[0];
		var boundaries = Markers.extract(dom);
		Links.remove(boundaries[0], boundaries[1]);
		equal(dom.innerHTML, after);
	}

	test('Remove Anchors', function () {
		var href = 'http://www.aloha-editor.org';
		[
			[
				'<p>S<a href="' + href + '">ome T[]e</a>xt</p>',
				'<p>Some Text</p>'
			], [
				'<p>S<a href="' + href + '">ome Te</a>xt[</p>]',
				'<p>S<a href="' + href + '">ome Te</a>xt</p>'
			], [
				'<p>S<a href="' + href + '">ome Te</a>xt[</p> <a>mylink</a>]',
				'<p>S<a href="' + href + '">ome Te</a>xt</p> mylink'
			], [
				'<p>S<a href="' + href + '">o[me T]e</a>xt</p>',
				'<p>Some Text</p>'
			], [
				'[<p>S<a href="' + href + '">ome Te</a>xt</p>  <p><a>Something</a></p>]',
				'<p>Some Text</p>  <p>Something</p>'
			], [
				'<p>[<b>S</b><a href="' + href + '"><b>ome</b> Te</a>xt]</p>',
				'<p><b>Some</b> Text</p>'
			], [
				'<p>[<b style="width: 100px"><i>italic </i>S</b><a href="' +
					href + '"><b>ome</b> Te</a>xt]</p>',
				'<p><b style="width: 100px"><i>italic </i>S</b><b>ome</b> Text</p>'
			], [
				'<p><b>S</b><a href="' + href + '"><b>o[me </b></a></p>  ' +
					'<p><a href="' + href + '">Some</a></p> ' +
					'<p><a href="' + href + '"> T]e</a>xt</p>',
				'<p><b>Some </b></p>  <p>Some</p> <p> Text</p>'
			], [
				'<p><br>[</p> <p><a><b>Some</b>] Text</a></p>  <p><br></p>',
				'<p><br></p> <p><b>Some</b> Text</p>  <p><br></p>'
			], [
				'<p><i><b><u>S</u></b></i>' +
					'<a>[<i><b><u>ome</u></b></i> ' +
					'<span><b><i>Te</i></b>]</span></a>' +
					'<span><b><i>xt</i></b></span></p>',
				'<p><i><b><u>Some</u></b></i> <span><b><i>Text</i></b></span></p>'
			]
		].forEach(function (parts) {
			run(parts[0], parts[1]);
		});
	});

	test('Remove anchors in lists', function () {
		[
			[
				'<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Link</b></i></a><i><b> 2</b></i>]</li></ul>',
				'<ul> <li> <span>Link</span></li>  <li><i><b>Link 2</b></i></li></ul>'

			], [
				'<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a><i><b> 2</b>]</i></li></ul>',
				'<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>'
			], [
				'<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a>]<i><b> 2</b></i></li></ul>',
				'<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>'

			], [
				'<ul> <li> <span>L[i</span><a><span>nk</span></a></li>  <li><a><i><b>Something</b></i></a><i>]<b> 2</b></i></li></ul>',
				'<ul> <li> <span>Link</span></li>  <li><i><b>Something 2</b></i></li></ul>'

			], [
				'<dl><dt>Title</dt><dd>[te<a>xt</a></dd></dl> <dl><dt><a>Title</a></dt><dd><a>t]e</a>xt</dd></dl>',
				'<dl><dt>Title</dt><dd>text</dd></dl> <dl><dt>Title</dt><dd>text</dd></dl>'
			]
		].forEach(function (parts) {
			run(parts[0], parts[1]);
		});
	});

	test('Remove anchors in tables', function () {
		[
			[
				'<table><tbody><tr><td>Li[<a>nk</a></td></tr></tbody></table>   ' +
					'<table><tbody><tr><td><a>Thing</a></td><td><a>O]</a>ne</td></tr></tbody></table>',
				'<table><tbody><tr><td>Link</td></tr></tbody></table>   <table><tbody><tr><td>Thing</td><td>One</td></tr></tbody></table>'
			],
			[
				'<table><tbody><tr><td>Li<a>nk[</a></td></tr></tbody></table>   ' +
					'<table><tbody><tr><td><a>Thing</a></td><td><a>]O</a>ne</td></tr></tbody></table>',
				'<table><tbody><tr><td>Link</td></tr></tbody></table>   <table><tbody><tr><td>Thing</td><td>One</td></tr></tbody></table>'
			],
			[
				'<table><tbody><tr><td>Li<a>nk</a>[</td></tr></tbody></table>   ' +
					'<table><tbody><tr><td><a>Thing</a></td><td><a>]O</a>ne</td></tr></tbody></table>',
				'<table><tbody><tr><td>Li<a>nk</a></td></tr></tbody></table>   <table><tbody><tr><td>Thing</td><td>One</td></tr></tbody></table>'
			]
		].forEach(function (parts) {
			run(parts[0], parts[1]);
		});
	});

})(window.aloha, window.module, window.test, window.equal);
