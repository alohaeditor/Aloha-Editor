(function (aloha) {

	'use strict';

	var WordTransform = aloha.WordTransform;

	module('MS Word Parser');

	/**
	 * Check if the two nodes are equal
	 *
	 * @param src
	 * @param test
	 */
	function isNodeEqual(src, test) {
		var srcElement = document.createElement('div'),
			testElement = document.createElement('div');

		srcElement.innerHTML = src;
		testElement.innerHTML = test;

		equal(srcElement.innerHTML, testElement.innerHTML);
	}

	function isNotNodeEqual(src, test) {
		var srcElement = document.createElement('div'),
			testElement = document.createElement('div');

		srcElement.innerHTML = src;
		testElement.innerHTML = test;

		notEqual(srcElement.innerHTML, testElement.innerHTML);
	}

	/**
	 * Test parsing the list
	 */
	test('ordered list wrong list Type', function () {
		var htmlRes = WordTransform.transform('<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">First<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Second<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Third<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">4.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Fourth<o:p></o:p></font></span></p>');

		isNotNodeEqual(htmlRes, '<ol start="1" type="2"><li>First</li><li>Second</li><li>Third</li><li>Fourth</li></ol>');
	});

	/**
	 * Test parsing the list
	 */
	test('ordered list wrong number of li', function () {
		var htmlRes = WordTransform.transform('<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">First<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Second<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Third<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">4.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Fourth<o:p></o:p></font></span></p>');

		isNotNodeEqual(htmlRes, '<ol start="1" type="1"><li>First</li><li>Third</li><li>Fourth</li></ol>');
	});


	/**
	 * Test parsing the list
	 */
	test('parse ordered list', function () {
		var htmlRes = WordTransform.transform('<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">First<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Second<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Third<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">4.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Fourth<o:p></o:p></font></span></p>');

		isNodeEqual(htmlRes, '<ol start="1" type="1"><li>First</li><li>Second</li><li>Third</li><li>Fourth</li></ol>');
	});

	/**
	 * Test parsing the list
	 */
	test('parse ordered list multilevel', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES">\n\n<span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'\n<!--This is a comment--></span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">1111<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span>\n\n<!--This is a commment--></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">2222<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -1.5in; mso-list: l0 level3 lfo1; mso-add-space: auto; mso-text-indent-alt: -9.0pt;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span><font face="Calibri">i.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">aaaaa<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">333<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">4.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">4444<o:p></o:p></font></span></p>');

		isNodeEqual(htmlRes, '<ol start="1" type="1"><li>1111</li><li>2222</li><ol><ol type="i"><li>aaaaa</li></ol></ol><li>333</li><li>4444</li></ol>');
	});


	/**
	 * Test parsing the list
	 */
	test('parse ordered list last item is empty', function () {
		var htmlRes = WordTransform.transform('<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">First<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1 ; border: none" class="MsoListParagraphCxSpMiddle"><!--This is a commment--><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Second<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Third<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1" class="MsoListParagraphCxSpMiddle">\n<!--This is a commment--><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">4.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
			'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Fourth<o:p></o:p></font></span></p>' +
			'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">5.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

		isNodeEqual(htmlRes, '<ol start="1" type="1"><li>First</li><li>Second</li><li>Third</li><li>Fourth</li><li></li></ol>');
	});


	/**
	 * Test parsing the list
	 */
	test('parse unorderd list empty item', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst">\n<!--This is a commment--><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><!--This is a commment--><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Aaaaa<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bbbbb<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">&nbsp;<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><o:p><font face="Calibri">Ccccc</font></o:p></span></p>');

		isNodeEqual(htmlRes, '<ul><li>Aaaaa</li><li>Bbbbb</li><li></li><li>Ccccc</li></ul>');
	});


	test('parse unorder and ordered list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -0.25in; mso-list: l0 level3 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Numeric<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 8pt 1.5in; text-indent: -0.25in; mso-list: l0 level3 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Numeric<o:p></o:p></font></span></p>'
		);

		isNodeEqual(htmlRes, '<ul><li>Bullet</li><ol><ol start="1" type="1"><li>Numeric</li></ol></ol><li>Bullet</li><ol><ol start="1" type="1"><li>Numeric</li></ol></ol></ul>');
	});


	test('parse unorder and ordered list spaces between', function () {
		var htmlRes = WordTransform.transform(
			'  \n<div>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +

				'     \n<p style="margin: 0in 0in 0pt 1.5in; text-indent: -0.25in; mso-list: l0 level3 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Numeric<o:p></o:p></font></span></p>' +

				'\n<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 8pt 1.5in; text-indent: -0.25in; mso-list: l0 level3 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Numeric<o:p></o:p></font></span></p>' +
				'</div>'
		);

		isNodeEqual(htmlRes, '<ul><li>Bullet</li><ol><ol start="1" type="1"><li>Numeric</li></ol></ol><li>Bullet</li>' +
			'<ol><ol start="1" type="1"><li>Numeric</li></ol></ol></ul>');
	});

	test('parse unorder and ordered list spaces between and text', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l1 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'    </span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l1 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bullet<o:p></o:p></font></span></p>' +

				'	<p style="margin: 0in 0in 8pt;" class="MsoNormal"><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Some text between' +
				'\t   list<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpFirst"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">One<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpMiddle"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Two<o:p></o:p></font></span></p>' +

				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo2;" class="MsoListParagraphCxSpLast"><span style="mso-ansi-language: ES; mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Three<o:p></o:p></font></span></p>'
		);

		isNodeEqual(htmlRes, '<ul><li>Bullet</li><li>Bullet</li></ul><p>Some text between\t   list</p><ol start="1" type="1"><li>One</li><li>Two</li><li>Three</li></ol>');
	});


	/**
	 * Test parsing the list
	 */
	test('parse unorderd list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Aaaaa<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Bbbbb<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-list: l0 level2 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpMiddle"><span style=\'font-family: "Courier New"; mso-ansi-language: ES; mso-fareast-font-family: "Courier New";\' lang="ES"><span style="mso-list: Ignore;">o<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">B.aaa<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-list: l0 level2 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpMiddle"><span style=\'font-family: "Courier New"; mso-ansi-language: ES; mso-fareast-font-family: "Courier New";\' lang="ES"><span style="mso-list: Ignore;">o<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">B.bbb<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -0.25in; mso-list: l0 level3 lfo1; mso-add-space: auto;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Wingdings; mso-ansi-language: ES; mso-fareast-font-family: Wingdings; mso-bidi-font-family: Wingdings;" lang="ES"><span style="mso-list: Ignore;">§<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp; </span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">B.bbb.aaa<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Ccccc<o:p></o:p></font></span></p>' +
				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="font-family: Symbol; mso-ansi-language: ES; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;" lang="ES"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><o:p><font face="Calibri">&nbsp;</font></o:p></span></p>');

		isNodeEqual(htmlRes, '<ul><li>Aaaaa</li><li>Bbbbb</li><ul><li>B.aaa</li><li>B.bbb</li><ul><li>B.bbb.aaa</li></ul></ul><li>Ccccc</li><li></li></ul>');
	});


	test('transform ordered and multiple undored list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 45pt; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><b style="mso-bidi-font-weight: normal;"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span></b><b style="mso-bidi-font-weight: normal;"><font face="Calibri">One<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></b></p>' +
				'<p style="margin: 0in 0in 0pt 81pt; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><b style="mso-bidi-font-weight: normal;"><font face="Calibri">Unordered<o:p></o:p></font></b></p>' +
				'<p style="margin: 0in 0in 0pt 45pt; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><b style="mso-bidi-font-weight: normal;"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span></b><b style="mso-bidi-font-weight: normal;"><font face="Calibri">Two<o:p></o:p></font></b></p>' +
				'<p style="margin: 0in 0in 0pt 117pt; text-indent: -117pt; mso-add-space: auto; mso-list: l0 level3 lfo1; mso-text-indent-alt: -9.0pt;" class="MsoListParagraphCxSpMiddle"><b style="mso-bidi-font-weight: normal;"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span><font face="Calibri">i.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span></b><b style="mso-bidi-font-weight: normal;"><font face="Calibri">Three One<o:p></o:p></font></b></p>' +
				'<p style="margin: 0in 0in 0pt 81pt; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><b style="mso-bidi-font-weight: normal;"><font face="Calibri">Unordered<o:p></o:p></font></b></p>' +
				'<p style="margin: 0in 0in 8pt 45pt; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><b style="mso-bidi-font-weight: normal;"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">3.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></span></b><b style="mso-bidi-font-weight: normal;"><font face="Calibri">Four<o:p></o:p></font></b></p>'
		);

		isNodeEqual(htmlRes,
			'<ol start="1" type="1">' +
				'<li><b>One</b></li>' +
				'<ul><li><b>Unordered</b></li>' +
				'</ul><li><b>Two</b></li>' +
				'<ul><ol type="i"><li><b>Three One</b></li></ol>' +
				'<li><b>Unordered</b></li></ul>' +
				'<li><b>Four</b></li>' +
				'</ol>');
	});


	test('transform list of level 2', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">a.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Cero<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">b.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">One<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">c.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">d.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Three<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">e.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Four<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">f.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Five<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes, '<ol type="a"><ol type="a"><li>Cero</li><li>One</li><li>Two</li><li>Three</li><li>Four</li><li>Five</li></ol></ol>');
	});


	test('transform copy level 6 of list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">a.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Cero<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level7 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">b.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">One<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level7 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">c.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">d.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Three<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">e.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Four<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">f.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Five<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes, '<ol type="a"><ol><ol><ol><ol><ol type="a"><li>Cero</li><ol type="a"><li>One</li><li>Two</li></ol><li>Three</li><li>Four</li><li>Five</li></ol></ol></ol></ol></ol></ol>');
	});

	test('transform copy level several levels of list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">a.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Cero<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level5 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">b.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">One<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level5 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">c.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">d.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Three<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">e.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Four<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level6 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">f.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Five<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes, '<ol type="a"><ol><ol><ol><ol type="a"><ol type="a"><li>Cero</li></ol><li>One</li><li>Two</li><ol type="a"><li>Three</li><li>Four</li><li>Five</li></ol></ol></ol></ol></ol></ol>');
	});


	test('big multilevel test', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">7.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">One<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">a.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -9pt; mso-add-space: auto; mso-list: l0 level3 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Unordered<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 2in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level4 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">1<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 2.5in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level5 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">a.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">A<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 3in; text-indent: -3in; mso-add-space: auto; mso-list: l0 level6 lfo1; mso-text-indent-alt: -9.0pt;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span><font face="Calibri">i.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">I<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 3.5in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level7 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Unordered<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 3in; text-indent: -3in; mso-add-space: auto; mso-list: l0 level6 lfo1; mso-text-indent-alt: -9.0pt;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span><font face="Calibri">ii.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">II<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 2.5in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level5 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">b.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">B<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 2in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level4 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">2<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -9pt; mso-add-space: auto; mso-list: l0 level3 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Unordered<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 1in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level2 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">b.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">B<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes,
			'<ol start="7" type="1">' +
				'<li>One</li>' +
				'<ol type="a">' +
				'<li>Two</li>' +
				'<ul>' +
				'<li>Unordered</li>' +
				'<ol start="1" type="1">' +
				'<li>1</li>' +
				'<ol type="a">' +
				'<li>A</li>' +
				'<ol type="i">' +
				'<li>I</li>' +
				'<ul>' +
				'<li>Unordered</li>' +
				'</ul>' +
				'<li>II</li>' +
				'</ol>' +
				'<li>B</li>' +
				'</ol>' +
				'<li>2</li>' +
				'</ol>' +
				'<li>Unordered</li>' +
				'</ul>' +
				'<li>B</li>' +
				'</ol>' +
				'<li>Two</li>' +
				'</ol>');
	});

	test('mess up level list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 1.5in; text-indent: -9pt; mso-add-space: auto; mso-list: l0 level3 lfo1;" class="MsoListParagraphCxSpFirst"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Unordered<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 3in; text-indent: -3in; mso-add-space: auto; mso-list: l0 level6 lfo1; mso-text-indent-alt: -9.0pt;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span><font face="Calibri">i.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">sdfs<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpMiddle"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">' +
				'6.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Five<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 3.5in; text-indent: -0.25in; mso-add-space: auto; mso-list: l0 level7 lfo1;" class="MsoListParagraphCxSpLast"><span style="font-family: Symbol; mso-fareast-font-family: Symbol; mso-bidi-font-family: Symbol;"><span style="mso-list: Ignore;">·<span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Things<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes, '<ol start="6" type="1"><ul><ul><li>Unordered</li><ol><ol><ol type="i"><li>sdfs</li></ol></ol></ol></ul></ul><li>Five</li><ul><ul><ul><ul><ul><ul><li>Things</li></ul></ul></ul></ul></ul></ul></ol>');
	});

	test('list with italic and bold content', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpFirst"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Two<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraphCxSpLast"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin;"><span style="mso-list: Ignore;"><font face="Calibri">2.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><font face="Calibri">Asdfasdf<font size="2"><sub>222</sub><sup>33333</sup><o:p></o:p></font></font></p>'
		);

		isNodeEqual(htmlRes, '<ol start="1" type="1"><li>Two</li><li>Asdfasdf<sub>222</sub><sup>33333</sup></li></ol>');
	});

	test('just one li element list', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 8pt 0.5in; text-indent: -0.25in; mso-list: l0 level1 lfo1;" class="MsoListParagraph"><span style="mso-bidi-font-family: Calibri; mso-bidi-theme-font: minor-latin; mso-ansi-language: ES;" lang="ES"><span style="mso-list: Ignore;"><font face="Calibri">1.</font><span style=\'font: 7pt/normal "Times New Roman"; font-size-adjust: none; font-stretch: normal;\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><span style="mso-ansi-language: ES;" lang="ES"><font face="Calibri">Things<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></span></p>'
		);

		isNodeEqual(htmlRes, '<ol start="1" type="1"><li>Things</li></ol>');
	});

	test('list with paragrpah between item list', function () {
		var htmlRes = WordTransform.transform(
			'<p class=MsoListParagraphCxSpFirst style=\'margin-left:1.1in;mso-add-space:auto;' +
				'text-indent:-.35in;mso-list:l0 level3 lfo1\'><![if !supportLists]><span' +
				' style=\'mso-fareast-font-family:Ubuntu;mso-bidi-font-family:Ubuntu\'><span' +
				' style=\'mso-list:Ignore\'>1.1.1.<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><![endif]>working correctly.<o:p></o:p></p>' +
				'<p class=MsoListParagraphCxSpMiddle style=\'margin-left:1.1in;mso-add-space:' +
				'auto;text-indent:-.35in;mso-list:l0 level3 lfo1\'><![if !supportLists]><span' +
				' style=\'mso-fareast-font-family:Ubuntu;mso-bidi-font-family:Ubuntu\'><span' +
				' style=\'mso-list:Ignore\'>1.1.2.<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
				'</span></span></span><![endif]>Five<o:p></o:p></p>' +
				'<p class=MsoListParagraphCxSpMiddle style=\'text-indent:-.25in;mso-list:l0 level1 lfo1\'><![if !supportLists]><b' +
				' style=\'mso-bidi-font-weight:normal\'><i style=\'mso-bidi-font-style:normal\'><span' +
				' style=\'mso-fareast-font-family:Ubuntu;mso-bidi-font-family:Ubuntu\'><span' +
				' style=\'mso-list:Ignore\'>2.<span style=\'font:7.0pt "Times New Roman"\'>&nbsp; </span></span></span></i></b><![endif]><b' +
				' style=\'mso-bidi-font-weight:normal\'><i style=\'mso-bidi-font-style:normal\'><u>Six<o:p></o:p></u></i></b></p>' +
				'<p class=MsoListParagraphCxSpMiddle style=\'margin-left:.25in;mso-add-space:' +
				'auto;text-indent:0in\'><b style=\'mso-bidi-font-weight:normal\'><i' +
				' style=\'mso-bidi-font-style:normal\'><s><u><span style=\'color:red;background:' +
				'yellow;mso-highlight:yellow\'>A Multi-level list with bullets</span></u></s></i></b>:<o:p></o:p></p>' +
				'<p class=MsoListParagraphCxSpLast style=\'text-indent:-.25in;mso-list:l1 level1 lfo2\'><![if !supportLists]><span' +
				' style=\'font-family:Wingdings;mso-fareast-font-family:Wingdings;mso-bidi-font-family:' +
				'Wingdings\'><span style=\'mso-list:Ignore\'>§<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;' +
				'</span></span></span><![endif]>One<o:p></o:p></p>'
		);

		isNodeEqual(htmlRes,
			'<ol start="2" type="1"><ul><ul><li>working correctly.</li><li>Five</li></ul></ul>' +
				'<li><b><i><u>Six</u></i></b></li></ol><p><b><i><s><u>A Multi-level list with bullets</u></s></i></b>:</p><ul><li>One</li></ul>');
	});

})(window.aloha);