(function (aloha) {
	'use strict';

	module('Transform');

	function t(input, expected) {
		equal(
			aloha.transform.html(input, document),
			expected,
			input + ' => ' + expected
		);
	}

	test('text/html', function () {
		/*
		// simple text
		t('some text', 'some text');

		// sequential divs
		t(
			'<div style="border: dotted">One</div> <div>Two</div> <div>Three</div>',
			'<div>One</div><div>Two</div><div>Three</div>'
		);

		// nested divs
		t(
			'<div style="border: dotted">One <div>Two</div>Three</div> <br/>',
			'<div>One <div>Two</div>Three</div><div><br></div>'
		);

		// nested divs and paragraph
		t(
			'<div style="border: dotted"><p><span>One </span></p><p><p>and a half</p></p> <div>Two</div>Three</div>',
			'<div><p>One </p><p>and a half</p><div>Two</div>Three</div>'
		);

		// divs and spans
		t(
			'<div style="border: dotted"><span>One</span> <span>and a half</span><div>Two</div>Three</div> <br/>',
			'<p>One and a half</p><p>Two</p><p>Three</p><p><br></p>'
		);

		// headers and spans div wrapper
		t(
			'<div>' +
				'<div style="border: dotted">' +
					'<h1><strong><a href="http://www.marca.com/" style="">One</a></strong></h1>' +
					'<span>and a half</span><h2>Two</h2>Three' +
				'</div>' +
				'<br/>' +
			'</div>',
			'<div>' +
				'<div>' +
					'<h1><strong><a href="http://www.marca.com/">One</a></strong></h1>' +
					'and a half<h2>Two</h2>Three' +
				'</div>' +
				'<p><br></p>' +
			'</div>'
		);

		// Wrap inline nodes
		t(
			'<h1>One</h1> <span>and a half</span><h2>Two</h2>Three',
			'<h1>One</h1><p>and a half</p><h2>Two</h2><p>Three</p>'
		);

		*/

		// Normalize illegal dom structure
		t(
			'<h1>One</h1> <strong><div><b><div><span>and</span> a half</div></b></div></strong><h2>Two</h2>Three',
			'<h1>One</h1><p>and a half</p><h2>Two</h2><p>Three</p>'
		);

		return;

		// lists
		t(
			'<meta charset=\'utf-8\'>' +
				'<b style="font-weight:normal;" id="docs-internal-guid-4e3d504e-42e4-2469-cf20-639698083828">' +
					'<ul style="margin-top:0pt;margin-bottom:0pt;">' +
						'<li dir="ltr" style="list-style-type:disc;font-size:15px;font-family:Arial;color:#000000;background-color:transparent;font-weight:normal;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;">' +
						'<p dir="ltr" style="line-height:1.15;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:15px;font-family:Arial;color:#000000;background-color:transparent;font-weight:normal;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Gets a string input and returns an string output with a valid HTML.</span></p></li>' +
						'<li dir="ltr" style="list-style-type:disc;font-size:15px;font-family:Arial;color:#000000;background-color:transparent;font-weight:normal;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;">' +
							'<span style="font-size:15px;font-family:Arial;color:#000000;background-color:transparent;font-weight:normal;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre-wrap;">Checks</span></li>' +
					'</ul>' +
				'</b>',

			'<ul>' +
				'<li><p>Gets a string input and returns an string output with a valid HTML.</p></li>' +
				'<li>Checks</li>' +
			'</ul>'
		);

		// sequential inline texts
		t(
			'<strong><a href="http://www.gentics.com/">Gentics</a></strong> This is an example <span>all together</span><div>Two</div>',
			'<p><strong><a href="http://www.gentics.com/">Gentics</a></strong> This is an example all together</p><p>Two</p>'
		);

		// font, span and br tags
		t(
			'<strong><font>This is some</font> <font>Text</font></strong><font><br/></font><br/>This is another text',
			'<p><strong>This is some Text</strong></p><p><br></p><p><br></p><p>This is another text</p>'
		);

		// list: div inside li
		t(
			'<ul>' +
				'<li><div>One</div><div><div>item</div></div></li>' +
				'<li><div>Two item</div></li>' +
			'</ul>',
			'<ul><li><p>One</p><p>item</p></li><li><p>Two item</p></li></ul>'
		);

		// list: elements inside ul
		t(
			'<ul>' +
				'<li><div>One</div><div><div>item</div></div></li>' +
				'<li><div>Two item</div></li>' +
				'<p>Paragraph</p>' +
				'<div>div</div>' +
			'</ul>',

			'<ul><li><p>One</p><p>item</p></li><li><p>Two item</p></li>' +
				'<li><p>Paragraph</p></li><li><p>div</p></li></ul>'
		);

		// list: lists inside ul
		t(
			'<ul>' +
				'<li><div>One</div><div><div>item</div></div></li>' +
				'<li><div>Two item</div></li>' +
				'<ol>Paragraph</ol>' +
			'</ul>',

			'<ul><li><p>One</p><p>item</p></li><li><p>Two item</p></li>' +
				'<ol><li>Paragraph</li></ol></li></ul>'
		);

		// whole html
		t(
			'<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">' +
			'<html>' +
			'<head>' +
				'<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">' +
				'<meta http-equiv="Content-Style-Type" content="text/css">' +
				'<title></title>' +
				'<meta name="Generator" content="Cocoa HTML Writer">' +
				'<meta name="CocoaVersion" content="1187.4">' +
				'<style type="text/css">' +
					'li.li1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica}' +
					'span.s1 {font: 12.0px \'Lucida Grande\'}' +
					'span.Apple-tab-span {white-space:pre}' +
					'ul.ul1 {list-style-type: check}' +
				'</style>' +
			'</head>' +
				'<body>' +
					'<ul class="ul1">' +
						'<li class="li1">This is some text</li>' +
						'<li class="li1">This is another text</li>' +
						'<li class="li1">And guess what? .. more text</li>' +
					'</ul>' +
					'<p class="p2"><br></p>' +
					'<p class="p2"><br></p>' +
				'</body>' +
			'</html>',

			'<ul>' +
				'<li>This is some text</li>' +
				'<li>This is another text</li>' +
				'<li>And guess what? .. more text</li>' +
			'</ul><p><br></p><p><br></p>'
		);

		// image
		t(

			'<meta charset=\'utf-8\'><p style="margin: 0.55em 0px 1.8em; padding: 0px; border: 0px; font-weight: normal; font-style: normal; font-size: 1.15em; font-family: \'Droid Sans\', Helvetica, Arial, sans-serif; vertical-align: baseline; line-height: 1.65em; color: rgb(60, 60, 60); font-variant: normal; letter-spacing: normal; orphans: inherit; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: inherit; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">Mozilla has developed Web APIs so that HTML5 apps can communicate with the device’s hardware, which was only possible for native apps until now, e.g. Bluetooth, Wi-Fi, Camera, etc.</p>' +
						'<p class="sw" style="margin: 0.55em 0px 1.8em; padding: 0px; border: 0px; font-weight: normal; font-style: normal; font-size: 12px; font-family: \'Droid Sans\', Helvetica, Arial, sans-serif; vertical-align: baseline; line-height: 1.65em; color: rgb(60, 60, 60); font-variant: normal; letter-spacing: normal; orphans: inherit; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: inherit; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">' +
							'<img src="http://media02.hongkiat.com/9-things-about-firefox-os/2-Dialer-and-Messaging.jpg" width="600" height="300" style="margin: 0px; padding: 0px; border: 0px; font-weight: inherit; font-style: inherit; font-size: 12px; font-family: inherit; vertical-align: baseline; max-width: 640px;">' +
						'</p>' +
						'<p style="margin: 0.55em 0px 1.8em; padding: 0px; border: 0px; font-weight: normal; font-style: normal; font-size: 1.15em; font-family: \'Droid Sans\', Helvetica, Arial, sans-serif; vertical-align: baseline; line-height: 1.65em; color: rgb(60, 60, 60); font-variant: normal; letter-spacing: normal; orphans: inherit; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: inherit; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255);">Mozilla Foundation has always worked to make the Web more accessible to everyone, and apart from Firefox OS, there are other tools such as the Firefox Browser, Firefox Marketplace, etc. However,<a href="http://www.engadget.com/2013/03/01/firefox-os-is-repeating-the-mistakes-of-others/" style="margin: 0px; padding: 0px; border: 0px; font-weight: inherit; font-style: inherit; font-size: 14px; font-family: inherit; vertical-align: baseline; color: rgb(19, 60, 154); text-decoration: underline;">some critics</a><span class="Apple-converted-space"> </span>report that it a Mozilla tactic<span class="Apple-converted-space"> </span><strong style="font-weight: bold;">to reach a bigger mobile audience</strong><span class="Apple-converted-space"> </span>in order to level up to its primary competitor, Chrome.</p>',

				'<p>Mozilla has developed Web APIs so that HTML5 apps can communicate with the device’s hardware, which was only possible for native apps until now, e.g. Bluetooth, Wi-Fi, Camera, etc.</p>' +
				'<p><img src="http://media02.hongkiat.com/9-things-about-firefox-os/2-Dialer-and-Messaging.jpg" height="300" width="600"/></p>' +
				'<p>Mozilla Foundation has always worked to make the Web more accessible to everyone, and apart from Firefox OS, there are other tools such as the Firefox Browser, Firefox Marketplace, etc. However,<a href="http://www.engadget.com/2013/03/01/firefox-os-is-repeating-the-mistakes-of-others/">some critics</a> report that it a Mozilla tactic <strong>to reach a bigger mobile audience</strong> in order to level up to its primary competitor, Chrome.</p>'
		);
	});

})(window.aloha);
