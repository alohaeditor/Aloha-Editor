(function () {

	var data = ''
		+ '<P CLASS="western" STYLE="margin-bottom: 0in">dded fonts.</P>'
		+ '<P CLASS="western" STYLE="margin-bottom: 0in">Here is some <B>bold,',
		+ '</B><I>italic, </I><I><B>bold-italic, </B></I><U>underlined </U>and',
		+ '<STRIKE>struck out </STRIKE> text. Then, we have a super<SUP>script</SUP>',
		+ 'and a sub<SUB>script</SUB>. Now we see some <FONT COLOR="#ff0000">red</FONT>,',
		+ '<FONT COLOR="#92d050">green</FONT> and <FONT COLOR="#0070c0">blue</FONT>',
		+ 'text. Some text with a <SPAN STYLE="background: #ffff00">yellow',
		+ 'highlight</SPAN>. Some text in a box. Some text in <FONT COLOR="#ffffff"><SPAN STYLE="background: #000000">inverse',
		+ 'video</SPAN></FONT>.</P>',
		+ '<P CLASS="western" STYLE="margin-bottom: 0in">A paragraph with styled',
		+ 'text: <FONT COLOR="#808080"><I>subtle emphasis  </I></FONT>followed',
		+ 'by strong text and <FONT COLOR="#4f81bd"><I><B>intense emphasis</B></I></FONT>.',
		+ 'This paragraph uses document wide styles for styling rather than',
		+ 'inline text properties as demonstrate</P>',
		+ '';

	var expected = '';

}(aloha));
