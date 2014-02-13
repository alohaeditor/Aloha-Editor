(function (aloha) {

	'use strict';

	var WordTransform = aloha.wordTransform;

	module('MS Word Parser');


	test('Simple Table', function () {
		var htmlRes = WordTransform.transform(
			'<table style="border: red; border-collapse: collapse; mso-border-alt: solid windowtext .5pt; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 5.4pt 0in 5.4pt;" class="MsoTableGrid" border="1" cellSpacing="0" cellPadding="0">' +
				'<colgroup><col></colgroup>' +
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

		equal(htmlRes,
			'<table><tbody>' +
				'<tr><td>Cell 1 1</td><td>Cell 1 2</td></tr>' +
				'<tr><td>Cell 2 1</td><td>Cell 2 2</td></tr>' +
				'</tbody></table>');
	});


	test('Tables with Paragraph inside', function () {
		var htmlRes = WordTransform.transform(
			'<table style="border: red; border-collapse: collapse; mso-border-alt: solid windowtext .5pt; mso-yfti-tbllook: 1184; mso-padding-alt: 0in 5.4pt 0in 5.4pt;" class="MsoTableGrid" border="1" cellSpacing="0" cellPadding="0">' +
				'<tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;">' +
				'<td style="padding: 0in 5.4pt; border: 1pt solid windowtext; width: 239.4pt; background-color: transparent; mso-border-alt: solid windowtext .5pt;" vAlign="top" width="319">' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Cell 1 1<?xml:namespace prefix = o ns = "urn:schemas-microsoft-com:office:office" /><o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Same cell<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Same cell<o:p></o:p></font></p>' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><o:p><font face="Calibri">&nbsp;</font></o:p></p>' +
				'<p style="margin: 0in 0in 0pt; line-height: normal;" class="MsoNormal"><font face="Calibri">Same Cell<o:p></o:p></font></p>' +
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

		equal(htmlRes,
			'<table><tbody>' +
				'<tr><td><p>Cell 1 1</p><p>Same cell</p><p><br></p><p>Same cell</p><p><br></p><p>Same Cell</p></td><td>Cell 1 2</td></tr>' +
				'<tr><td>Cell 2 1</td><td>Cell 2 2</td></tr>' +
				'</tbody></table>');
	});


	test('Tables with styles', function () {
		var htmlRest = WordTransform.transform(
			'<div align="center"><table class=MsoNormalTable border=0 cellspacing=0 cellpadding=0 width=621' +
				' style=\'margin-left:-36.2pt;border-collapse:collapse;mso-table-layout-alt:fixed;' +
				'mso-yfti-tbllook:1184;mso-padding-alt:0in 5.4pt 0in 5.4pt\'>' +
				'<tr style=\'mso-yfti-irow:0;mso-yfti-firstrow:yes\'>' +
				'<td width=409 valign=top style=\'width:306.8pt;border-top:solid #F79646 1.0pt;' +
				'mso-border-top-themecolor:accent6;border-left:none;border-bottom:solid #F79646 1.0pt;' +
				'mso-border-bottom-themecolor:accent6;border-right:none;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=Position align=center style=\'text-align:center\'><span lang=EN-GB' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>Competences<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=99 valign=top style=\'width:73.9pt;border-top:solid #F79646 1.0pt;' +
				'mso-border-top-themecolor:accent6;border-left:none;border-bottom:solid #F79646 1.0pt;' +
				'mso-border-bottom-themecolor:accent6;border-right:none;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=Position align=center style=\'text-align:center\'><span lang=FR-BE' +
				' style=\'font-family:"Segoe UI","sans-serif"\'>Level<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=113 valign=top style=\'width:85.05pt;border-top:solid #F79646 1.0pt;' +
				'mso-border-top-themecolor:accent6;border-left:none;border-bottom:solid #F79646 1.0pt;' +
				'mso-border-bottom-themecolor:accent6;border-right:none;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=Position align=center style=\'text-align:center\'><span lang=FR-BE' +
				' style=\'font-family:"Segoe UI","sans-serif"\'>Experience<o:p></o:p></span></p>' +
				'</td>' +
				'</tr>' +
				'<tr style=\'mso-yfti-irow:1\'>' +
				'<td width=409 valign=top style=\'width:306.8pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-bottom-alt:solid gray .5pt;mso-border-bottom-themecolor:background1;' +
				'mso-border-bottom-themeshade:128;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=EN-GB' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>java<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=99 valign=top style=\'width:73.9pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-bottom-alt:solid gray .5pt;mso-border-bottom-themecolor:background1;' +
				'mso-border-bottom-themeshade:128;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=FR' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:FR\'>Advanced<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=113 valign=top style=\'width:85.05pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-top-alt:solid #F79646 1.0pt;mso-border-top-themecolor:accent6;' +
				'mso-border-bottom-alt:solid gray .5pt;mso-border-bottom-themecolor:background1;' +
				'mso-border-bottom-themeshade:128;padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=FR' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:FR\'>4 years<o:p></o:p></span></p>' +
				'</td>' +
				'</tr>' +
				'<tr style=\'mso-yfti-irow:2\'>' +
				'<td width=409 valign=top style=\'width:306.8pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=EN-GB' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>Web<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=99 valign=top style=\'width:73.9pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span' +
				' style=\'font-family:"Segoe UI","sans-serif"\'>Medium<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=113 valign=top style=\'width:85.05pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span' +
				' style=\'font-family:"Segoe UI","sans-serif"\'>3 years<o:p></o:p></span></p>' +
				'</td>' +
				'</tr>' +
				'<tr style=\'mso-yfti-irow:3;mso-yfti-lastrow:yes\'>' +
				'<td width=409 valign=top style=\'width:306.8pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=FR' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:FR\'>mobile<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=99 valign=top style=\'width:73.9pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span lang=EN-GB' +
				' style=\'font-family:"Segoe UI","sans-serif";mso-ansi-language:EN-GB\'>Medium<o:p></o:p></span></p>' +
				'</td>' +
				'<td width=113 valign=top style=\'width:85.05pt;border:none;border-bottom:solid gray 1.0pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:background1;' +
				'mso-border-top-themeshade:128;mso-border-top-alt:solid gray .5pt;mso-border-top-themecolor:' +
				'background1;mso-border-top-themeshade:128;mso-border-bottom-alt:solid gray .5pt;' +
				'mso-border-bottom-themecolor:background1;mso-border-bottom-themeshade:128;' +
				'padding:0in 5.4pt 0in 5.4pt\'>' +
				'<p class=MsoNormal align=center style=\'text-align:center\'><span' +
				' style=\'font-family:"Segoe UI","sans-serif"\'>3 years<o:p></o:p></span></p>' +
				'</td>' +
				'</tr>' +
				'</table></div>', document);

		equal(htmlRest, '<table><tbody>' +
			'<tr><td>Competences</td><td>Level</td><td>Experience</td></tr><tr><td>java</td><td>Advanced</td><td>4 years</td></tr>' +
			'<tr><td>Web</td><td>Medium</td><td>3 years</td></tr>' +
			'<tr><td>mobile</td><td>Medium</td><td>3 years</td></tr>' +
			'</tbody></table>');
	});


})(window.aloha);