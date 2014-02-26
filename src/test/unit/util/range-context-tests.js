Aloha.require([
	'aloha/core',
	'jquery',
	'util/dom2',
	'util/html',
	'util/boundary-markers',
	'util/range-context',
	'dom-to-xhtml/dom-to-xhtml',
	'aloha/rangy-core',
], function (
	Aloha,
	$,
	Dom,
	Html,
	BoundaryMarkers,
	RangeContext,
	DomToXhtml
) {
	'use strict';
	window.rangy.init();

	module('RangeContext');

	function switchElemTextSelection(html) {
		return html.replace(/[\{\}\[\]]/g, function (match) {
			return {'{': '[',
					'}': ']',
					'[': '{',
					']': '}'}[match];
		});
	}

	function testMutation(title, before, expected, mutate) {
		test(title, function () {
			var dom = $(before)[0];
			var range = Aloha.createRange();
			BoundaryMarkers.extract(dom, range);
			dom = mutate(dom, range) || dom;
			BoundaryMarkers.insert(range);
			var actual = DomToXhtml.nodeToXhtml(dom);
			if ($.type(expected) === 'function') {
				expected(actual);
			} else {
				equal(actual, expected);
			}
		});
	}

	function testMutationSwitchElemTextSelection(title, before, after, mutate) {
		testMutation(title, before, after, mutate);
		var afterSwitched = switchElemTextSelection(after);
		testMutation(title, switchElemTextSelection(before), function (actual) {
			if (actual !== afterSwitched
				    // Because it's ok it's ok as long as they come out
				    // at the same position, we ignore differences between
				    // selection type (text or element boundaries).
				    && actual !== after
				    // Because we must account for end of text node
				    // normalization performed by Dom.nodeAtOffset() and
				    // Dom.isAtEnd().
				    && actual !== afterSwitched.replace(/\]/g, '}')
				    ) {
				if (actual !== afterSwitched) {
					equal(actual, afterSwitched);
				} else if (actual !== afterSwitched.replace(/\]/g, '}')) {
					equal(actual, afterSwitched.replace(/\]/g, '}'));
				} else if (actual !== after) {
					equal(actual, after);
				}
			}
		}, mutate);
	}

	function testFormat(title, before, after) {
		testMutation(title, before, after, function (dom, range) {
			RangeContext.format(range, 'B');
		});
	}

	function testUnformat(title, before, after) {
		testMutation(title, before, after, function (dom, range) {
			RangeContext.unformat(range, 'B');
		});
	}

	function testInsertExtractBoundaryMarkers(title, htmlWithBoundaryMarkers) {
		test(title, function () {
			var dom = $(htmlWithBoundaryMarkers)[0];
			var range = Aloha.createRange();
			BoundaryMarkers.extract(dom, range);
			equal(DomToXhtml.nodeToXhtml(dom), htmlWithBoundaryMarkers.replace(/[\[\{\}\]]/g, ''));
			BoundaryMarkers.insert(range);
			equal(DomToXhtml.nodeToXhtml(dom), htmlWithBoundaryMarkers);
		});
	};

	function testInsertExtractBoundaryMarkers2(title, htmlWithBoundaryMarkers) {
		testInsertExtractBoundaryMarkers(title, htmlWithBoundaryMarkers);
		testInsertExtractBoundaryMarkers(title, switchElemTextSelection(htmlWithBoundaryMarkers));
	}

	function testTrimRange(title, before, after, switched) {
		testMutationSwitchElemTextSelection(title, before, after, function (dom, range) {
			Dom.trimRangeClosingOpening(range, Html.isIgnorableWhitespace);
		});
	}

	var t = function (htmlWithBoundaryMarkers) {
		testInsertExtractBoundaryMarkers('extractBoundaryMarkers,insertBoundaryMarkers', htmlWithBoundaryMarkers);
	};
	t('<p>{Some text.}</p>');
	t('<p>Some{ }text.</p>');
	t('<p>{}Some text.</p>');
	t('<p>Some text.{}</p>');
	t('<p>Som{}e text.</p>');
	t('<p>{<b>Some text.</b>}</p>');
	t('<p>12{34<b>Some text.</b>56}78</p>');
	t('<p>{1234<b>Some text.</b>5678}</p>');
	t('<p>1234{<b>Some text.</b>}5678</p>');

	var t = function (before, after) {
		testTrimRange('Dom.trimRange', before, after);
	};
	t('<p>So[me te]xt.</p>', '<p>So[me te]xt.</p>');
	t('<p>So[]xt.</p>', '<p>So[]xt.</p>');
	t('<p>{Some text.}</p>', '<p>{Some text.}</p>');
	t('<p>{}Some text.</p>', '<p>{}Some text.</p>');
	t('<p>Some text.{}</p>', '<p>Some text.{}</p>');
	t('<p>{}</p>', '<p>{}</p>');
	t('<p><b>So[me</b><i> </i><b>te]xt.</b></p>',
	  '<p><b>So[me</b><i> </i><b>te]xt.</b></p>');		
	t('<p><b>Some</b>{<i> </i>}<b>text.</b></p>',
	  '<p><b>Some</b>{<i> </i>}<b>text.</b></p>');		
	t('<p><b>[Some</b><i> </i><b>text.]</b></p>',
	  '<p><b>[Some</b><i> </i><b>text.]</b></p>');		
	t('<p><b>{</b><i>}</i></p>', '<p><b></b>{}<i></i></p>');
	t('<p><b><i>{</i></b><i><b>}</b></i></p>',
	  '<p><b><i></i></b>{}<i><b></b></i></p>');
	t('<p><b><i>one{</i></b><i>two</i><b><i>}three</i></b></p>',
	  '<p><b><i>one</i></b>{<i>two</i>}<b><i>three</i></b></p>');
	t('<p><b><i>one{</i>.</b><i>two</i><b>.<i>}three</i></b></p>',
	  '<p><b><i>one</i>{.</b><i>two</i><b>.}<i>three</i></b></p>');
	t('<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>',
	  '<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>');

	var t = function (title, before, after) {
		testFormat('RangeContext.format -' + title, before, after);
	};

	t('noop1', '<p><b>[Some text.]</b></p>', '<p><b>{Some text.}</b></p>');
	t('noop2', '<p>{<b>Some text.</b>}</p>', '<p>{<b>Some text.</b>}</p>');
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
	  '<p><i>one<b><em>{Some</em>left</b></i><b>text</b><i><b>right</b><em><b>.</b>}</em>two</i></p>');
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

	var t = function (title, before, after) {
		testFormat('RangeContext.format-restack - ' + title, before, after);
	};

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
		testUnformat('RangeContext.unformat - ' + title, before, after);
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

	t('unbolding end tag',
	  '<p><b><i>one{</i>two}</b></p>',
	  '<p><b><i>one</i></b>{two}</p>');
	t('unbolding start tag',
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

	t = function (title, before, after) {
		function isSplittable(node) {
			return node.nodeName !== 'STRONG' && Html.isInlineFormattable(node);
		}
		testMutation('RangeContext.splitBoundary+format - ' + title, before, after, function (dom, range) {
			RangeContext.splitBoundary(range, isSplittable);
			RangeContext.format(range, 'B');
		});
	};

	t('a single level to the right',
	  '<p>So[me <i>te]xt</i></p>',
	  '<p>So{<b>me <i>te</i></b>}<i>xt</i></p>');

	t('multiple levels to the right',
	  '<p>So[me <i>a<u>b]c</u></i></p>',
	  '<p>So{<b>me <i>a<u>b</u></i></b>}<i><u>c</u></i></p>');

	t('multiple levels to the left and right',
	  '<p>S<sub>o<em>{m</em></sub>e <i>a<u>b]c</u></i></p>',
	  '<p>S<sub>o</sub><b><sub><em>{m</em></sub>e <i>a<u>b</u></i></b>}<i><u>c</u></i></p>');

	t('end positions will be skipped and not split',
	  '<p><i><u><sub>{</sub></u>a</i>b<i>c<u><sub>}</sub></u></i></p>',
	  '<p><i><u><sub></sub></u></i><b><i>{a</i>b<i>c</i></b>}<i><u><sub></sub></u></i></p>');

	t('only split inline formattable on the left, and with element siblings on the right',
	  '<p><i><em>-</em><strong>Some<em>-{-</em>text</strong></i>-<i><em>-</em><em>-</em>}<em>-</em><em>-</em></i></p>',
	  '<p><i><em>-</em></i><i><strong>Some<em>-{<b>-</b></em><b>text</b></strong></i><b>-<i><em>-</em><em>-</em></i></b>}<i><em>-</em><em>-</em></i></p>');

	t = function (title, before, after) {
		// Because IE7 will display "font-family: xx" without an
		// ending ";" whereas other browsers will add an ending ";".
		function expected(actual) {
			equal(actual.replace(/;"/g, '"'), after.replace(/;"/g, '"'));
		}
		// Because IE7 leaves the style attribute as style="font-family:
		// " after removing the font-family style, which interfers with
		// the default isPrunable check.
		function isPrunableIe7(node) {
			return ('SPAN' === node.nodeName
					&& (!$(node).css('font-family')
						|| 'auto' == $(node).css('font-family')));
		}
		var isPrunable = ($.browser.msie && parseInt($.browser.version) == 7
						  ? isPrunableIe7
						  : null);
		testMutation('RangeContext.formatStyle - ' + title, before, expected, function (dom, range) {
			RangeContext.formatStyle(range, 'font-family', 'arial', null, null, null, isPrunable);
		});
	};

	t('format some text',
	  '<p>Some [text]</p>',
	  '<p>Some {<span style="font-family: arial;">text</span>}</p>');

	t('reuse an existing span',
	  '<p>Some {<span>text</span>}</p>',
	  '<p>Some {<span style="font-family: arial;">text</span>}</p>');

	t('alternating overrides (times/verdana); don\'t replace existing override (helvetica); element inbetween overrides (&lt;b>)',
	  '<p>Some <span style="font-family: times;">a<b><span style="font-family: helvetica;">b</span>c<span style="font-family: verdana;">d{e</span>f</b>g</span>}</p>',
	  '<p>Some <span style="font-family: times;">a</span><b><span style="font-family: helvetica;">b</span><span style="font-family: times;">c</span><span style="font-family: verdana;">d</span>{<span style="font-family: arial;">ef</span></b><span style="font-family: arial;">g</span>}</p>');

	t('don\'t push down the cac even if it is an override',
	  '<p>S<span style="font-family: times;">om{e t}ex</span>t</p>',
	  '<p>S<span style="font-family: times;">om{<span style="font-family: arial;">e t</span>}ex</span>t</p>');

	t('expand style',
	  '<p>S<span style="font-family: times;">om{one<span style="font-family: arial;">e t</span>two}ex</span>t</p>',
	  '<p>S<span style="font-family: times;">om{<span style="font-family: arial;">onee ttwo</span>}ex</span>t</p>');

	t('push down through one level',
	  '<p><span style="font-family: arial;"><span style="font-family: times;">Som{e t}ext</span></span></p>',
	  '<p><span style="font-family: arial;"><span style="font-family: times;">Som</span>{e t}<span style="font-family: times;">ext</span></span></p>');

	t('reuse outer element',
	  '<p>one<span style="font-family: times;">[Some text]</span>two</p>',
	  '<p>one<span style="font-family: arial;">{Some text}</span>two</p>');

	t('reuse outer element one level up',
	  '<p>one<span style="font-family: times;"><b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

	t('reuse outer element that has neither an override or context',
	  '<p>one<span><b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: arial;"><b>{Some text}</b></span>two</p>');

	t('don\'t reuse if there is an obstruction before ("x")',
	  '<p>one<span style="font-family: times;">x<b>[Some text]</b></span>two</p>',
	  '<p>one<span style="font-family: times;">x<b>{<span style="font-family: arial;">Some text</span>}</b></span>two</p>');

	t('don\'t reuse if there is an obstruction after ("x")',
	  '<p>one<span style="font-family: times;"><b>[Some text]x</b></span>two</p>',
	  '<p>one<span style="font-family: times;"><b>{<span style="font-family: arial;">Some text</span>}x</b></span>two</p>');

	t('don\'t reuse if there is an obstruction above (&lt;code>)',
	  '<p>one<span style="font-family: times;"><code>[Some text]</code></span>two</p>',
	  '<p>one<span style="font-family: times;"><code>{<span style="font-family: arial;">Some text</span>}</code></span>two</p>');

	t('don\'t reuse if it is an editable span',
		'<p>one<span contenteditable="true" style="font-family: times;">[Some text]</span>two</p>',
		'<p>one<span contenteditable="true" style="font-family: times;">{<span style="font-family: arial;">Some text</span>}</span>two</p>');

});
