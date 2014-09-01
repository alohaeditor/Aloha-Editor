(function (aloha, require, module, test, equal, deepEqual) {
	'use strict';

	require([
		'../src/dom-to-xtml',
		'../src/editing'
	], function (Xhtml, Editing) {
	
		module('editing');

		var Fn = aloha.fn;
		var Html = aloha.html;
		var Markers = aloha.markers;

		function testMutation(title, before, expected, mutate) {
			test(title, function () {
				$('#test-editable').empty().html(before);
				var dom = $('#test-editable')[0].firstChild;
				var boundaries = Markers.extract(dom);
				boundaries = mutate(dom, boundaries[0], boundaries[1]);
				Markers.insert(boundaries[0], boundaries[1]);
				var actual = Xhtml.nodeToXhtml(dom);
				if ($.type(expected) === 'function') {
					expected(actual);
				} else {
					equal(actual, expected, before + ' ⇒ ' + expected);
				}
			});
		}

		function testWrap(title, before, after) {
			testMutation(title, before, after, function (dom, start, end) {
				return Editing.wrap('B', start, end);
			});
		}

		function testUnformat(title, before, after) {
			testMutation(title, before, after, function (dom, start, end) {
				return Editing.wrap('B', start, end, true);
			});
		}

		function testFormat(title, before, after, styleNode, styleValue) {
			// Because different browsers render style attributes differently we
			// have to normalize them
			function expected(actual) {
				actual = actual
					.replace(/;"/g, '"')
					.replace(/; font-family: "/g, '"')
					.replace(/font-family: ; /g, '')
					.replace(/font-size: 18px; font-family: arial/g, 'font-family: arial; font-size: 18px');
				after = after.replace(/;"/g, '"');
				equal(actual, after, before + ' ⇒  ' + after);
			}
			function isObstruction(node) {
				return !Html.hasInlineStyle(node) || 'CODE' === node.nodeName;
			}
			var opts = {isObstruction: isObstruction};
			testMutation('editing.format - ' + title, before, expected, function (dom, start, end) {
				return Editing.format(start, end, styleNode);
			});
		}

		function testStyle(title, before, after, styleName, styleValue) {
			// Because different browsers render style attributes differently we
			// have to normalize them
			function expected(actual) {
				actual = actual
					.replace(/;"/g, '"')
					.replace(/; font-family: "/g, '"')
					.replace(/font-family: ; /g, '')
					.replace(/font-size: 18px; font-family: arial/g, 'font-family: arial; font-size: 18px');
				after = after.replace(/;"/g, '"');
				equal(actual, after, before + ' ⇒  ' + after);
			}
			function isObstruction(node) {
				return !Html.hasInlineStyle(node) || 'CODE' === node.nodeName;
			}
			var opts = {isObstruction: isObstruction};
			testMutation('editing.format - ' + title, before, expected, function (dom, start, end) {
				return Editing.style(start, end, styleName, styleValue, opts);
			});
		}

		var t = function (title, before, after) {
			testWrap('editing.wrap -' + title, before, after);
		};

		t('noop1', '<p><b>[Some text.]</b></p>',        '<p><b>{Some text.}</b></p>');
		t('noop2', '<p>{<b>Some text.</b>}</p>',        '<p>{<b>Some text.</b>}</p>');
		t('noop3', '<p><b><i>[Some text.]</i></b></p>', '<p><b><i>{Some text.}</i></b></p>');

		t('join existing context elements',
		  '<p>{<b>Some</b><b> text.</b>}</p>',
		  '<p>{<b>Some text.</b>}</p>');

		t('bolding a node with text boundaries',
		  '<p>[Some text.]</p>',
		  '<p>{<b>Some text.</b>}</p>');

		t('bolding an node, splitting text',
		  '<p>So[me te]xt.</p>',
		  '<p>So{<b>me te</b>}xt.</p>');

		t('bolding a node with element boundaries',
		  '<p>{<i>Some text.</i>}</p>',
		  '<p>{<b><i>Some text.</i></b>}</p>');

		t('descending two levels down to each boundary, with boundaries at start and end respectively',
		  '<p><i>one<em>{Some</em>left</i>text<i>right<em>.}</em>two</i></p>',
		  '<p><i>one<b><em>{Some</em>left</b></i><b>text</b><i><b>right<em>.}</em></b>two</i></p>');
		// Same as above except "with boundaries inside text node"
		t('descending two levels down to each boundary, with boundaries inside text node',
		  '<p><i>one<em>!{Some</em>left</i>text<i>right<em>.}!</em>two</i></p>',
		  '<p><i>one<em>!{<b>Some</b></em><b>left</b></i><b>text</b><i><b>right</b><em><b>.</b>}!</em>two</i></p>');
		// Same as above except "with boundaries at end/start of container"
		t('descending two levels down to each boundary, with boundaries at end/start of container',
		  '<p><i>one<em>!{</em>left</i>text<i>right<em>}!</em>two</i></p>',
		  '<p><i>one<em>!</em>{<b>left</b></i><b>text</b><i><b>right</b>}<em>!</em>two</i></p>');
		// Same as above except "with boundaries in empty container"
		t('descending two levels down to each boundary, with boundaries in empty container',
		  '<p><i>one<em>{</em>left</i>text<i>right<em>}</em>two</i></p>',
		  '<p><i>one<em></em>{<b>left</b></i><b>text</b><i><b>right</b>}<em></em>two</i></p>');

		t('expand bold range to the right',
		  '<p><b>one {two</b> three}</p>',
		  '<p><b>one [two three</b>}</p>');

		t('expand bold range to the left',
		  '<p>{one <b>two} three</b></p>',
		  '<p>{<b>one two] three</b></p>');

		t('expand bold range to the left and right',
		  '<p>{one <b>two</b> three}</p>',
		  '<p>{<b>one two three</b>}</p>');

		var t = function (title, before, after) {
			testWrap('editing.wrap-restack - ' + title, before, after);
		};

		t('across elements',
		  '<p><i>{one</i>two<i>three<em>four}</em></i></p>',
		  '<p><b><i>{one</i>two<i>three<em>four}</em></i></b></p>');

		t('with existing bold element',
		  '<p><i><u><s><b>Some</b></s></u>{ text}</i></p>',
		  '<p><i><b><u><s>Some</s></u>{ text</b>}</i></p>');

		t('with non ignorable content before element to restack',
		  '<p><i><u><s>!<b>Some</b></s></u>{ text}</i></p>',
		  '<p><i><u><s>!<b>Some</b></s></u>{<b> text</b>}</i></p>');

		t('with non ignorable content after element to restack',
		  '<p><i><u><s><b>Some</b>!</s></u>{ text}</i></p>',
		  '<p><i><u><s><b>Some</b>!</s></u>{<b> text</b>}</i></p>');

		t('with non ignorable content between child/parent at end',
		  '<p><i><u><s><b>Some</b></s>!</u>{ text}</i></p>',
		  '<p><i><u><s><b>Some</b></s>!</u>{<b> text</b>}</i></p>');

		t('with non ignorable content between child/parent at start',
		  '<p><i><u>!<s><b>Some</b></s></u>{ text}</i></p>',
		  '<p><i><u>!<s><b>Some</b></s></u>{<b> text</b>}</i></p>');

		t('with non ignorable content as previous sibling to bolded text',
		  '<p><i><u><s><b>Some</b></s></u>!{ text}</i></p>',
		  '<p><i><u><s><b>Some</b></s></u>!{<b> text</b>}</i></p>');

		var t = function (title, before, after) {
			testUnformat('editing.unformat - ' + title, before, after);
		};

		t('noop', '<p>{Some text.}</p>', '<p>{Some text.}</p>');

		t('unbolding parent with text boundaries',
		  '<p><b>[Some text.]</b></p>',
		  '<p>{Some text.}</p>');

		t('unbolding parent with element boundaries',
		  '<p><b>{<i>Some text.</i>}</b></p>',
		  '<p>{<i>Some text.</i>}</p>');

		t('unbolding ancestor',
		  '<p><b><i>{Some text.}</i></b></p>',
		  '<p><i>{Some text.}</i></p>');

		t('unbolding end tag 1',
		  '<p><b><i>one{</i>two}</b></p>',
		  '<p><b><i>one</i></b>{two}</p>');

		t('unbolding start tag 1',
		  '<p><b>{one<i>}two</i></b></p>',
		  '<p>{one}<b><i>two</i></b></p>');

		t('unbolding end tag with additional previous sibling',
		  '<p><b>one<i>two{</i>three}</b></p>',
		  '<p><b>one<i>two</i></b>{three}</p>');

		t('unbolding start tag with additional next sibling',
		  '<p><b>{one<i>}two</i>three</b></p>',
		  '<p>{one}<b><i>two</i>three</b></p>');

		t('pushing down through commonAncestorContainer',
		  '<p>-<b>So{me te}xt</b>-</p>',
		  '<p>-<b>So</b>{me te}<b>xt</b>-</p>');

		t('pushing down one level through commonAncestorContainer',
		  '<p><b>one<i>{Some text.}</i>two</b></p>',
		  '<p><b>one</b><i>{Some text.}</i><b>two</b></p>');

		t('pushing down two levels through commonAncestorContainer',
		  '<p><b>one<em>two<i>{Some text.}</i>three</em>four</b></p>',
		  '<p><b>one</b><em><b>two</b><i>{Some text.}</i><b>three</b></em><b>four</b></p>');

		t('pushing down two levels through commonAncestorContainer,'
		  + ' and two levels down to each boundary,'
		  + ' with boundaries at start/end respectively',
		  '<p><b>1<em>2<i>3<sub>4<u>{Some</u>Z</sub>text<sub>Z<u>.}</u>5</sub>6</i>7</em>8</b></p>',
		  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4</b><u>{Some</u>Z</sub>text<sub>Z<u>.}</u><b>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');

		// Same as above except "boundaries in the middle"
		t('pushing down two levels through commonAncestorContainer,'
		  + ' and two levels down to each boundary,'
		  + ' with boundaries in the mioddle',
		  '<p><b>1<em>2<i>3<sub>4<u>left{Some</u>Z</sub>text<sub>Z<u>.}right</u>5</sub>6</i>7</em>8</b></p>',
		  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4</b><u><b>left</b>{Some</u>Z</sub>text<sub>Z<u>.}<b>right</b></u><b>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');

		// Same as above except "boundaries at end/start respectively"
		t('pushing down two levels through commonAncestorContainer,'
		  + ' and two levels down to each boundary,'
		  + ' with boundaries at start/end respectively',
		  '<p><b>1<em>2<i>3<sub>4<u>Some{</u>Z</sub>text<sub>Z<u>}.</u>5</sub>6</i>7</em>8</b></p>',
		  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4<u>Some</u></b>{Z</sub>text<sub>Z}<b><u>.</u>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');

		// Same as above except "boundaries in empty container"
		t('pushing down two levels through commonAncestorContainer,'
		  + ' and two levels down to each boundary,'
		  + ' with boundaries in empty container',
		  '<p><b>1<em>2<i>3<sub>4<u>{</u>Z</sub>text<sub>Z<u>}</u>5</sub>6</i>7</em>8</b></p>',
		  '<p><b>1</b><em><b>2</b><i><b>3</b><sub><b>4<u></u></b>{Z</sub>text<sub>Z}<b><u></u>5</b></sub><b>6</b></i><b>7</b></em><b>8</b></p>');

		testMutation('don\'t split if opts.below returns false',
					 '<div><i>a[b</i>c<b>d]e</b></div>',
					 '<div><i>a[b</i>c<b>d]e</b></div>',
					 function (dom, start, end) {
						var range = aloha.boundaries.range(start, end);
						return Editing.split(range, {below: Fn.returnFalse});
					 });

		t = function (title, before, after) {
			testStyle(title, before, after, 'font-family', 'arial');
		};

		t('format some text',
		  '<p>Some [text]</p>',
		  '<p>S<span style="font-family: times;">om{<span style="font-family: arial;">onee ttwo</span>}ex</span>t</p>');

		t('push down through one level',
		  '<p><span style="font-family: arial;"><span style="font-family: times;">Som{e t}ext</span></span></p>',
		  '<p><span style="font-family: arial;"><span style="font-family: times;">Som</span>{e t}<span style="font-family: times;">ext</span></span></p>');

		t('reuse outer element directly above',
		  '<p>one<span style="font-family: times;">[Some text]</span>two</p>',
		  '<p>one<span style="font-family: arial;">{Some text}</span>two</p>');

		t('reuse outer element one level up',
		  '<p>one<span style="font-family: times;"><b>[Some text]</b></span>two</p>',
		  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

		t('reuse outer element that has neither an override or context',
		  '<p>one<span><b>[Some text]</b></span>two</p>',
		  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

		t('prefer to reuse outer elements above commonAncestorContainer',
		  '<p>one <span style="font-family: times;">{<span style="font-family: helvetica;">two three</span>}</span> four</p>',
		  '<p>one <span style="font-family: arial;">{two three}</span> four</p>');

		t('don\'t reuse if there is an obstruction before ("x")',
		  '<p>one<span style="font-family: times;">x<b>[Some text]</b></span>two</p>',
		  '<p>one<span style="font-family: times;">x<b>{<span style="font-family: arial;">Some text</span>}</b></span>two</p>');
		  '<p>one<span style="font-family: times;">x</span><b>{<span style="font-family: arial;">Some text</span>}</b>two</p>'

		t('don\'t reuse if there is an obstruction after ("x")',
		  '<p>one<span style="font-family: times;"><b>[Some text]x</b></span>two</p>',
		  '<p>one<span style="font-family: times;"><b>{<span style="font-family: arial;">Some text</span>}x</b></span>two</p>');

		t('don\'t reuse if there is an obstruction above (code tag)',
		  '<p>one<span style="font-family: times;"><code>[Some text]</code></span>two</p>',
		  '<p>one<span style="font-family: times;"><code>{<span style="font-family: arial;">Some text</span>}</code></span>two</p>');

		t('extend style right 1',
		  '<p><span style="font-family: arial;">one {two</span> three}</p>',
		  '<p><span style="font-family: arial;">one [two three</span>}</p>');

		t('extend style left 1',
		  '<p>{one <span style="font-family: arial;">two} three</span></p>',
		  '<p>{<span style="font-family: arial;">one two] three</span></p>');

		t('extend style right 2',
		  '<p><span style="font-family: arial; font-size: 18px;">one {two</span> three}</p>',
		  '<p><span style="font-family: arial; font-size: 18px;">one [two</span><span style="font-family: arial;"> three</span>}</p>');

		t('extend style left 2',
		  '<p>{one <span style="font-family: arial; font-size: 18px;">two} three</span></p>',
		  '<p>{<span style="font-family: arial;">one </span><span style="font-family: arial; font-size: 18px;">two] three</span></p>');

		t('push down style without removing wrapper span',
		  '<p><span style="font-size: 18px; font-family: times;">one {two</span> three}</p>',
		  '<p><span style="font-size: 18px;"><span style="font-family: times;">one </span>{<span style="font-family: arial;">two</span></span><span style="font-family: arial;"> three</span>}</p>');

		t('merge wrappers with the same styles',
		  '<p><span style="font-family: arial;">one</span>{two}</p>',
		  '<p><span style="font-family: arial;">one[two</span>}</p>');

		t('don\'t merge wrappers with additionals styles',
		  '<p><span style="font-family: arial; font-size: 18px;">one</span>{two}</p>',
		  '<p><span style="font-family: arial; font-size: 18px;">one</span>{<span style="font-family: arial;">two</span>}</p>');

		t('don\'t merge wrappers with differing values for the same style',
		  '<p><span style="font-family: times;">one</span>{two}</p>',
		  '<p><span style="font-family: times;">one</span>{<span style="font-family: arial;">two</span>}</p>');

		t('reuse outer wrapper and clear nested contexts',
		  '<p><span style="font-family: times;">{one}<span style="font-family: arial;">two</span></span>three</p>',
		  '<p><span style="font-family: arial;">{one]two</span>three</p>');

		t('merge forward',
		  '<p>[one]<span style="font-family: arial;">two</span></p>',
		  '<p>{<span style="font-family: arial;">one]two</span></p>');

		t('don\'t merge forward incompatible style',
		  '<p>[one]<span style="color: black;">two</span></p>',
		  '<p>{<span style="font-family: arial;">one</span>}<span style="color: black;">two</span></p>');

		t('merge back',
		  '<p><span style="font-family: arial;">one</span>[two]</p>',
		  '<p><span style="font-family: arial;">one[two</span>}</p>');

		t('don\'t merge back incompatible style',
		  '<p><span style="color: black;">one</span>[two]</p>',
		  '<p><span style="color: black;">one</span>{<span style="font-family: arial">two</span>}</p>');

		t('range outside and inside element to be formatted',
		  '<p>Some {<a>more}</a> text</p>',
		  '<p>Some {<a><span style="font-family: arial">more</span>}</a> text</p>');

		t('first cac child of start and end positions are equal',
		  '<p>Some {<a>t}ext</a></p>',
		  '<p>Some {<a><span style="font-family: arial">t</span>}ext</a></p>');

		// Because the following tests depend on some CSS classes to be available:
		$('body').prepend('<style>'
						  + '.test-bold { font-weight: bold; }'
						  + '.test-strong { font-weight: bold; }'
						  + '.test-italic { font-style: italic; }'
						  + '.test-emphasis { font-style: italic; }'
						  + '.test-underline { text-decoration: underline; }'
						  + '</style>');

		t = function (title, before, after, styleValue) {
			// Because we want to write tests only against a single wrapper
			// format (<b>), but run them against all wrapper formats.
			var formats = [
				{name: 'bold', nodeName: 'b', styleOn: 'font-weight: bold', styleOff: 'font-weight: normal'},
				{name: 'strong', nodeName: 'strong', styleOn: 'font-weight: bold', styleOff: 'font-weight: normal'},
				{name: 'italic', nodeName: 'i', styleOn: 'font-style: italic', styleOff: 'font-style: normal'},
				{name: 'emphasis', nodeName: 'em', styleOn: 'font-style: italic', styleOff: 'font-style: normal'},
				{name: 'underline', nodeName: 'u', styleOn: 'text-decoration: underline', styleOff: 'text-decoration: none'}
			];
			function replace(format, html) {
				return (html.replace(/<(\/?)b>/g, '<$1' + format.nodeName + '>')
						.replace(/font-weight: bold/g, format.styleOn)
						.replace(/font-weight: normal/g, format.styleOff)
						.replace(/test-bold/g, 'test-' + format.name));
			}
			for (var i = 0; i < formats.length; i++) {
				var format = formats[i];
				testStyle(format.name + ' - ' + title, replace(format, before), replace(format, after), format.name, styleValue);
			}
		};

		t('use wrapper element instead of style',
		  '<p>So[me t]ext</p>',
		  '<p>So{<b>me t</b>}ext</p>',
		  true);

		t('clear styles when wrapped with an element',
		  '<p>S{o<span style="font-weight: bold">me te</span>x}t</p>',
		  '<p>S{<b>ome tex</b>}t</p>',
		  true);

		t('unformatting with a non-clearable ancestor will set a normal style',
		  '<p style="font-weight: bold">So[me te]xt</p>',
		  '<p style="font-weight: bold">So{<span style="font-weight: normal">me te</span>}xt</p>',
		  false);

		// We could argue here that it should really be
		// '<p>So<span style="font-weight: bold">m</span>{<b>e te</b>}xt</p>'
		// But the way the algorithm works is that nodes will be merged into
		// a wrapper to the left, and if that already exists it will be
		// reused.
		t('extending existing style',
		  '<p>So<span style="font-weight: bold">m{e </span>te}xt</p>',
		  '<p>So<span style="font-weight: bold">m[e te</span>}xt</p>',
		  true);

		t('pushing down through wrapper',
		  '<p>So<b>m{e t}e</b>xt</p>',
		  '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
		  false);

		testStyle('italic - pushing down through alternative wrapper',
				   '<p>So<em>m{e t}e</em>xt</p>',
				   '<p>So<i>m</i>{e t}<i>e</i>xt</p>',
				   'italic',
				   false);

		testStyle('bold - pushing down through alternative wrapper',
				   '<p>So<strong>m{e t}e</strong>xt</p>',
				   '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
				   'bold',
				   false);

		testStyle('italic - clear alternative wrapper',
				   '<p>S{o<em>me te</em>x}t</p>',
				   '<p>S[ome tex]t</p>',
				   'italic',
				   false);

		testStyle('italic - clear alternative wrapper',
				   '<p>S{o<strong>me te</strong>x}t</p>',
				   '<p>S[ome tex]t</p>',
				   'bold',
				   false);

		t('pushing down through styled element',
		  '<p>So<span style="font-weight: bold">m{e t}e</span>xt</p>',
		  '<p>So<b>m</b>{e t}<b>e</b>xt</p>',
		  false);

		// NB when this test is executed for "text-decoration: underline" the
		// result will look like the result for bold, but the visual result will be
		// incorrect, since it's not possible to unformat an underline in an inner
		// element. The only way to unformat an underline is to split the underline
		// ancestor, but we can't do that when a class is set on the ancestor
		t('unformat inside class context',
		  '<p><span class="test-bold">Som[e t]ext</span></p>',
		  '<p><span class="test-bold">Som{<span style="font-weight: normal">e t</span>}ext</span></p>',
		  false);

		t('unformat inside class context one level up',
		  '<p>So<span class="test-bold"><ins>m[e t]e</ins></span>xt</p>',
		  '<p>So<span class="test-bold"><ins>m{<span style="font-weight: normal">e t</span>}e</ins></span>xt</p>',
		  false);

		t('unformat inside class context one level up with em inbetween',
		  '<p>So<span class="test-bold"><em>m[e t]e</em></span>xt</p>',
		  '<p>So<span class="test-bold"><em>m{<span style="font-weight: normal">e t</span>}e</em></span>xt</p>',
		  false);

		t('reuse class context',
		  '<p>So<span class="test-bold">{me te}</span>xt</p>',
		  '<p>So<span class="test-bold">{me te}</span>xt</p>',
		  true);

		t('format inside class context',
		  '<p><span class="test-bold">Som{<span style="font-weight: normal">e t</span>}ext</span></p>',
		  '<p><span class="test-bold">Som[e t]ext</span></p>',
		  true);

		t('Don\'t set a CSS style if there is already a class on it',
		  '<p>S{o<span class="test-bold">me te</span>x}t</p>',
		  '<p>S{<b>o</b><span class="test-bold">me te</span><b>x</b>}t</p>',
		  true);

		t('Don\'t violate contained-in rules',
		  '<ul>{<li><ins>Some</ins> <del>text</del></li>}</ul>',
		  '<ul>{<li><b><ins>Some</ins> <del>text</del></b></li>}</ul>',
		  true);

	});

}(window.aloha, window.require, window.module, window.test, window.equal, window.deepEqual));
