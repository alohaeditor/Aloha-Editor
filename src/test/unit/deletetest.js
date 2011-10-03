var tests = {
	defaultCommand: 'delete',
	tests: [		        
//		{  	start: '[]foo',
//			execResult: '[]foo'
//		},
//		{  	start: '<span>[]foo</span>',
//			execResult: '<span>[]foo</span>'
//		},
//		{  	start: '<span>{}</span>',
//			execResult: '{}<span></span>'
//		},
//		{  	start: '<span>{}<br></span>',
//			execResult: '<span>{}<br></span>'
//		},
//		{  	start: '<span><br>{}</span>',
//			execResult: '<span>{}<br></span>'
//		},
//		{  	start: '<span><br>{}<br></span>',
//			execResult: '<span>{}<br></span>'
//		},
//		{  	start: '<p>[]foo</p>',
//			execResult: '<p>[]foo</p>'
//		},
//		{  	start: '<p>{}</p>',
//			execResult: '{}<p></p>'
//		},
//		{  	start: '<p>{}<br></p>',
//			execResult: '<p>{}<br></p>'
//		},
//		{  	start: '<p><br>{}</p>',
//			execResult: '<p>{}<br></p>'
//		},
//		{  	start: '<p><br>{}<br></p>',
//			execResult: '<p>{}<br></p>'
//		},
//		{  	start: 'foo[]bar',
//			execResult: 'fo[]bar'
//		},
//		{  	start: '<span>foo</span>{}<span>bar</span>',
//			execResult: '<span>fo[]</span><span>bar</span>'
//		},
//		{  	start: '<span>foo[</span><span>]bar</span>',
//			execResult: '<span>fo[]</span><span>bar</span>'
//		},
//		{  	start: 'foo<span style=display:none>bar</span>[]baz',
//			execResult: 'fooba[]</span>baz'
//		},
////		{  	start: 'foo<script>bar</script>[]baz',
////			execResult: 'foo<script>bar</script>[]baz'
////		},
//	
		{  	start: 'fo&ouml;[]bar',
			execResult: 'fo&ouml;[]bar'
		},
		{  	start: 'foo&#x308;[]bar',
			execResult: 'foo&#x308;[]bar'
		},
		{  	start: 'foo&#x308;&#x327;[]bar',
			execResult: 'foo&#x308;&#x327;[]bar'
		},
		{  	start: '&ouml;[]bar',
			execResult: '&ouml;[]bar'
		},
		{  	start: 'o&#x308;[]bar',
			execResult: 'o&#x308;[]bar'
		},
		{  	start: 'o&#x308;&#x327;[]bar',
			execResult: 'o&#x308;&#x327;[]bar'
		},
	
		{  	start: '&#x5e9;&#x5c1;&#x5b8;[]&#x5dc;&#x5d5;&#x5b9;&#x5dd;',
			execResult: '&#x5e9;&#x5c1;&#x5b8;[]&#x5dc;&#x5d5;&#x5b9;&#x5dd;'
		},
		{  	start: '&#x5e9;&#x5c1;&#x5b8;&#x5dc;&#x5d5;&#x5b9;[]&#x5dd;',
			execResult: '&#x5e9;&#x5c1;&#x5b8;&#x5dc;&#x5d5;&#x5b9;[]&#x5dd;'
		},
	
		{  	start: '<p>foo</p><p>[]bar</p>',
			execResult: '<p>foo</p><p>[]bar</p>'
		},
		{  	start: '<p>foo</p>[]bar',
			execResult: '<p>foo</p>[]bar'
		},
		{  	start: 'foo<p>[]bar</p>',
			execResult: 'foo<p>[]bar</p>'
		},
		{  	start: '<p>foo<br></p><p>[]bar</p>',
			execResult: '<p>foo<br></p><p>[]bar</p>'
		},
		{  	start: '<p>foo<br></p>[]bar',
			execResult: '<p>foo<br></p>[]bar'
		},
		{  	start: 'foo<br><p>[]bar</p>',
			execResult: 'foo<br><p>[]bar</p>'
		},
		{  	start: '<p>foo<br><br></p><p>[]bar</p>',
			execResult: '<p>foo<br><br></p><p>[]bar</p>'
		},
		{  	start: '<p>foo<br><br></p>[]bar',
			execResult: '<p>foo<br><br></p>[]bar'
		},
		{  	start: 'foo<br><br><p>[]bar</p>',
			execResult: 'foo<br><br><p>[]bar</p>'
		},
	
		{  	start: '<div><p>foo</p></div><p>[]bar</p>',
			execResult: '<div><p>foo</p></div><p>[]bar</p>'
		},
		{  	start: '<p>foo</p><div><p>[]bar</p></div>',
			execResult: '<p>foo</p><div><p>[]bar</p></div>'
		},
		{  	start: '<div><p>foo</p></div><div><p>[]bar</p></div>',
			execResult: '<div><p>foo</p></div><div><p>[]bar</p></div>'
		},
		{  	start: '<div><p>foo</p></div>[]bar',
			execResult: '<div><p>foo</p></div>[]bar'
		},
		{  	start: 'foo<div><p>[]bar</p></div>',
			execResult: 'foo<div><p>[]bar</p></div>'
		},
	
		{  	start: '<div>foo</div><div>[]bar</div>',
			execResult: '<div>foo</div><div>[]bar</div>'
		},
		{  	start: '<pre>foo</pre>[]bar',
			execResult: '<pre>foo</pre>[]bar'
		},
	
		{  	start: 'foo<br>[]bar',
			execResult: 'foo<br>[]bar'
		},
		{  	start: 'foo<br><b>[]bar</b>',
			execResult: 'foo<br><b>[]bar</b>'
		},
		{  	start: 'foo<hr>[]bar',
			execResult: 'foo<hr>[]bar'
		},
		{  	start: '<p>foo<hr><p>[]bar',
			execResult: '<p>foo<hr><p>[]bar'
		},
		{  	start: '<p>foo</p><br><p>[]bar</p>',
			execResult: '<p>foo</p><br><p>[]bar</p>'
		},
		{  	start: '<p>foo</p><br><br><p>[]bar</p>',
			execResult: '<p>foo</p><br><br><p>[]bar</p>'
		},
		{  	start: '<p>foo</p><img src=/img/lion.svg><p>[]bar',
			execResult: '<p>foo</p><img src=/img/lion.svg><p>[]bar'
		},
		{  	start: 'foo<img src=/img/lion.svg>[]bar',
			execResult: 'foo<img src=/img/lion.svg>[]bar'
		},
	
		{  	start: '<a>foo[]</a>bar',
			execResult: '<a>foo[]</a>bar'
		},
		{  	start: '<a>foo</a>[]bar',
			execResult: '<a>foo</a>[]bar'
		},
		{  	start: '<a href=/>foo</a>[]bar',
			execResult: '<a href=/>foo</a>[]bar'
		},
		{  	start: '<a name=abc>foo</a>[]bar',
			execResult: '<a name=abc>foo</a>[]bar'
		},
		{  	start: '<a href=/ name=abc>foo</a>[]bar',
			execResult: '<a href=/ name=abc>foo</a>[]bar'
		},
		{  	start: '<span><a>foo</a></span>[]bar',
			execResult: '<span><a>foo</a></span>[]bar'
		},
		{  	start: '<span><a href=/>foo</a></span>[]bar',
			execResult: '<span><a href=/>foo</a></span>[]bar'
		},
		{  	start: '<span><a name=abc>foo</a></span>[]bar',
			execResult: '<span><a name=abc>foo</a></span>[]bar'
		},
		{  	start: '<span><a href=/ name=abc>foo</a></span>[]bar',
			execResult: '<span><a href=/ name=abc>foo</a></span>[]bar'
		},
		{  	start: 'foo<a>[]bar</a>',
			execResult: 'foo<a>[]bar</a>'
		},
		{  	start: 'foo<a href=/>[]bar</a>',
			execResult: 'foo<a href=/>[]bar</a>'
		},
		{  	start: 'foo<a name=abc>[]bar</a>',
			execResult: 'foo<a name=abc>[]bar</a>'
		},
		{  	start: 'foo<a href=/ name=abc>[]bar</a>',
			execResult: 'foo<a href=/ name=abc>[]bar</a>'
		},
	
		{  	start: 'foo &nbsp;[]bar',
			execResult: 'foo &nbsp;[]bar'
		},
		{  	start: 'foo&nbsp; []bar',
			execResult: 'foo&nbsp; []bar'
		},
		{  	start: 'foo&nbsp;&nbsp;[]bar',
			execResult: 'foo&nbsp;&nbsp;[]bar'
		},
		{  	start: 'foo  []bar',
			execResult: 'foo  []bar'
		},
		{  	start: '<b>foo </b>&nbsp;[]bar',
			execResult: '<b>foo </b>&nbsp;[]bar'
		},
		{  	start: '<b>foo&nbsp;</b> []bar',
			execResult: '<b>foo&nbsp;</b> []bar'
		},
		{  	start: '<b>foo&nbsp;</b>&nbsp;[]bar',
			execResult: '<b>foo&nbsp;</b>&nbsp;[]bar'
		},
		{  	start: '<b>foo </b> []bar',
			execResult: '<b>foo </b> []bar'
		},
	
		// Tables with collapsed selection
		{  	start: 'foo<table><tr><td>[]bar</table>baz',
			execResult: 'foo<table><tr><td>[]bar</table>baz'
		},
		{  	start: 'foo<table><tr><td>bar</table>[]baz',
			execResult: 'foo<table><tr><td>bar</table>[]baz'
		},
		{  	start: '<p>foo<table><tr><td>[]bar</table><p>baz',
			execResult: '<p>foo<table><tr><td>[]bar</table><p>baz'
		},
		{  	start: '<p>foo<table><tr><td>bar</table><p>[]baz',
			execResult: '<p>foo<table><tr><td>bar</table><p>[]baz'
		},
		{  	start: '<table><tr><td>foo<td>[]bar</table>',
			execResult: '<table><tr><td>foo<td>[]bar</table>'
		},
		{  	start: '<table><tr><td>foo<tr><td>[]bar</table>',
			execResult: '<table><tr><td>foo<tr><td>[]bar</table>'
		},
	
		{  	start: 'foo<br><table><tr><td>[]bar</table>baz',
			execResult: 'foo<br><table><tr><td>[]bar</table>baz'
		},
		{  	start: 'foo<table><tr><td>bar<br></table>[]baz',
			execResult: 'foo<table><tr><td>bar<br></table>[]baz'
		},
		{  	start: '<p>foo<br><table><tr><td>[]bar</table><p>baz',
			execResult: '<p>foo<br><table><tr><td>[]bar</table><p>baz'
		},
		{  	start: '<p>foo<table><tr><td>bar<br></table><p>[]baz',
			execResult: '<p>foo<table><tr><td>bar<br></table><p>[]baz'
		},
		{  	start: '<table><tr><td>foo<br><td>[]bar</table>',
			execResult: '<table><tr><td>foo<br><td>[]bar</table>'
		},
		{  	start: '<table><tr><td>foo<br><tr><td>[]bar</table>',
			execResult: '<table><tr><td>foo<br><tr><td>[]bar</table>'
		},
	
		{  	start: 'foo<br><br><table><tr><td>[]bar</table>baz',
			execResult: 'foo<br><br><table><tr><td>[]bar</table>baz'
		},
		{  	start: 'foo<table><tr><td>bar<br><br></table>[]baz',
			execResult: 'foo<table><tr><td>bar<br><br></table>[]baz'
		},
		{  	start: '<p>foo<br><br><table><tr><td>[]bar</table><p>baz',
			execResult: '<p>foo<br><br><table><tr><td>[]bar</table><p>baz'
		},
		{  	start: '<p>foo<table><tr><td>bar<br><br></table><p>[]baz',
			execResult: '<p>foo<table><tr><td>bar<br><br></table><p>[]baz'
		},
		{  	start: '<table><tr><td>foo<br><br><td>[]bar</table>',
			execResult: '<table><tr><td>foo<br><br><td>[]bar</table>'
		},
		{  	start: '<table><tr><td>foo<br><br><tr><td>[]bar</table>',
			execResult: '<table><tr><td>foo<br><br><tr><td>[]bar</table>'
		},
	
		{  	start: 'foo<hr><table><tr><td>[]bar</table>baz',
			execResult: 'foo<hr><table><tr><td>[]bar</table>baz'
		},
		{  	start: 'foo<table><tr><td>bar<hr></table>[]baz',
			execResult: 'foo<table><tr><td>bar<hr></table>[]baz'
		},
		{  	start: '<table><tr><td>foo<hr><td>[]bar</table>',
			execResult: '<table><tr><td>foo<hr><td>[]bar</table>'
		},
		{  	start: '<table><tr><td>foo<hr><tr><td>[]bar</table>',
			execResult: '<table><tr><td>foo<hr><tr><td>[]bar</table>'
		},
	
		// Lists with collapsed selection
		{  	start: 'foo<ol><li>[]bar<li>baz</ol>',
			execResult: 'foo<ol><li>[]bar<li>baz</ol>'
		},
		{  	start: 'foo<br><ol><li>[]bar<li>baz</ol>',
			execResult: 'foo<br><ol><li>[]bar<li>baz</ol>'
		},
		{  	start: 'foo<br><br><ol><li>[]bar<li>baz</ol>',
			execResult: 'foo<br><br><ol><li>[]bar<li>baz</ol>'
		},
		{  	start: '<ol><li>foo<li>[]bar</ol>',
			execResult: '<ol><li>foo<li>[]bar</ol>'
		},
		{  	start: '<ol><li>foo<br><li>[]bar</ol>',
			execResult: '<ol><li>foo<br><li>[]bar</ol>'
		},
		{  	start: '<ol><li>foo<br><br><li>[]bar</ol>',
			execResult: '<ol><li>foo<br><br><li>[]bar</ol>'
		},
		{  	start: '<ol><li>foo<li>[]bar<br>baz</ol>',
			execResult: '<ol><li>foo<li>[]bar<br>baz</ol>'
		},
		{  	start: '<ol><li>foo<br>bar<li>[]baz</ol>',
			execResult: '<ol><li>foo<br>bar<li>[]baz</ol>'
		},
	
		{  	start: '<ol><li><p>foo</p>{}bar</ol>',
			execResult: '<ol><li><p>foo</p>{}bar</ol>'
		},
	
		{  	start: '<ol><li><p>foo<li>[]bar</ol>',
			execResult: '<ol><li><p>foo<li>[]bar</ol>'
		},
		{  	start: '<ol><li>foo<li><p>[]bar</ol>',
			execResult: '<ol><li>foo<li><p>[]bar</ol>'
		},
		{  	start: '<ol><li><p>foo<li><p>[]bar</ol>',
			execResult: '<ol><li><p>foo<li><p>[]bar</ol>'
		},
	
		{  	start: '<ol><li>foo<ul><li>[]bar</ul></ol>',
			execResult: '<ol><li>foo<ul><li>[]bar</ul></ol>'
		},
		{  	start: 'foo<ol><ol><li>[]bar</ol></ol>',
			execResult: 'foo<ol><ol><li>[]bar</ol></ol>'
		},
		{  	start: 'foo<div><ol><li>[]bar</ol></div>',
			execResult: 'foo<div><ol><li>[]bar</ol></div>'
		},
	
		{  	start: 'foo<dl><dt>[]bar<dd>baz</dl>',
			execResult: 'foo<dl><dt>[]bar<dd>baz</dl>'
		},
		{  	start: 'foo<dl><dd>[]bar</dl>',
			execResult: 'foo<dl><dd>[]bar</dl>'
		},
		{  	start: '<dl><dt>foo<dd>[]bar</dl>',
			execResult: '<dl><dt>foo<dd>[]bar</dl>'
		},
		{  	start: '<dl><dt>foo<dt>[]bar<dd>baz</dl>',
			execResult: '<dl><dt>foo<dt>[]bar<dd>baz</dl>'
		},
		{  	start: '<dl><dt>foo<dd>bar<dd>[]baz</dl>',
			execResult: '<dl><dt>foo<dd>bar<dd>[]baz</dl>'
		},
	
		{  	start: '<ol><li>foo</ol>[]bar',
			execResult: '<ol><li>foo</ol>[]bar'
		},
		{  	start: '<ol><li>foo<br></ol>[]bar',
			execResult: '<ol><li>foo<br></ol>[]bar'
		},
		{  	start: '<ol><li>foo<br><br></ol>[]bar',
			execResult: '<ol><li>foo<br><br></ol>[]bar'
		},
	
		{  	start: '<ol><li><br></ol>[]bar',
			execResult: '<ol><li><br></ol>[]bar'
		},
		{  	start: '<ol><li>foo<li><br></ol>[]bar',
			execResult: '<ol><li>foo<li><br></ol>[]bar'
		},
	
		// Indented stuff with collapsed selection
		{  	start: 'foo<blockquote>[]bar</blockquote>',
			execResult: 'foo<blockquote>[]bar</blockquote>'
		},
		{  	start: 'foo<blockquote><blockquote>[]bar</blockquote></blockquote>',
			execResult: 'foo<blockquote><blockquote>[]bar</blockquote></blockquote>'
		},
		{  	start: 'foo<blockquote><div>[]bar</div></blockquote>',
			execResult: 'foo<blockquote><div>[]bar</div></blockquote>'
		},
		{  	start: 'foo<blockquote style="color: blue">[]bar</blockquote>',
			execResult: 'foo<blockquote style="color: blue">[]bar</blockquote>'
		},
	
		{  	start: 'foo<blockquote><blockquote><p>[]bar<p>baz</blockquote></blockquote>',
			execResult: 'foo<blockquote><blockquote><p>[]bar<p>baz</blockquote></blockquote>'
		},
		{  	start: 'foo<blockquote><div><p>[]bar<p>baz</div></blockquote>',
			execResult: 'foo<blockquote><div><p>[]bar<p>baz</div></blockquote>'
		},
		{  	start: 'foo<blockquote style="color: blue"><p>[]bar<p>baz</blockquote>',
			execResult: 'foo<blockquote style="color: blue"><p>[]bar<p>baz</blockquote>'
		},
	
		{  	start: 'foo<blockquote><p><b>[]bar</b><p>baz</blockquote>',
			execResult: 'foo<blockquote><p><b>[]bar</b><p>baz</blockquote>'
		},
		{  	start: 'foo<blockquote><p><strong>[]bar</strong><p>baz</blockquote>',
			execResult: 'foo<blockquote><p><strong>[]bar</strong><p>baz</blockquote>'
		},
		{  	start: 'foo<blockquote><p><span>[]bar</span><p>baz</blockquote>',
			execResult: 'foo<blockquote><p><span>[]bar</span><p>baz</blockquote>'
		},
	
		{  	start: 'foo<blockquote><ol><li>[]bar</ol></blockquote><p>extra',
			execResult: 'foo<blockquote><ol><li>[]bar</ol></blockquote><p>extra'
		},
		{  	start: 'foo<blockquote>bar<ol><li>[]baz</ol>quz</blockquote><p>extra',
			execResult: 'foo<blockquote>bar<ol><li>[]baz</ol>quz</blockquote><p>extra'
		},
		{  	start: 'foo<blockquote><ol><li>bar</li><ol><li>[]baz</ol><li>quz</ol></blockquote><p>extra',
			execResult: 'foo<blockquote><ol><li>bar</li><ol><li>[]baz</ol><li>quz</ol></blockquote><p>extra'
		},
	
		// Invisible stuff with collapsed selection
		{  	start: 'foo<span></span>[]bar',
			execResult: 'foo<span></span>[]bar'
		},
		{  	start: 'foo<span><span></span></span>[]bar',
			execResult: 'foo<span><span></span></span>[]bar'
		},
		{  	start: 'foo<quasit></quasit>[]bar',
			execResult: 'foo<quasit></quasit>[]bar'
		},
		{  	start: 'foo<br><span></span>[]bar',
			execResult: 'foo<br><span></span>[]bar'
		},
		{  	start: '<span>foo<span></span></span>[]bar',
			execResult: '<span>foo<span></span></span>[]bar'
		},
		{  	start: 'foo<span></span><span>[]bar</span>',
			execResult: 'foo<span></span><span>[]bar</span>'
		},
		{  	start: 'foo<div><div><p>[]bar</div></div>',
			execResult: 'foo<div><div><p>[]bar</div></div>'
		},
		{  	start: 'foo<div><div><p><!--abc-->[]bar</div></div>',
			execResult: 'foo<div><div><p><!--abc-->[]bar</div></div>'
		},
		{  	start: 'foo<div><div><!--abc--><p>[]bar</div></div>',
			execResult: 'foo<div><div><!--abc--><p>[]bar</div></div>'
		},
		{  	start: 'foo<div><!--abc--><div><p>[]bar</div></div>',
			execResult: 'foo<div><!--abc--><div><p>[]bar</div></div>'
		},
		{  	start: 'foo<!--abc--><div><div><p>[]bar</div></div>',
			execResult: 'foo<!--abc--><div><div><p>[]bar</div></div>'
		},
		{  	start: '<div><div><p>foo</div></div>[]bar',
			execResult: '<div><div><p>foo</div></div>[]bar'
		},
		{  	start: '<div><div><p>foo</div></div><!--abc-->[]bar',
			execResult: '<div><div><p>foo</div></div><!--abc-->[]bar'
		},
		{  	start: '<div><div><p>foo</div><!--abc--></div>[]bar',
			execResult: '<div><div><p>foo</div><!--abc--></div>[]bar'
		},
		{  	start: '<div><div><p>foo</p><!--abc--></div></div>[]bar',
			execResult: '<div><div><p>foo</p><!--abc--></div></div>[]bar'
		},
		{  	start: '<div><div><p>foo<!--abc--></div></div>[]bar',
			execResult: '<div><div><p>foo<!--abc--></div></div>[]bar'
		},
		{  	start: '<div><div><p>foo</p></div></div><div><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div></div><div><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo<!--abc--></p></div></div><div><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo<!--abc--></p></div></div><div><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p><!--abc--></div></div><div><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p><!--abc--></div></div><div><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p></div><!--abc--></div><div><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div><!--abc--></div><div><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p></div></div><!--abc--><div><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div></div><!--abc--><div><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p></div></div><div><!--abc--><div><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div></div><div><!--abc--><div><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p></div></div><div><div><!--abc--><div>[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div></div><div><div><!--abc--><div>[]bar</div></div></div>'
		},
		{  	start: '<div><div><p>foo</p></div></div><div><div><div><!--abc-->[]bar</div></div></div>',
			execResult: '<div><div><p>foo</p></div></div><div><div><div><!--abc-->[]bar</div></div></div>'
		},
	
		// Styled stuff with collapsed selection
		{  	start: '<p style=color:blue>foo<p>[]bar',
			execResult: '<p style=color:blue>foo<p>[]bar'
		},
		{  	start: '<p style=color:blue>foo<p style=color:brown>[]bar',
			execResult: '<p style=color:blue>foo<p style=color:brown>[]bar'
		},
		{  	start: '<p style=color:blue>foo<p style=color:rgba(0,0,255,1)>[]bar',
			execResult: '<p style=color:blue>foo<p style=color:rgba(0,0,255,1)>[]bar'
		},
		{  	start: '<p style=color:transparent>foo<p style=color:rgba(0,0,0,0)>[]bar',
			execResult: '<p style=color:transparent>foo<p style=color:rgba(0,0,0,0)>[]bar'
		},
		{  	start: '<p>foo<p style=color:brown>[]bar',
			execResult: '<p>foo<p style=color:brown>[]bar'
		},
		{  	start: '<p><font color=blue>foo</font><p>[]bar',
			execResult: '<p><font color=blue>foo</font><p>[]bar'
		},
		{  	start: '<p><font color=blue>foo</font><p><font color=brown>[]bar</font>',
			execResult: '<p><font color=blue>foo</font><p><font color=brown>[]bar</font>'
		},
		{  	start: '<p>foo<p><font color=brown>[]bar</font>',
			execResult: '<p>foo<p><font color=brown>[]bar</font>'
		},
		{  	start: '<p><span style=color:blue>foo</font><p>[]bar',
			execResult: '<p><span style=color:blue>foo</font><p>[]bar'
		},
		{  	start: '<p><span style=color:blue>foo</font><p><span style=color:brown>[]bar</font>',
			execResult: '<p><span style=color:blue>foo</font><p><span style=color:brown>[]bar</font>'
		},
		{  	start: '<p>foo<p><span style=color:brown>[]bar</font>',
			execResult: '<p>foo<p><span style=color:brown>[]bar</font>'
		},
	
		{  	start: '<p style=background-color:aqua>foo<p>[]bar',
			execResult: '<p style=background-color:aqua>foo<p>[]bar'
		},
		{  	start: '<p style=background-color:aqua>foo<p style=background-color:tan>[]bar',
			execResult: '<p style=background-color:aqua>foo<p style=background-color:tan>[]bar'
		},
		{  	start: '<p>foo<p style=background-color:tan>[]bar',
			execResult: '<p>foo<p style=background-color:tan>[]bar'
		},
		{  	start: '<p><span style=background-color:aqua>foo</font><p>[]bar',
			execResult: '<p><span style=background-color:aqua>foo</font><p>[]bar'
		},
		{  	start: '<p><span style=background-color:aqua>foo</font><p><span style=background-color:tan>[]bar</font>',
			execResult: '<p><span style=background-color:aqua>foo</font><p><span style=background-color:tan>[]bar</font>'
		},
		{  	start: '<p>foo<p><span style=background-color:tan>[]bar</font>',
			execResult: '<p>foo<p><span style=background-color:tan>[]bar</font>'
		},
	
		{  	start: '<p style=text-decoration:underline>foo<p>[]bar',
			execResult: '<p style=text-decoration:underline>foo<p>[]bar'
		},
		{  	start: '<p style=text-decoration:underline>foo<p style=text-decoration:line-through>[]bar',
			execResult: '<p style=text-decoration:underline>foo<p style=text-decoration:line-through>[]bar'
		},
		{  	start: '<p>foo<p style=text-decoration:line-through>[]bar',
			execResult: '<p>foo<p style=text-decoration:line-through>[]bar'
		},
		{  	start: '<p><u>foo</u><p>[]bar',
			execResult: '<p><u>foo</u><p>[]bar'
		},
		{  	start: '<p><u>foo</u><p><s>[]bar</s>',
			execResult: '<p><u>foo</u><p><s>[]bar</s>'
		},
		{  	start: '<p>foo<p><s>[]bar</s>',
			execResult: '<p>foo<p><s>[]bar</s>'
		},
	
		{  	start: '<p style=color:blue>foo</p>[]bar',
			execResult: '<p style=color:blue>foo</p>[]bar'
		},
		{  	start: 'foo<p style=color:brown>[]bar',
			execResult: 'foo<p style=color:brown>[]bar'
		},
		{  	start: '<div style=color:blue><p style=color:green>foo</div>[]bar',
			execResult: '<div style=color:blue><p style=color:green>foo</div>[]bar'
		},
		{  	start: '<div style=color:blue><p style=color:green>foo</div><p style=color:brown>[]bar',
			execResult: '<div style=color:blue><p style=color:green>foo</div><p style=color:brown>[]bar'
		},
		{  	start: '<p style=color:blue>foo<div style=color:brown><p style=color:green>[]bar',
			execResult: '<p style=color:blue>foo<div style=color:brown><p style=color:green>[]bar'
		},
	
		// Uncollapsed selection
		{  	start: 'foo[bar]baz',
			execResult: 'foo[bar]baz'
		},
		{  	start: '<p>foo<span style=color:#aBcDeF>[bar]</span>baz',
			execResult: '<p>foo<span style=color:#aBcDeF>[bar]</span>baz'
		},
		{  	start: '<p>foo<span style=color:#aBcDeF>{bar}</span>baz',
			execResult: '<p>foo<span style=color:#aBcDeF>{bar}</span>baz'
		},
		{  	start: '<p>foo{<span style=color:#aBcDeF>bar</span>}baz',
			execResult: '<p>foo{<span style=color:#aBcDeF>bar</span>}baz'
		},
		{  	start: '<p>[foo<span style=color:#aBcDeF>bar]</span>baz',
			execResult: '<p>[foo<span style=color:#aBcDeF>bar]</span>baz'
		},
		{  	start: '<p>{foo<span style=color:#aBcDeF>bar}</span>baz',
			execResult: '<p>{foo<span style=color:#aBcDeF>bar}</span>baz'
		},
		{  	start: '<p>foo<span style=color:#aBcDeF>[bar</span>baz]',
			execResult: '<p>foo<span style=color:#aBcDeF>[bar</span>baz]'
		},
		{  	start: '<p>foo<span style=color:#aBcDeF>{bar</span>baz}',
			execResult: '<p>foo<span style=color:#aBcDeF>{bar</span>baz}'
		},
		{  	start: '<p>foo<span style=color:#aBcDeF>[bar</span><span style=color:#fEdCbA>baz]</span>quz',
			execResult: '<p>foo<span style=color:#aBcDeF>[bar</span><span style=color:#fEdCbA>baz]</span>quz'
		},
	
		{  	start: 'foo<b>[bar]</b>baz',
			execResult: 'foo<b>[bar]</b>baz'
		},
		{  	start: 'foo<b>{bar}</b>baz',
			execResult: 'foo<b>{bar}</b>baz'
		},
		{  	start: 'foo{<b>bar</b>}baz',
			execResult: 'foo{<b>bar</b>}baz'
		},
		{  	start: 'foo<span>[bar]</span>baz',
			execResult: 'foo<span>[bar]</span>baz'
		},
		{  	start: 'foo<span>{bar}</span>baz',
			execResult: 'foo<span>{bar}</span>baz'
		},
		{  	start: 'foo{<span>bar</span>}baz',
			execResult: 'foo{<span>bar</span>}baz'
		},
		{  	start: '<b>foo[bar</b><i>baz]quz</i>',
			execResult: '<b>foo[bar</b><i>baz]quz</i>'
		},
		{  	start: '<p>foo</p><p>[bar]</p><p>baz</p>',
			execResult: '<p>foo</p><p>[bar]</p><p>baz</p>'
		},
		{  	start: '<p>foo</p><p>{bar}</p><p>baz</p>',
			execResult: '<p>foo</p><p>{bar}</p><p>baz</p>'
		},
		{  	start: '<p>foo</p><p>{bar</p>}<p>baz</p>',
			execResult: '<p>foo</p><p>{bar</p>}<p>baz</p>'
		},
		{  	start: '<p>foo</p>{<p>bar}</p><p>baz</p>',
			execResult: '<p>foo</p>{<p>bar}</p><p>baz</p>'
		},
		{  	start: '<p>foo</p>{<p>bar</p>}<p>baz</p>',
			execResult: '<p>foo</p>{<p>bar</p>}<p>baz</p>'
		},
	
		{  	start: '<p>foo[bar<p>baz]quz',
			execResult: '<p>foo[bar<p>baz]quz'
		},
		{  	start: '<p>foo[bar<div>baz]quz</div>',
			execResult: '<p>foo[bar<div>baz]quz</div>'
		},
		{  	start: '<p>foo[bar<h1>baz]quz</h1>',
			execResult: '<p>foo[bar<h1>baz]quz</h1>'
		},
		{  	start: '<div>foo[bar</div><p>baz]quz',
			execResult: '<div>foo[bar</div><p>baz]quz'
		},
		{  	start: '<blockquote>foo[bar</blockquote><pre>baz]quz</pre>',
			execResult: '<blockquote>foo[bar</blockquote><pre>baz]quz</pre>'
		},
	
		{  	start: '<p><b>foo[bar</b><p>baz]quz',
			execResult: '<p><b>foo[bar</b><p>baz]quz'
		},
		{  	start: '<div><p>foo[bar</div><p>baz]quz',
			execResult: '<div><p>foo[bar</div><p>baz]quz'
		},
		{  	start: '<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote',
			execResult: '<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote'
		},
		{  	start: '<p>foo[bar<p style=color:blue>baz]quz',
			execResult: '<p>foo[bar<p style=color:blue>baz]quz'
		},
		{  	start: '<p>foo[bar<p><b>baz]quz</b>',
			execResult: '<p>foo[bar<p><b>baz]quz</b>'
		},
	
		{  	start: '<div><p>foo<p>[bar<p>baz]</div>',
			execResult: '<div><p>foo<p>[bar<p>baz]</div>'
		},
	
		{  	start: 'foo[<br>]bar',
			execResult: 'foo[<br>]bar'
		},
		{  	start: '<p>foo[</p><p>]bar</p>',
			execResult: '<p>foo[</p><p>]bar</p>'
		},
		{  	start: '<p>foo[</p><p>]bar<br>baz</p>',
			execResult: '<p>foo[</p><p>]bar<br>baz</p>'
		},
		{  	start: 'foo[<p>]bar</p>',
			execResult: 'foo[<p>]bar</p>'
		},
		{  	start: 'foo{<p>}bar</p>',
			execResult: 'foo{<p>}bar</p>'
		},
		{  	start: 'foo[<p>]bar<br>baz</p>',
			execResult: 'foo[<p>]bar<br>baz</p>'
		},
		{  	start: 'foo[<p>]bar</p>baz',
			execResult: 'foo[<p>]bar</p>baz'
		},
		{  	start: 'foo{<p>bar</p>}baz',
			execResult: 'foo{<p>bar</p>}baz'
		},
		{  	start: 'foo<p>{bar</p>}baz',
			execResult: 'foo<p>{bar</p>}baz'
		},
		{  	start: 'foo{<p>bar}</p>baz',
			execResult: 'foo{<p>bar}</p>baz'
		},
		{  	start: '<p>foo[</p>]bar',
			execResult: '<p>foo[</p>]bar'
		},
		{  	start: '<p>foo{</p>}bar',
			execResult: '<p>foo{</p>}bar'
		},
		{  	start: '<p>foo[</p>]bar<br>baz',
			execResult: '<p>foo[</p>]bar<br>baz'
		},
		{  	start: '<p>foo[</p>]bar<p>baz</p>',
			execResult: '<p>foo[</p>]bar<p>baz</p>'
		},
		{  	start: 'foo[<div><p>]bar</div>',
			execResult: 'foo[<div><p>]bar</div>'
		},
		{  	start: '<div><p>foo[</p></div>]bar',
			execResult: '<div><p>foo[</p></div>]bar'
		},
		{  	start: 'foo[<div><p>]bar</p>baz</div>',
			execResult: 'foo[<div><p>]bar</p>baz</div>'
		},
		{  	start: 'foo[<div>]bar<p>baz</p></div>',
			execResult: 'foo[<div>]bar<p>baz</p></div>'
		},
		{  	start: '<div><p>foo</p>bar[</div>]baz',
			execResult: '<div><p>foo</p>bar[</div>]baz'
		},
		{  	start: '<div>foo<p>bar[</p></div>]baz',
			execResult: '<div>foo<p>bar[</p></div>]baz'
		},
	
		{  	start: '<p>foo<br>{</p>]bar',
			execResult: '<p>foo<br>{</p>]bar'
		},
		{  	start: '<p>foo<br><br>{</p>]bar',
			execResult: '<p>foo<br><br>{</p>]bar'
		},
		{  	start: 'foo<br>{<p>]bar</p>',
			execResult: 'foo<br>{<p>]bar</p>'
		},
		{  	start: 'foo<br><br>{<p>]bar</p>',
			execResult: 'foo<br><br>{<p>]bar</p>'
		},
		{  	start: '<p>foo<br>{</p><p>}bar</p>',
			execResult: '<p>foo<br>{</p><p>}bar</p>'
		},
		{  	start: '<p>foo<br><br>{</p><p>}bar</p>',
			execResult: '<p>foo<br><br>{</p><p>}bar</p>'
		},
	
		{  	start: '<table><tbody><tr><th>foo<th>[bar]<th>baz<tr><td>quz<td>qoz<td>qiz</table>',
			execResult: '<table><tbody><tr><th>foo<th>[bar]<th>baz<tr><td>quz<td>qoz<td>qiz</table>'
		},
		{  	start: '<table><tbody><tr><th>foo<th>ba[r<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
			execResult: '<table><tbody><tr><th>foo<th>ba[r<th>b]az<tr><td>quz<td>qoz<td>qiz</table>'
		},
		{  	start: '<table><tbody><tr><th>fo[o<th>bar<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
			execResult: '<table><tbody><tr><th>fo[o<th>bar<th>b]az<tr><td>quz<td>qoz<td>qiz</table>'
		},
		{  	start: '<table><tbody><tr><th>foo<th>bar<th>ba[z<tr><td>q]uz<td>qoz<td>qiz</table>',
			execResult: '<table><tbody><tr><th>foo<th>bar<th>ba[z<tr><td>q]uz<td>qoz<td>qiz</table>'
		},
		{  	start: '<table><tbody><tr><th>[foo<th>bar<th>baz]<tr><td>quz<td>qoz<td>qiz</table>',
			execResult: '<table><tbody><tr><th>[foo<th>bar<th>baz]<tr><td>quz<td>qoz<td>qiz</table>'
		},
		{  	start: '<table><tbody><tr><th>[foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz]</table>',
			execResult: '<table><tbody><tr><th>[foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz]</table>'
		},
		{  	start: '{<table><tbody><tr><th>foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz</table>}',
			execResult: '{<table><tbody><tr><th>foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz</table>}'
		},
		{  	start: '<table><tbody><tr><td>foo<td>ba[r<tr><td>baz<td>quz<tr><td>q]oz<td>qiz</table>',
			execResult: '<table><tbody><tr><td>foo<td>ba[r<tr><td>baz<td>quz<tr><td>q]oz<td>qiz</table>'
		},
		{  	start: '<p>fo[o<table><tr><td>b]ar</table><p>baz',
			execResult: '<p>fo[o<table><tr><td>b]ar</table><p>baz'
		},
		{  	start: '<p>foo<table><tr><td>ba[r</table><p>b]az',
			execResult: '<p>foo<table><tr><td>ba[r</table><p>b]az'
		},
		{  	start: '<p>fo[o<table><tr><td>bar</table><p>b]az',
			execResult: '<p>fo[o<table><tr><td>bar</table><p>b]az'
		},
	
		{  	start: '<p>foo<ol><li>ba[r<li>b]az</ol><p>quz',
			execResult: '<p>foo<ol><li>ba[r<li>b]az</ol><p>quz'
		},
		{  	start: '<p>foo<ol><li>bar<li>[baz]</ol><p>quz',
			execResult: '<p>foo<ol><li>bar<li>[baz]</ol><p>quz'
		},
		{  	start: '<p>fo[o<ol><li>b]ar<li>baz</ol><p>quz',
			execResult: '<p>fo[o<ol><li>b]ar<li>baz</ol><p>quz'
		},
		{  	start: '<p>foo<ol><li>bar<li>ba[z</ol><p>q]uz',
			execResult: '<p>foo<ol><li>bar<li>ba[z</ol><p>q]uz'
		},
		{  	start: '<p>fo[o<ol><li>bar<li>b]az</ol><p>quz',
			execResult: '<p>fo[o<ol><li>bar<li>b]az</ol><p>quz'
		},
		{  	start: '<p>fo[o<ol><li>bar<li>baz</ol><p>q]uz',
			execResult: '<p>fo[o<ol><li>bar<li>baz</ol><p>q]uz'
		},
	
		{  	start: '<ol><li>fo[o</ol><ol><li>b]ar</ol>',
			execResult: '<ol><li>fo[o</ol><ol><li>b]ar</ol>'
		},
		{  	start: '<ol><li>fo[o</ol><ul><li>b]ar</ul>',
			execResult: '<ol><li>fo[o</ol><ul><li>b]ar</ul>'
		},
	
		{  	start: 'foo[<ol><li>]bar</ol>',
			execResult: 'foo[<ol><li>]bar</ol>'
		},
		{  	start: '<ol><li>foo[<li>]bar</ol>',
			execResult: '<ol><li>foo[<li>]bar</ol>'
		},
		{  	start: 'foo[<dl><dt>]bar<dd>baz</dl>',
			execResult: 'foo[<dl><dt>]bar<dd>baz</dl>'
		},
		{  	start: 'foo[<dl><dd>]bar</dl>',
			execResult: 'foo[<dl><dd>]bar</dl>'
		},
		{  	start: '<dl><dt>foo[<dd>]bar</dl>',
			execResult: '<dl><dt>foo[<dd>]bar</dl>'
		},
		{  	start: '<dl><dt>foo[<dt>]bar<dd>baz</dl>',
			execResult: '<dl><dt>foo[<dt>]bar<dd>baz</dl>'
		},
		{  	start: '<dl><dt>foo<dd>bar[<dd>]baz</dl>',
			execResult: '<dl><dt>foo<dd>bar[<dd>]baz</dl>'
		},
	
		{  	start: '<b>foo [&nbsp;</b>bar]',
			execResult: '<b>foo [&nbsp;</b>bar]'
		},
	
		// Do we merge based on element names or the display property?
		{  	start: '<p style=display:inline>fo[o<p style=display:inline>b]ar',
			execResult: '<p style=display:inline>fo[o<p style=display:inline>b]ar'
		},
		{  	start: '<span style=display:block>fo[o</span><span style=display:block>b]ar</span>',
			execResult: '<span style=display:block>fo[o</span><span style=display:block>b]ar</span>'
		},
		{  	start: '<span style=display:inline-block>fo[o</span><span style=display:inline-block>b]ar</span>',
			execResult: '<span style=display:inline-block>fo[o</span><span style=display:inline-block>b]ar</span>'
		},
		{  	start: '<span style=display:inline-table>fo[o</span><span style=display:inline-table>b]ar</span>',
			execResult: '<span style=display:inline-table>fo[o</span><span style=display:inline-table>b]ar</span>'
		},
		{  	start: '<span style=display:none>fo[o</span><span style=display:none>b]ar</span>',
			execResult: '<span style=display:none>fo[o</span><span style=display:none>b]ar</span>'
		},
		{  	start: '<quasit style=display:block>fo[o</quasit><quasit style=display:block>b]ar</quasit>',
			execResult: '<quasit style=display:block>fo[o</quasit><quasit style=display:block>b]ar</quasit>'
		}
	
	]
}

