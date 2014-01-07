(function (aloha) {

	'use strict';

	var WordTransform = aloha.WordTransform;

	module('MS Word Parser');

	test('heading and titles wrong text', function () {
		var htmlRes = WordTransform.transform(
			'<h1 style="margin: 12pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="5"><font color="#2e74b5"><font face="Calibri Light">Heading1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></font></span></h1>' +
				'<h2 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="4"><font color="#2e74b5"><font face="Calibri Light">Heading2<o:p></o:p></font></font></font></span></h2>' +
				'<h3 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="3"><font color="#1f4d78"><font face="Calibri Light">Heading3<o:p></o:p></font></font></font></span></h3>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><span style="mso-ansi-language: ES;" lang="ES"><font size="7"><font face="Calibri Light">Title<o:p></o:p></font></font></span></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoSubtitle"><span style="mso-ansi-language: ES;" lang="ES"><font color="#5a5a5a"><font face="Calibri">Subtitle<o:p></o:p></font></font></span></p>'
		);

		notEqual(htmlRes, '<h1>Heading1</h1><h2>Heading2</h2><h3>Heading3</h3><h1>WRONG</h1><h2>Subtitle</h2>');
	});


	test('heading and titles', function () {
		var htmlRes = WordTransform.transform(
			'<h1 style="margin: 12pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="5"><font color="#2e74b5"><font face="Calibri Light">Heading1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></font></span></h1>' +
				'<h2 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="4"><font color="#2e74b5"><font face="Calibri Light">Heading2<o:p></o:p></font></font></font></span></h2>' +
				'<h3 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="3"><font color="#1f4d78"><font face="Calibri Light">Heading3<o:p></o:p></font></font></font></span></h3>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><span style="mso-ansi-language: ES;" lang="ES"><font size="7"><font face="Calibri Light">Title<o:p></o:p></font></font></span></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoSubtitle"><span style="mso-ansi-language: ES;" lang="ES"><font color="#5a5a5a"><font face="Calibri">Subtitle<o:p></o:p></font></font></span></p>'
		);

		equal(htmlRes, '<h1>Heading1</h1><h2>Heading2</h2><h3>Heading3</h3><h1>Title</h1><h2>Subtitle</h2>');
	});


	test('parse title subtitle inside div', function () {
		var htmlRes = WordTransform.transform(
			'<div style="mso-element:para-border-div;border:none;border-bottom:solid #5B9BD5 1.0pt;' +
				'mso-border-bottom-themecolor:accent1;padding:0in 0in 4.0pt 0in">' +
				'<p class="MsoTitle"><span lang="ES">Title<o:p></o:p></span></p>' +
				'</div>' +
				'<p class="MsoSubtitle"><span lang="ES">Subtitle<o:p></o:p></span></p>'
		);

		equal(htmlRes, "<h1>Title</h1><h2>Subtitle</h2>");
	});


	test('parser title subtile', function () {
		var htmlRes = WordTransform.transform(
			'<p class="MsoTitle"><span lang="ES">My title<o:p></o:p></span></p>' +
				'<p class="MsoSubtitle"><span lang="ES">Subtitle<o:p></o:p></span></p>'
		);
		equal(htmlRes, '<h1>My title</h1><h2>Subtitle</h2>');
	});

	/**
	 * Test parsing Headings
	 */
	test('parse headings', function () {
		var htmlRes = WordTransform.transform(
			'<h1 style="margin: 12pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="5"><font color="#2e74b5"><font face="Calibri Light">Heading 1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></font></span></h1>' +
				'<h2 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="4"><font color="#2e74b5"><font face="Calibri Light">Heading 2<o:p></o:p></font></font></font></span></h2>' +
				'<h3 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="3"><font color="#1f4d78"> <font face="Calibri Light">Heading 3<o:p></o:p></font></font></font></span></h3>');

		equal(htmlRes, '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>');
	});

})(window.aloha);