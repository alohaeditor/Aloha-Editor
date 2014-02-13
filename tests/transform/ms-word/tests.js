(function (aloha) {

	'use strict';

	var WordTransform = aloha.wordTransform;

	module('MS Word Parser');

	test('is not ms-word content', function () {
		var htmlRes = 'NO MS CONTENT';
		ok(!WordTransform.isMSWordContent(htmlRes, document));
	});


	test('part heading and titles', function () {
		var htmlRes =
			'<h1 style="margin: 12pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="5"><font color="#2e74b5"><font face="Calibri Light">Heading1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></font></span></h1>' +
				'<h2 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="4"><font color="#2e74b5"><font face="Calibri Light">Heading2<o:p></o:p></font></font></font></span></h2>' +
				'<h3 style="margin: 2pt 0in 0pt;"><span style="mso-ansi-language: ES;" lang="ES"><font size="3"><font color="#1f4d78"><font face="Calibri Light">Heading3<o:p></o:p></font></font></font></span></h3>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><span style="mso-ansi-language: ES;" lang="ES"><font size="7"><font face="Calibri Light">Title<o:p></o:p></font></font></span></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoSubtitle"><span style="mso-ansi-language: ES;" lang="ES"><font color="#5a5a5a"><font face="Calibri">Subtitle<o:p></o:p></font></font></span></p>';

		ok(WordTransform.isMSWordContent(htmlRes, document));
	});


	test('class Mso*', function () {
		var htmlRes =
			'<p class=MsoNormal>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed' +
				'diam nonumy eirmod tempor invidunt ut labore et dol';

		ok(WordTransform.isMSWordContent(htmlRes, document));
	});


	test('tables after ms word parse', function () {
		var htmlRes = WordTransform.transform(
			'<table style="border: red; border-collapse: collapse; mso-border-alt: solid windowtext .5pt; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 5.4pt 0in 5.4pt;" class="MsoTableGrid" border="1" cellSpacing="0" cellPadding="0">' +
				'<tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;">' +
				'<td style="padding: 0in 5.4pt; border: 1pt solid windowtext; width: 239.4pt; background-color: transparent; mso-border-alt: solid windowtext .5pt;" vAlign="top" width="319">' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Cell 1 1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'</td>' +
				'<td style="border-width: 1pt 1pt 1pt 0px; border-style: solid solid solid none; border-color: windowtext windowtext windowtext rgb(0, 0, 0); padding: 0in 5.4pt; width: 239.4pt; background-color: transparent; mso-border-alt: solid windowtext .5pt; mso-border-left-alt: solid windowtext .5pt;" vAlign="top" width="319">' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Cell 1 2<o:p></o:p></font></p>' +
				'</td>' +
				'</tr>' +
				'<tr style="mso-yfti-irow: 1; mso-yfti-lastrow: yes;">' +
				'<td style="border-width: 0px 1pt 1pt; border-style: none solid solid; border-color: rgb(0, 0, 0) windowtext windowtext; padding: 0in 5.4pt; width: 239.4pt; background-color: transparent; mso-border-alt: solid windowtext .5pt; mso-border-top-alt: solid windowtext .5pt;" vAlign="top" width="319">' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Cell 2 1<o:p></o:p></font></p>' +
				'</td>' +
				'<td style="border-width: 0px 1pt 1pt 0px; border-style: none solid solid none; border-color: rgb(0, 0, 0) windowtext windowtext rgb(0, 0, 0); padding: 0in 5.4pt; width: 239.4pt; background-color: transparent; mso-border-alt: solid windowtext .5pt; mso-border-left-alt: solid windowtext .5pt; mso-border-top-alt: solid windowtext .5pt;" vAlign="top" width="319">' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Cell 2 2<o:p></o:p></font></p>' +
				'</td>' +
				'</tr>' +
				'</tbody></table>', document
		);

		ok(!WordTransform.isMSWordContent(htmlRes, document));
	});

	test('clean html, meta, head, body tags', function () {
		var htmlRes = WordTransform.transform(
			'<html xmlns:o="urn:schemas-microsoft-com:office:office"' +
				'xmlns:w="urn:schemas-microsoft-com:office:word"' +
				'xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"' +
				'xmlns="http://www.w3.org/TR/REC-html40">' +
				'<head>' +
				'<meta http-equiv=Content-Type content="text/html; charset=utf-8">' +
				'<meta name=ProgId content=Word.Document>' +
				'<meta name=Generator content="Microsoft Word 14">' +
				'<meta name=Originator content="Microsoft Word 14">' +
				'<link rel=File-List' +
				'href="file:///C:Users\\IEUser\\AppData\\Local\\Temp\\msohtmlclip1\\01\\clip_filelist.xml">' +
				'<style>td{}</style><body></body>', document);

		equal(htmlRes, '');
	});


	test('list MS-WORD content', function () {
		var htmlRes =
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l1 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
					'    </span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
					'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l1 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
					'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<o:p></o:p></font></span></p>' +
					'	<p style="margin: 0in 0in 8pt;" class="MsoNormal"><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Some text between' +
					'	list<o:p></o:p></font></span></p>' +
					'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
					'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">One<o:p></o:p></font></span></p>' +
					'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
					'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Two<o:p></o:p></font></span></p>' +
					'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
					'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Three<o:p></o:p></font></span></p>'
			;
		ok(WordTransform.isMSWordContent(htmlRes, document));
	});

	test('content with <br> and <hr>', function () {
		var htmlRes = WordTransform.transform(
			'<br class="" things=""><p><span>things</span> happens</p>' +
				'<hr class="" width="33%" align="" style><p>between</p>' +
				'<hr/>', document
		);

		equal(htmlRes, '<p><br></p><p>things happens</p><p><hr></p><p>between</p><p><hr></p>');
	});

})(window.aloha);