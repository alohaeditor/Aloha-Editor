(function (aloha) {

	'use strict';

	var WordTransform = aloha.WordTransform;

	module('MS Word Parser - Paragraph');

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

	test('parse paragraph and titles', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Title<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is more text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Other title<o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>'
		);

		isNodeEqual(htmlRes,
			'<h1>Title</h1><p>This is some text</p><p><br></p><p>This is more text</p>' +
				'<p><br></p><h1>Other title</h1><p>This is some text</p><p>This is some text</p>');
	});


	test('parse paragraph and titles with empty paragraph', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Title<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is more text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Other title<o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>' +
				'<span style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></span>'
		);

		isNodeEqual(htmlRes, '<h1>Title</h1><p>This is some text</p><p><br></p><p>This is more text</p>' +
			'<p><br></p><h1>Other title</h1><p>This is some text</p><p>This is some text</p>');
	});


	test('parse paragraph and titles', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Title<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is more text<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Other title<o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri"><span>This is some text</span><o:p></o:p></font></p>' +
				'<span style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri">This is some text<o:p></o:p></font></span>'
		);

		isNodeEqual(htmlRes, '<h1>Title</h1><p>This is some text</p><p><br></p><p>This is more text</p>' +
			'<p><br></p><h1>Other title</h1><p>This is some text</p><p>This is some text</p>');
	});

	test('parse italic bold underline', function () {
		var htmlRes = WordTransform.transform(
			'<span style=\'line-height: 107%; font-family: "Calibri","sans-serif"; font-size: 11pt; mso-ascii-theme-font: minor-latin; mso-fareast-font-family: Calibri; mso-fareast-theme-font: minor-latin; mso-hansi-theme-font: minor-latin; mso-bidi-font-family: "Times New Roman"; mso-bidi-theme-font: minor-bidi; mso-ansi-language: EN-US; mso-fareast-language: EN-US; mso-bidi-language: AR-SA;\'>' +
				'<strong>Lorem</strong></span><span style=\'line-height: 107%; font-family: "Calibri","sans-serif"; font-size: 11pt; mso-ascii-theme-font: minor-latin; mso-fareast-font-family: Calibri; mso-fareast-theme-font: minor-latin; mso-hansi-theme-font: minor-latin; mso-bidi-font-family: "Times New Roman"; mso-bidi-theme-font: minor-bidi; mso-ansi-language: EN-US; mso-fareast-language: EN-US; mso-bidi-language: AR-SA;\'> ' +
				'<sub>ipsum</sub> ' +
				'<sup>dolor</sup> <u>sit</u> ' +
				'<b style="mso-bidi-font-weight: normal;"><i style="mso-bidi-font-style: normal;">amet</i></b>' +
				', <s>consetetur</s> <u>sadipscing</u>' +
				'</span>'
		);

		isNodeEqual(htmlRes, '<p><strong>Lorem</strong> <sub>ipsum</sub> <sup>dolor</sup> <u>sit</u> ' +
			'<b><i>amet</i></b>, <s>consetetur</s> <u>sadipscing</u></p>');
	});

	test('parse italic bold underline starts with bold', function () {
		var htmlRes = WordTransform.transform(
			'<p>Paragraph before</p>' +
				'<b>Bold</b><span> This is some text <i>italic</i>.</span>' +
				'<p>Paragraph after</p>'
		);

		isNodeEqual(htmlRes,
			'<p>Paragraph before</p>' +
				'<p><b>Bold</b> This is some text <i>italic</i>.</p>' +
				'<p>Paragraph after</p>');
	});

	test('parse non-breaking-space (nbsp)', function () {

		var htmlRes = WordTransform.transform(
			'<p><b>&nbsp;</b></p><p>&nbsp</p><p><span><i>&nbsp;</i></span></p>'
		);

		isNodeEqual(htmlRes, '<p><br></p><p><br></p><p><br></p>');
	});

	test('parse images', function () {
		var htmlRes = WordTransform.transform(
			'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><b style="mso-bidi-font-weight: normal;"><i style="mso-bidi-font-style: normal;"><s><u><span style="mso-ansi-language: ES;" lang="ES"><?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p><span style="text-decoration: none;"><font face="Calibri">&nbsp;</font></span></o:p></span></u></s></i></b></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><font face="Calibri"><span style="mso-no-proof: yes;"><?xml:namespace prefix = v ns = "urn:schemas-microsoft-com:vml" /><v:shapetype id="_x0000_t75" stroked="f" filled="f" path="m@4@5l@4@11@9@11@9@5xe" o:preferrelative="t" o:spt="75" coordsize="21600,21600">' +
				'<v:stroke joinstyle="miter">' +
				'<v:formulas>' +
				'<v:f eqn="if lineDrawn pixelLineWidth 0">' +
				'<v:f eqn="sum @0 1 0">' +
				'<v:f eqn="sum 0 0 @1">' +
				'<v:f eqn="prod @2 1 2">' +
				'<v:f eqn="prod @3 21600 pixelWidth">' +
				'<v:f eqn="prod @3 21600 pixelHeight">' +
				'<v:f eqn="sum @0 0 1">' +
				'<v:f eqn="prod @6 1 2">' +
				'<v:f eqn="prod @7 21600 pixelWidth">' +
				'<v:f eqn="sum @8 21600 0">' +
				'<v:f eqn="prod @7 21600 pixelHeight">' +
				'<v:f eqn="sum @10 21600 0">' +
				'</v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:f></v:formulas>' +
				'<v:path o:connecttype="rect" gradientshapeok="t" o:extrusionok="f">' +
				'<o:lock aspectratio="t" v:ext="edit">' +
				'</o:lock></v:path></v:stroke></v:shapetype><v:shape style="width: 468pt; height: 325.5pt; visibility: visible; mso-wrap-style: square;" id="Grafik_x0020_2" type="#_x0000_t75" o:spid="_x0000_i1025">' +
				'<v:imagedata o:title="" src="file:///C:image.jpg">' +
				'</v:imagedata></v:shape><![if !supportLists]>' +
				'<img width=624 height=434' +
				' src="file:///C:img.jpg"' +
				' v:shapes="Grafik_x0020_2"><![endif]></span><span style="mso-ansi-language: ES;" lang="ES"><o:p></o:p></span></font></p>' +
				'<p style="margin: 0in 0in 0pt;" class="MsoTitle"><font size="7"><font face="Calibri Light">Title<o:p></o:p></font></font></p>' +
				'<p style="margin: 0in 0in 8pt;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>');

		isNodeEqual(htmlRes, '<p><br></p><p><img width="624" height="434">file:///C:img.jpg</p><h1>Title</h1><p><br></p>');
	});

	test('paragraph several spans', function () {
		var htmlRes = WordTransform.transform(
			'<!--StartFragment-->' +
				'<p class=MsoNormal style=\'mso-layout-grid-align:none;text-autospace:none\'><span' +
				' style=\'font-size:16.0pt;mso-bidi-font-size:13.0pt;font-family:"Segoe UI","sans-serif";' +
				'color:#FF8200;mso-bidi-font-weight:bold\'>Gentics, Vienna Austria<span' +
				' style=\'mso-tab-count:1\'>    </span><span style=\'mso-tab-count:1\'>        </span><span' +
				' style=\'mso-tab-count:1\'>        </span></span><b><span style=\'font-size:13.0pt;' +
				'font-family:"Segoe UI","sans-serif";mso-fareast-font-family:Calibri;mso-fareast-theme-font:' +
				'minor-latin\'><span style=\'mso-tab-count:1\'>          </span></span></b><span' +
				' style=\'font-size:16.0pt;mso-bidi-font-size:13.0pt;font-family:"Segoe UI","sans-serif";' +
				'color:#FF8200;mso-bidi-font-weight:bold\'><span style=\'mso-tab-count:1\'>\t</span><span' +
				' style=\'mso-tab-count:1\'>\t\t</span>09/2013 – Onwards<o:p></o:p></span></p>' +
				'<p class=MsoNormal style=\'mso-layout-grid-align:none;text-autospace:none\'><i' +
				' style=\'mso-bidi-font-style:normal\'><span style=\'font-size:12.0pt;font-family:' +
				'"Segoe UI","sans-serif";color:#FF8200;mso-bidi-font-weight:bold\'><o:p>&nbsp;</o:p></span></i></p>' +
				'<p class=MsoNormal style=\'mso-layout-grid-align:none;text-autospace:none\'><span' +
				' lang=EN-GB style=\'mso-bidi-font-size:11.0pt;font-family:"Segoe UI","sans-serif";' +
				'mso-ansi-language:EN-GB\'>Position: <b style=\'mso-bidi-font-weight:normal\'>Javascript' +
				'Developer </b></span><b><span style=\'font-size:13.0pt;font-family:"Segoe UI","sans-serif";' +
				'mso-fareast-font-family:Calibri;mso-fareast-theme-font:minor-latin\'><o:p></o:p></span></b></p>' +
				'<p class=MsoNormal style=\'mso-layout-grid-align:none;text-autospace:none\'><b><span' +
				' style=\'font-size:13.0pt;font-family:"Segoe UI","sans-serif";mso-fareast-font-family:' +
				'Calibri;mso-fareast-theme-font:minor-latin\'><span' +
				' style=\'mso-spacerun:yes\'> </span><span style=\'mso-tab-count:6\'>                                                         </span></span></b><span' +
				' style=\'mso-bidi-font-size:11.0pt;font-family:"Segoe UI","sans-serif";' +
				'mso-fareast-font-family:Calibri;mso-fareast-theme-font:minor-latin\'><o:p></o:p></span></p>' +
				'<p class=MsoListParagraphCxSpFirst style=\'text-indent:-.25in;mso-list:l0 level1 lfo1;' +
				'mso-layout-grid-align:none;text-autospace:none\'><![if !supportLists]><span' +
				' lang=EN-GB style=\'mso-bidi-font-size:11.0pt;font-family:"Courier New";' +
				'mso-fareast-font-family:"Courier New";mso-ansi-language:EN-GB\'><span' +
				' style=\'mso-list:Ignore\'>o<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;&nbsp;' +
				'</span></span></span><![endif]><span lang=EN-GB style=\'mso-bidi-font-size:11.0pt;' +
				'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>Developing open' +
				'source project for HTML5 inline editing (<a href="http://www.alohaeditor.org">www.alohaeditor.org</a>)' +
				'using native Javascript.<o:p></o:p></span></p>' +
				'<p class=MsoListParagraphCxSpLast style=\'text-indent:-.25in;mso-list:l0 level1 lfo1;' +
				'mso-layout-grid-align:none;text-autospace:none\'><![if !supportLists]><span' +
				' lang=EN-GB style=\'mso-bidi-font-size:11.0pt;font-family:"Courier New";' +
				'mso-fareast-font-family:"Courier New";mso-ansi-language:EN-GB\'><span' +
				' style=\'mso-list:Ignore\'>o<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;&nbsp;' +
				'</span></span></span><![endif]><span lang=EN-GB style=\'mso-bidi-font-size:11.0pt;' +
				'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>Agile Methodology' +
				'Kanban.<o:p></o:p></span></p>' +
				'<p class=Ralisation><span style=\'mso-ansi-language:EN-US\'><o:p>&nbsp;</o:p></span></p>' +
				'<p class=Ralisation><i style=\'mso-bidi-font-style:normal\'><span' +
				' style=\'mso-ansi-language:EN-US\'>Technical environment: WebStorm, Javascript, ECMASCRIPT,' +
				'HTML5, CSS, Kanban<o:p></o:p></span></i></p>' +
				'<!--EndFragment-->');

		isNodeEqual(htmlRes,
			'<p>Gentics, Vienna Austria                              \t\t\t09/2013 – Onwards</p>' +
				'<p><br></p>' +
				'<p>Position: <b>JavascriptDeveloper </b></p>' +
				'<p><br></p>' +
				'<ul><li>Developing opensource project for HTML5 inline editing (<a href=\"http://www.alohaeditor.org\">www.alohaeditor.org</a>)using native Javascript.</li>' +
				'<li>Agile MethodologyKanban.</li></ul>' +
				'<p><br></p>' +
				'<p><i>Technical environment: WebStorm, Javascript, ECMASCRIPT,HTML5, CSS, Kanban</i></p>');
	});


	test('paragraph with divs', function () {

		var htmlRes = WordTransform.transform(
			'<body lang=EN-US style=\'tab-interval:.5in\'>' +
				'<!--StartFragment-->' +
				'<h2><a name="_Toc359077855"><span class=MsoIntenseEmphasis><span\n' +
				'style=\'font-weight:normal\'>Paragraph level formatting</span></span></a><span\n' +
				'class=MsoIntenseEmphasis><span style=\'font-style:normal\'><o:p></o:p></span></span></h2>\n' +
				'<div style=\'mso-element:para-border-div;border:none;border-right:solid windowtext 1.0pt;\n' +
				'mso-border-right-alt:solid windowtext .5pt;padding:0in 4.0pt 0in 0in;\n' +
				'background:#DDDDDD\'> <div>\n' +
				'<p class=MsoNormal align=right style=\'text-align:right;background:#DDDDDD;\n' +
				'border:none;mso-border-right-alt:solid windowtext .5pt;padding:0in;mso-padding-alt:\n' +
				'0in 4.0pt 0in 0in\'>You can do crazy things with paragraphs, if the urge strikes' +
				' you. For instance this paragraph is right aligned and has a right border. It' +
				' has also been given a light gray background.<o:p></o:p></p>\n' +
				'</div></div>\n' +
				'<span style=\'font-size:12.0pt;mso-bidi-font-size:11.0pt;line-height:115%;\n' +
				'font-family:"Ubuntu","sans-serif";mso-fareast-font-family:Ubuntu;mso-fareast-theme-font:\n' +
				'minor-latin;mso-bidi-font-family:"Times New Roman";mso-bidi-theme-font:minor-bidi;\n' +
				'mso-ansi-language:EN-US;mso-fareast-language:EN-US;mso-bidi-language:AR-SA\'>For\n' +
				'the lovers of </span><!--EndFragment-->\n' +
				'</body>'
		);

		isNodeEqual(htmlRes,
			'<h2>Paragraph level formatting</h2>' +
				'<p>You can do crazy things with paragraphs, if the urge strikes you. For instance this paragraph is right aligned and has a right border. It has also been given a light gray background.</p>' +
				'<p>For the lovers of </p>');
	});


})(window.aloha);