var tests = {
		defaultValue: '',
		defaultCommand: 'forwarddelete',
		tests: [
			{  	start: 'fo[o<b>b]ar</b>baz',
				execResult: 'fo[]<b>ar</b>baz'
			},
			// Collapsed selection
			{  	start: 'foo[]',
				execResult: 'foo[]'
			},
			{  	start: '<span>foo[]</span>',
				execResult: ''
			},
			{  	start: '<p>foo[]</p>',
				execResult: '<p>foo[]</p>'
			},
			{  	start: 'foo[]bar',
				execResult: 'foo[]ar'
			},
			{  	start: '<span>foo</span>{}<span>bar</span>',
				execResult: '<span>foo[]</span><span>ar</span>'
			},
			{  	start: '<span>foo[</span><span>]bar</span>',
				execResult: '<span>foo[]</span><span>ar</span>'
			},
			{  	start: 'foo[]<span style=display:none>bar</span>baz',
				execResult: 'foo[]az'
			},
//			{  	start: 'foo[]<script>bar</script>baz', /// dont care bout that case
//				execResult: 'foo[]<script>bar</script>baz'
//			},
			{  	start: 'fo[]&ouml;bar',
				execResult: 'fo[]bar'
			},
			{  	start: 'fo[]bar',
				execResult: 'fo[]&#x308;bar'
			},
			{  	start: 'fo[]o&#x308;&#x327;bar',
				execResult: 'fo[]bar'
			},
			{  	start: '[]&ouml;bar',
				execResult: '[]bar'
			},
			{  	start: '[]o&#x308;bar',
				execResult: '[]bar'
			},
			{  	start: '[]o&#x308;&#x327;bar',
				execResult: '[]bar'
			},
//			{  	start: '[]&#x5e9;&#x5c1;&#x5b8;&#x5dc;&#x5d5;&#x5b9;&#x5dd;', // yeah well I dunno
//				execResult: '[]&#x5e9;&#x5c1;&#x5b8;&#x5dc;&#x5d5;&#x5b9;&#x5dd;'
//			},
//			{  	start: '&#x5e9;&#x5c1;&#x5b8;&#x5dc;[]&#x5d5;&#x5b9;&#x5dd;',
//				execResult: ''
//			},
			{  	start: '<p>foo[]</p><p>bar</p>',
				execResult: '<p>foo[]bar</p>'
			},
			{  	start: '<p>foo[]</p>bar',
				execResult: '<p>foo[]bar</p>'
			},
			{  	start: 'foo[]<p>bar</p>',
				execResult: 'foo[]bar'
			},
			{  	start: '<p>foo[]<br></p><p>bar</p>',
				execResult: '<p>foo[]bar</p>'
			},
			{  	start: '<p>foo[]<br></p>bar',
				execResult: '<p>foo[]bar</p>'
			},
			{  	start: 'foo[]<br><p>bar</p>',
				execResult: 'foo[]bar'
			},
			{  	start: '<p>{}<br></p>foo',
				execResult: '<p>[]foo</p>'
			},
			{  	start: '<p>{}<span><br></span></p>foo',
				execResult: '<p>foo[]</p>'
			},
			{	start: 'foo{}<p><br>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<p><span><br></span>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<br><p><br>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<span><br></span><p><br>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<br><p><span><br></span>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<span><br></span><p><span><br></span>',
				execResult: 'foo[]'
			},
			{	start: 'foo{}<p>',
				execResult: 'foo[]'
			},
//			{	start: '<table><tr><td>{}</table>foo', // no td specific tests for us.
//				execResult: ''
//			},
//			{	start: '<table><tr><td>{}<br></table>foo',
//				execResult: ''
//			},
//			{	start: '<table><tr><td>{}<span><br></span></table>foo',
//				execResult: ''
//			},
			{	start: '<div><p>foo[]</p></div><p>bar</p>',
				execResult: '<div><p>foo[]bar</p></div>'
			},
			{	start: '<p>foo[]</p><div><p>bar</p></div>',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<div><p>foo[]</p></div><div><p>bar</p></div>',
				execResult: '<div><p>foo[]bar</p></div>'
			},
			{	start: '<div><p>foo[]</p></div>bar',
				execResult: '<div><p>foo[]bar</p></div>'
			},
			{	start: 'foo[]<div><p>bar</p></div>',
				execResult: 'foo[]bar'
			},
			{	start: '<div>foo[]</div><div>bar</div>',
				execResult: '<div>foo[]bar</div>'
			},
			{	start: '<pre>foo[]</pre>bar',
				execResult: '<pre>foo[]bar</pre>'
			},
			{	start: 'foo[]<br>bar',
				execResult: 'foo[]bar'
			},
			{	start: '<b>foo[]</b><br>bar',
				execResult: '<b>foo[]</b>bar'
			},
			{	start: 'foo[]<hr>bar',
				execResult: 'foo[]bar'
			},
			{	start: '<p>foo[]<hr><p>bar',
				execResult: '<p>foo[]</p><p>bar</p>'
			},
			{	start: '<p>foo[]</p><br><p>bar</p>',
				execResult: '<p>foo[]</p><p>bar</p>'
			},
			{	start: '<p>foo[]</p><br><br><p>bar</p>',
				execResult: '<p>foo[]</p><br><p>bar</p>'
			},
			{	start: '<p>foo[]</p><img src=/img/lion.svg><p>bar',
				execResult: '<p>foo[]<img src="/img/lion.svg"></p><p>bar</p>'
			},
			{	start: 'foo[]<img src=/img/lion.svg>bar',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<a>bar</a>',
				execResult: 'foo[]<a>ar</a>'
			},
			{	start: 'foo[]<a href=/>bar</a>',
				execResult: 'foo[]<a href="/">ar</a>'
			},
			{	start: 'foo[]<a name=abc>bar</a>',
				execResult: 'foo[]<a name=abc>ar</a>'
			},
			{	start: 'foo[]<a href=/ name=abc>bar</a>',
				execResult: 'foo[]<a href=/ name=abc>ar</a>'
			},
			{	start: 'foo[]<span><a>bar</a></span>',
				execResult: 'foo[]<span><a>ar</a></span>'
			},
			{	start: 'foo[]<span><a href=/>bar</a></span>',
				execResult: 'foo[]<span><a href=/>ar</a></span>'
			},
			{	start: 'foo[]<span><a name=abc>bar</a></span>',
				execResult: 'foo[]<span><a name=abc>ar</a></span>'
			},
			{	start: 'foo[]<span><a href=/ name=abc>bar</a></span>',
				execResult: 'foo[]<span><a href=/ name=abc>ar</a></span>'
			},
			{	start: '<a>foo[]</a>bar',
				execResult: '<a>foo[]</a>ar'
			},
			{	start: '<a href=/>foo[]</a>bar',
				execResult: '<a href=/>foo[]</a>ar'
			},
			{	start: '<a name=abc>foo[]</a>bar',
				execResult: '<a name=abc>foo[]</a>ar'
			},
			{	start: '<a href=/ name=abc>foo[]</a>bar',
				execResult: '<a href=/ name=abc>foo[]</a>ar'
			},
			{	start: 'foo []&nbsp;',
				execResult: 'foo[]'
			},
			{	start: '[]&nbsp; foo',
				execResult: '[]&nbsp;foo'
			},
			{	start: 'foo[] &nbsp;bar',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]&nbsp; bar',
				execResult: 'foo[] bar'
			},
			{	start: 'foo[]&nbsp;&nbsp;bar',
				execResult: 'foo[] bar'
			},
			{	start: 'foo[]  bar',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[] &nbsp; bar',
				execResult: 'foo[]&nbsp; bar'
			},
			{	start: 'foo []&nbsp; bar',
				execResult: 'foo []bar'
			},
			{	start: 'foo &nbsp;[] bar',
				execResult: 'foo &nbsp;[]bar'
			},
			{	start: 'foo[] <span>&nbsp;</span> bar',
				execResult: 'foo[]<span>&nbsp;</span> bar'
			},
			{	start: 'foo []<span>&nbsp;</span> bar',
				execResult: 'foo []<span></span> bar'
			},
			{	start: 'foo <span>&nbsp;</span>[] bar',
				execResult: 'foo <span>&nbsp;</span>[]bar'
			},
			{	start: '<b>foo[] </b>&nbsp;bar',
				execResult: '<b>foo[]</b> bar'
			},
			{	start: '<b>foo[]&nbsp;</b> bar',
				execResult: '<b>foo[]</b> bar'
			},
			{	start: '<b>foo[]&nbsp;</b>&nbsp;bar',
				execResult: '<b>foo[]</b> bar'
			},
			{	start: '<b>foo[] </b> bar',
				execResult: '<b>foo[]</b>bar'
			},
			{	start: '<pre>foo []&nbsp;</pre>',
				execResult: '<pre>foo []</pre>'
			},
			{	start: '<pre>[]&nbsp; foo</pre>',
				execResult: '<pre>[] foo</pre>'
			},
			{	start: '<pre>foo[] &nbsp;bar</pre>',
				execResult: '<pre>foo[] bar</pre>'
			},
			{	start: '<pre>foo[]&nbsp; bar</pre>',
				execResult: '<pre>foo[] bar</pre>'
			},
			{	start: '<pre>foo[]  bar</pre>',
				execResult: '<pre>foo[]bar</pre>'
			},
			{	start: '<div style=white-space:pre>foo []&nbsp;</div>',
				execResult: '<div style=white-space:pre>foo []</div>'
			},
			{	start: '<div style=white-space:pre>[]&nbsp; foo</div>',
				execResult: '<div style=white-space:pre>[] foo</div>'
			},
			{	start: '<div style=white-space:pre>foo[] &nbsp;bar</div>',
				execResult: '<div style=white-space:pre>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre>foo[]&nbsp; bar</div>',
				execResult: '<div style=white-space:pre>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre>foo[]  bar</div>',
				execResult: '<div style=white-space:pre>foo[]bar</div>'
			},
			{	start: '<div style=white-space:pre-wrap>foo []&nbsp;</div>',
				execResult: '<div style=white-space:pre-wrap>foo []</div>'
			},
			{	start: '<div style=white-space:pre-wrap>[]&nbsp; foo</div>',
				execResult: '<div style=white-space:pre-wrap>[] foo</div>'
			},
			{	start: '<div style=white-space:pre-wrap>foo[] &nbsp;bar</div>',
				execResult: '<div style=white-space:pre-wrap>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre-wrap>foo[]&nbsp; bar</div>',
				execResult: '<div style=white-space:pre-wrap>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre-wrap>foo[]  bar</div>',
				execResult: '<div style=white-space:pre-wrap>foo[]bar</div>'
			},
			{	start: '<div style=white-space:pre-line>foo []&nbsp;</div>',
				execResult: '<div style=white-space:pre-line>foo []</div>'
			},
			{	start: '<div style=white-space:pre-line>[]&nbsp; foo</div>',
				execResult: '<div style=white-space:pre-line>[] foo</div>'
			},
			{	start: '<div style=white-space:pre-line>foo[] &nbsp;bar</div>',
				execResult: '<div style=white-space:pre-line>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre-line>foo[]&nbsp; bar</div>',
				execResult: '<div style=white-space:pre-line>foo[] bar</div>'
			},
			{	start: '<div style=white-space:pre-line>foo[]  bar</div>',
				execResult: '<div style=white-space:pre-line>foo[]bar</div>'
			},
			{	start: '<div style=white-space:nowrap>foo []&nbsp;</div>',
				execResult: '<div style=white-space:nowrap>foo []</div>'
			},
			{	start: '<div style=white-space:nowrap>[]&nbsp; foo</div>',
				execResult: '<div style=white-space:nowrap>[] foo</div>'
			},
			{	start: '<div style=white-space:nowrap>foo[] &nbsp;bar</div>',
				execResult: '<div style=white-space:nowrap>foo[] bar</div>'
			},
			{	start: '<div style=white-space:nowrap>foo[]&nbsp; bar</div>',
				execResult: '<div style=white-space:nowrap>foo[] bar</div>'
			},
			{	start: '<div style=white-space:nowrap>foo[]  bar</div>',
				execResult: '<div style=white-space:nowrap>foo[]bar</div>'
			},
//			{	start: 'foo[]<table><tr><td>bar</table>baz',
//				execResult: ''
//			},
//			{	start: 'foo<table><tr><td>bar[]</table>baz',
//				execResult: ''
//			},
//			{	start: '<p>foo[]<table><tr><td>bar</table><p>baz',
//				execResult: ''
//			},
//			{	start: '<table><tr><td>foo[]<td>bar</table>',
//				execResult: ''
//			},
//			{	start: '<table><tr><td>foo[]<tr><td>bar</table>',
//				execResult: ''
//			},
//			{	start: 'foo[]<br><table><tr><td>bar</table>baz',
//				execResult: ''
//			},
			{	start: 'foo<table><tr><td>bar[]<br></table>baz',
				execResult: 'foo<table><tr><td>bar[]</table>baz'
			},
			{	start: '<p>foo[]<br><table><tr><td>bar</table><p>baz',
				execResult: '<p>foo[]<table><tr><td>bar</table><p>baz'
			},
			{	start: '<p>foo<table><tr><td>bar[]<br></table><p>baz',
				execResult: '<p>foo<table><tr><td>bar[]</table><p>baz'
			},
			{	start: '<table><tr><td>foo[]<br><td>bar</table>',
				execResult: '<table><tr><td>foo[]<td>bar</table>'
			},
			{	start: '<table><tr><td>foo[]<br><tr><td>bar</table>',
				execResult: '<table><tr><td>foo[]<tr><td>bar</table>'
			},
//			{	start: 'foo<table><tr><td>bar[]</table><br>baz',
//				execResult: 'foo<table><tr><td>bar[]</table><br>baz'
//			},
			{	start: 'foo[]<table><tr><td><hr>bar</table>baz',
				execResult: 'foo[]baz'
			},
//			{	start: '<table><tr><td>foo[]<td><hr>bar</table>',
//				execResult: ''
//			},
//			{	start: '<table><tr><td>foo[]<tr><td><hr>bar</table>',
//				execResult: ''
//			},
			{	start: 'foo[]<ol><li>bar<li>baz</ol>',
				execResult: 'foo[]bar<ol><li>baz</li></ol>'
			},
			{	start: 'foo[]<br><ol><li>bar<li>baz</ol>',
				execResult: 'foo[]bar<ol><li>baz</li></ol>'
			},
			{	start: '<ol><li>foo[]<li>bar</ol>',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>foo[]<br><li>bar</ol>',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>foo[]<li>bar<br>baz</ol>',
				execResult: '<ol><li>foo[]<li>bar<br>baz</ol>'
			},
			{	start: '<ol><li><p>foo[]<li>bar</ol>',
				execResult: '<ol><li><p>foo[]bar</p></li></ol>'
			},
			{	start: '<ol><li>foo[]<li><p>bar</ol>',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li><p>foo[]<li><p>bar</ol>',
				execResult: '<ol><li><p>foo[]bar</p></li></ol>'
			},
			{	start: '<ol><li>foo[]<ul><li>bar</ul></ol>',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: 'foo[]<ol><ol><li>bar</ol></ol>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<div><ol><li>bar</ol></div>',
				execResult: 'foo[]bar'
			},
//			{	start: 'foo[]<dl><dt>bar<dd>baz</dl>',
//				execResult: ''
//			},
//			{	start: 'foo[]<dl><dd>bar</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo[]<dd>bar</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo[]<dt>bar<dd>baz</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo<dd>bar[]<dd>baz</dl>',
//				execResult: ''
//			},
			{	start: '<ol><li>foo[]</ol>bar',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>foo[]<br></ol>bar',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>{}<br></ol>bar',
				execResult: '<ol><li>[]bar</li></ol>'
			},
			{	start: '<ol><li>foo<li>{}<br></ol>bar',
				execResult: '<ol><li>[]foo</li><li>bar</li></ol>'
			},
			{	start: '<ol><li>foo[]</ol><p>bar',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>foo[]<br></ol><p>bar',
				execResult: '<ol><li>foo[]bar</li></ol>'
			},
			{	start: '<ol><li>{}<br></ol><p>bar',
				execResult: '<ol><li>[]bar</li></ol>'
			},
			{	start: '<ol><li>foo<li>{}<br></ol><p>bar',
				execResult: '<ol><li>foo</li><li>[]bar</li></ol>'
			},
			{	start: '<ol><li>foo[]</ol><br>',
				execResult: '<ol><li>foo[]</li></ol>'
			},
			{	start: '<ol><li>foo[]<br></ol><br>',
				execResult: '<ol><li>foo[]</li></ol>'
			},
			{	start: '<ol><li>{}<br></ol><br>',
				execResult: '<ol><li>{}<br></li></ol>'
			},
			{	start: '<ol><li>foo<li>{}<br></ol><br>',
				execResult: '<ol><li>foo</li><li>[]<br></li></ol>'
			},
			{	start: '<ol><li>foo[]</ol><p><br>',
				execResult: '<ol><li>foo[]</li></ol>'
			},
			{	start: '<ol><li>foo[]<br></ol><p><br>',
				execResult: '<ol><li>foo[]</li></ol>'
			},
			{	start: '<ol><li>{}<br></ol><p><br>',
				execResult: '<ol><li>{}<br></li></ol>'
			},
			{	start: '<ol><li>foo<li>{}<br></ol><p><br>',
				execResult: '<ol><li>foo[]</li><li><br></li></ol>'
			},
			{	start: 'foo[]<blockquote>bar</blockquote>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<blockquote><blockquote>bar</blockquote></blockquote>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<blockquote><div>bar</div></blockquote>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<blockquote style="color: blue">bar</blockquote>',
				execResult: 'foo[]<span style="color: blue; ">bar</span>'
			},
			{	start: 'foo[]<blockquote><blockquote><p>bar<p>baz</blockquote></blockquote>',
				execResult: 'foo[]bar<blockquote><blockquote><p>baz</p></blockquote></blockquote>'
			},
			{	start: 'foo[]<blockquote><div><p>bar<p>baz</div></blockquote>',
				execResult: 'foo[]bar<blockquote><div><p>baz</p></div></blockquote>'
			},
			{	start: 'foo[]<blockquote style="color: blue"><p>bar<p>baz</blockquote>',
				execResult: 'foo[]<span style="color: blue; ">bar</span><blockquote style="color: blue"><p>baz</p></blockquote>'
			},
			{	start: 'foo[]<blockquote><p><b>bar</b><p>baz</blockquote>',
				execResult: 'foo[]<b>bar</b><blockquote><p>baz</p></blockquote>'
			},
			{	start: 'foo[]<blockquote><p><strong>bar</strong><p>baz</blockquote>',
				execResult: 'foo[]<strong>bar</strong><blockquote><p>baz</p></blockquote>'
			},
			{	start: 'foo[]<blockquote><p><span>bar</span><p>baz</blockquote>',
				execResult: 'foo[]<span>bar</span><blockquote><p>baz</p></blockquote>'
			},
			{	start: 'foo[]<blockquote><ol><li>bar</ol></blockquote><p>extra',
				execResult: 'foo[]bar<p>extra</p>'
			},
			{	start: 'foo[]<blockquote>bar<ol><li>baz</ol>quz</blockquote><p>extra',
				execResult: 'foo[]bar<blockquote><ol><li>baz</li></ol>quz</blockquote><p>extra</p>'
			},
			{	start: 'foo<blockquote><ol><li>bar[]</li><ol><li>baz</ol><li>quz</ol></blockquote><p>extra',
				execResult: 'foo<blockquote><ol><li>bar[]baz</li><li>quz</li></ol></blockquote><p>extra</p>'
			},
			{	start: 'foo[]<span></span>bar',
				execResult: 'foo[]ar'
			},
			{	start: 'foo[]<span><span></span></span>bar',
				execResult: 'foo[]ar'
			},
			{	start: 'foo[]<quasit></quasit>bar',
				execResult: 'foo[]ar'
			},
			{	start: 'foo[]<span></span><br>bar',
				execResult: 'foo[]ar'
			},
			{	start: '<span>foo[]<span></span></span>bar',
				execResult: '<span>foo[]</span>ar'
			},
			{	start: 'foo[]<span></span><span>bar</span>',
				execResult: 'foo[]<span>ar</span>'
			},
			{	start: 'foo[]<div><div><p>bar</div></div>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<div><div><p><!--abc-->bar</div></div>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<div><div><!--abc--><p>bar</div></div>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<div><!--abc--><div><p>bar</div></div>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[]<!--abc--><div><div><p>bar</div></div>',
				execResult: 'foo[]bar'
			},
			{	start: '<div><div><p>foo[]</div></div>bar',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</div></div><!--abc-->bar',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</div><!--abc--></div>bar',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p><!--abc--></div></div>bar',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]<!--abc--></div></div>bar',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div></div><div><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]<!--abc--></p></div></div><div><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p><!--abc--></div></div><div><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div><!--abc--></div><div><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div></div><!--abc--><div><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div></div><div><!--abc--><div><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div></div><div><div><!--abc--><div>bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<div><div><p>foo[]</p></div></div><div><div><div><!--abc-->bar</div></div></div>',
				execResult: '<div><div><p>foo[]bar</p></div></div>'
			},
			{	start: '<p style=color:blue>foo[]<p>bar',
				execResult: '<p><span style="color: blue; ">foo[]</span>bar</p>'
			},
			{	start: '<p style=color:blue>foo[]<p style=color:brown>bar',
				execResult: '<p style="color:blue">foo[]<span style="color: rgb(165, 42, 42); ">bar</span></p>'
			},
			{	start: '<p>foo[]<p style=color:brown>bar',
				execResult: '<p>foo[]<span style="color: rgb(165, 42, 42); ">bar</span></p>'
			},
//			{	start: '<p><font color=blue>foo[]</font><p>bar',
//				execResult: ''
//			},
//			{	start: '<p><font color=blue>foo[]</font><p><font color=brown>bar</font>',
//				execResult: ''
//			},
//			{	start: '<p>foo[]<p><font color=brown>bar</font>',
//				execResult: ''
//			},
			{	start: '<p><span style=color:blue>foo[]</font><p>bar',
				execResult: '<p><span style="color:blue">foo[]</span>bar</p>'
			},
			{	start: '<p><span style=color:blue>foo[]</font><p><span style=color:brown>bar</font>',
				execResult: '<p><span style="color:blue">foo[]</span><span style="color:brown">bar</span></p>'
			},
			{	start: '<p>foo[]<p><span style=color:brown>bar</font>',
				execResult: '<p>foo[]<span style="color:brown">bar</span></p>'
			},
			{	start: '<p style=background-color:aqua>foo[]<p>bar',
				execResult: '<p style="background-color:aqua">foo[]bar</p>'
			},
			{	start: '<p style=background-color:aqua>foo[]<p style=background-color:tan>bar',
				execResult: '<p style="background-color:aqua">foo[]bar</p>'
			},
			{	start: '<p>foo[]<p style=background-color:tan>bar',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p><span style=background-color:aqua>foo[]</font><p>bar',
				execResult: '<p><span style=background-color:aqua>foo[]</font><p>bar'
			},
			{	start: '<p><span style=background-color:aqua>foo[]</font><p><span style=background-color:tan>bar</font>',
				execResult: '<p><span style="background-color:aqua">foo[]</span><span style="background-color:tan">bar</span></p>'
			},
			{	start: '<p>foo[]<p><span style=background-color:tan>bar</font>',
				execResult: '<p>foo[]<span style="background-color:tan">bar</span></p>'
			},
			{	start: '<p style=text-decoration:underline>foo[]<p>bar',
				execResult: '<p><u>foo[]</u>bar</p>'
			},
			{	start: '<p style=text-decoration:underline>foo[]<p style=text-decoration:line-through>bar',
				execResult: '<p><u>foo[]</u><s>bar</s></p>'
			},
			{	start: '<p>foo[]<p style=text-decoration:line-through>bar',
				execResult: '<p>foo[]<s>bar</s></p>'
			},
			{	start: '<p><u>foo[]</u><p>bar',
				execResult: '<p><u>foo[]</u>bar</p>'
			},
			{	start: '<p><u>foo[]</u><p><s>bar</s>',
				execResult: '<p><u>foo[]</u><s>bar</s></p>'
			},
			{	start: '<p>foo[]<p><s>bar</s>',
				execResult: '<p>foo[]<s>bar</s></p>'
			},
			{	start: '<p style=color:blue>foo[]</p>bar',
				execResult: '<p><span style="color: blue; ">foo[]</span>bar</p>'
			},
			{	start: 'foo[]<p style=color:brown>bar',
				execResult: 'foo[]<span style="color: rgb(165, 42, 42); ">bar</span>'
			},
			{	start: '<div style=color:blue><p style=color:green>foo[]</div>bar',
				execResult: '<div><p><span style="color: green; ">foo[]</span>bar</p></div>'
			},
			{	start: '<div style=color:blue><p style=color:green>foo[]</div><p style=color:brown>bar',
				execResult: '<div style="color:blue"><p style="color:green">foo[]<span style="color: rgb(165, 42, 42); ">bar</span></p></div>'
			},
			{	start: '<p style=color:blue>foo[]<div style=color:brown><p style=color:green>bar',
				execResult: '<p style="color:blue">foo[]<span style="color: green; ">bar</span></p>'
			},
			{	start: 'foo[bar]baz',
				execResult: 'foo[]baz'
			},
			{	start: '<p>foo<span style=color:#aBcDeF>[bar]</span>baz',
				execResult: '<p>foo[]<span style="color:#aBcDeF"></span>baz</p>'
			},
			{	start: '<p>foo<span style=color:#aBcDeF>{bar}</span>baz',
				execResult: '<p>foo[]<span style="color:#aBcDeF"></span>baz</p>'
			},
			{	start: '<p>foo{<span style=color:#aBcDeF>bar</span>}baz',
				execResult: '<p>foo[]baz</p>'
			},
			{	start: '<p>[foo<span style=color:#aBcDeF>bar]</span>baz',
				execResult: '<p>[]baz</p>'
			},
			{	start: '<p>{foo<span style=color:#aBcDeF>bar}</span>baz',
				execResult: '<p>[]baz</p>'
			},
			{	start: '<p>foo<span style=color:#aBcDeF>[bar</span>baz]',
				execResult: '<p>foo[]<span style="color:#aBcDeF"></span></p>'
			},
			{	start: '<p>foo<span style=color:#aBcDeF>{bar</span>baz}',
				execResult: '<p>foo[]<span style="color:#aBcDeF"></span></p>'
			},
			{	start: '<p>foo<span style=color:#aBcDeF>[bar</span><span style=color:#fEdCbA>baz]</span>quz',
				execResult: '<p>foo[]<span style="color:#aBcDeF"></span>quz</p>'
			},
			{	start: 'foo<b>[bar]</b>baz',
				execResult: 'foo[]<b></b>baz'
			},
			{	start: 'foo<b>{bar}</b>baz',
				execResult: 'foo[]baz'
			},
			{	start: 'foo{<b>bar</b>}baz',
				execResult: 'foo[]<b></b>baz'
			},
			{	start: 'foo<span>[bar]</span>baz',
				execResult: 'foo[]<span></span>baz'
			},
			{	start: 'foo<span>{bar}</span>baz',
				execResult: 'foo[]baz'
			},
			{	start: 'foo{<span>bar</span>}baz',
				execResult: 'foo[]baz'
			},
			{	start: '<b>foo[bar</b><i>baz]quz</i>',
				execResult: '<b>foo[]<i>quz</i>'
			},
			{	start: '<p>foo</p><p>[bar]</p><p>baz</p>',
				execResult: '<p>foo[]</p><p></p><p>baz</p>'
			},
			{	start: '<p>foo</p><p>{bar}</p><p>baz</p>',
				execResult: '<p>foo[]</p><p>baz</p>'
			},
			{	start: '<p>foo</p><p>{bar</p>}<p>baz</p>',
				execResult: '<p>foo[]</p><p>baz</p>'
			},
			{	start: '<p>foo</p>{<p>bar}</p><p>baz</p>',
				execResult: '<p>foo[]</p><p>baz</p>'
			},
			{	start: '<p>foo</p>{<p>bar</p>}<p>baz</p>',
				execResult: '<p>foo[]</p><p>baz</p>'
			},
			{	start: '<p>foo[bar<p>baz]quz',
				execResult: '<p>foo[]quz</p>'
			},
			{	start: '<p>foo[bar<div>baz]quz</div>',
				execResult: '<p>foo[]quz</p>'
			},
			{	start: '<p>foo[bar<h1>baz]quz</h1>',
				execResult: '<p>foo[]quz</p>'
			},
			{	start: '<div>foo[bar</div><p>baz]quz',
				execResult: '<div>foo[]quz</div>'
			},
			{	start: '<blockquote>foo[bar</blockquote><pre>baz]quz</pre>',
				execResult: '<blockquote>foo[]quz</blockquote>'
			},
			{	start: '<p><b>foo[bar</b><p>baz]quz',
				execResult: '<p><b>foo[]</b>quz</p>'
			},
			{	start: '<div><p>foo[bar</div><p>baz]quz',
				execResult: '<div><p>foo[]quz</p></div>'
			},
			{	start: '<p>foo[bar<blockquote><p>baz]quz<p>qoz</blockquote', // interesting... is this broken by intention?
				execResult: '<p>foo[]quz</p><blockquote><p>qoz</p></blockquote>'
			},
			{	start: '<p>foo[bar<p style=color:blue>baz]quz',
				execResult: '<p>foo[]<span style="color: blue; ">quz</span></p>'
			},
			{	start: '<p>foo[bar<p><b>baz]quz</b>',
				execResult: '<p>foo[]<b>quz</b></p>'
			},
			{	start: '<div><p>foo<p>[bar<p>baz]</div>',
				execResult: '<div><p>foo[]</p><p></p></div>'
			},
			{	start: 'foo[<br>]bar',
				execResult: 'foo[]bar'
			},
			{	start: '<p>foo[</p><p>]bar</p>',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p>foo[</p><p>]bar<br>baz</p>',
				execResult: '<p>foo[]bar<br>baz</p>'
			},
			{	start: 'foo[<p>]bar</p>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo{<p>}bar</p>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo[<p>]bar<br>baz</p>',
				execResult: 'foo[]bar<p>baz</p>'
			},
			{	start: 'foo[<p>]bar</p>baz',
				execResult: 'foo[]bar<br>baz'
			},
			{	start: 'foo{<p>bar</p>}baz',
				execResult: 'foo[]baz'
			},
			{	start: 'foo<p>{bar</p>}baz',
				execResult: 'foo<p>[]baz</p>'
			},
			{	start: 'foo{<p>bar}</p>baz',
				execResult: 'foo[]<br>baz'
			},
			{	start: '<p>foo[</p>]bar',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p>foo{</p>}bar',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p>foo[</p>]bar<br>baz',
				execResult: '<p>foo[]bar</p>baz'
			},
			{	start: '<p>foo[</p>]bar<p>baz</p>',
				execResult: '<p>foo[]bar</p><p>baz</p>'
			},
			{	start: 'foo[<div><p>]bar</div>',
				execResult: 'foo[]bar'
			},
			{	start: '<div><p>foo[</p></div>]bar',
				execResult: '<div><p>foo[]bar</p></div>'
			},
			{	start: 'foo[<div><p>]bar</p>baz</div>',
				execResult: 'foo[]bar<div>baz</div>'
			},
			{	start: 'foo[<div>]bar<p>baz</p></div>',
				execResult: 'foo[]bar<div><p>baz</p></div>'
			},
			{	start: '<div><p>foo</p>bar[</div>]baz',
				execResult: '<div><p>foo</p>bar[]baz</div>'
			},
			{	start: '<div>foo<p>bar[</p></div>]baz',
				execResult: '<div>foo<p>bar[]baz</p></div>'
			},
			{	start: '<p>foo<br>{</p>]bar',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p>foo<br><br>{</p>]bar',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: 'foo<br>{<p>]bar</p>',
				execResult: 'foo[]bar'
			},
			{	start: 'foo<br><br>{<p>]bar</p>',
				execResult: 'foo[]bar'
			},
			{	start: '<p>foo<br>{</p><p>}bar</p>',
				execResult: '<p>foo[]bar</p>'
			},
			{	start: '<p>foo<br><br>{</p><p>}bar</p>',
				execResult: '<p>foo[]bar</p>'
			},
//			{	start: '<table><tbody><tr><th>foo<th>[bar]<th>baz<tr><td>quz<td>qoz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><th>foo<th>ba[r<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><th>fo[o<th>bar<th>b]az<tr><td>quz<td>qoz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><th>foo<th>bar<th>ba[z<tr><td>q]uz<td>qoz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><th>[foo<th>bar<th>baz]<tr><td>quz<td>qoz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><th>[foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz]</table>',
//				execResult: ''
//			},
//			{	start: '{<table><tbody><tr><th>foo<th>bar<th>baz<tr><td>quz<td>qoz<td>qiz</table>}',
//				execResult: ''
//			},
//			{	start: '<table><tbody><tr><td>foo<td>ba[r<tr><td>baz<td>quz<tr><td>q]oz<td>qiz</table>',
//				execResult: ''
//			},
//			{	start: '<p>fo[o<table><tr><td>b]ar</table><p>baz',
//				execResult: ''
//			},
//			{	start: '<p>foo<table><tr><td>ba[r</table><p>b]az',
//				execResult: ''
//			},
//			{	start: '<p>fo[o<table><tr><td>bar</table><p>b]az',
//				execResult: ''
//			},
			{	start: '<p>foo<ol><li>ba[r<li>b]az</ol><p>quz',
				execResult: '<p>foo</p><ol><li>ba[]az</li></ol><p>quz</p>'
			},
			{	start: '<p>foo<ol><li>bar<li>[baz]</ol><p>quz',
				execResult: '<p>foo</p><ol><li>bar</li><li>[]</li></ol><p>quz</p>'
			},
			{	start: '<p>fo[o<ol><li>b]ar<li>baz</ol><p>quz',
				execResult: '<p>fo[]ar</p><ol><li>baz</li></ol><p>quz</p>'
			},
			{	start: '<p>foo<ol><li>bar<li>ba[z</ol><p>q]uz',
				execResult: '<p>foo</p><ol><li>bar</li><li>ba[]uz</li></ol>'
			},
			{	start: '<p>fo[o<ol><li>bar<li>b]az</ol><p>quz',
				execResult: '<p>fo[]az</p><p>quz</p>'
			},
			{	start: '<p>fo[o<ol><li>bar<li>baz</ol><p>q]uz',
				execResult: '<p>fo[]uz</p>'
			},
			{	start: '<ol><li>fo[o</ol><ol><li>b]ar</ol>',
				execResult: '<ol><li>fo[]ar</li></ol>'
			},
			{	start: '<ol><li>fo[o</ol><ul><li>b]ar</ul>',
				execResult: '<ol><li>fo[]ar</li></ol>'
			},
			{	start: 'foo[<ol><li>]bar</ol>',
				execResult: 'foo[]bar'
			},
			{	start: '<ol><li>foo[<li>]bar</ol>',
				execResult: '<ol><li>foo[]bar</li></ol>'
			}
//			{	start: 'foo[<dl><dt>]bar<dd>baz</dl>',
//				execResult: ''
//			},
//			{	start: 'foo[<dl><dd>]bar</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo[<dd>]bar</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo[<dt>]bar<dd>baz</dl>',
//				execResult: ''
//			},
//			{	start: '<dl><dt>foo<dd>bar[<dd>]baz</dl>',
//				execResult: ''
//			}
		]
}
