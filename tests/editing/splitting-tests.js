(function (aloha, require, module, test, equal, deepEqual) {
	'use strict';

	require([
		'../src/dom-to-xtml',
		'../src/editing'
	], function (Xhtml, Editing) {
	
		module('editing');

		var Boundaries = aloha.boundaries;
		var Browsers = aloha.browsers;
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

		var t = function (title, before, after) {
			testMutation('editing.split ' + title, before, after, function (dom, start, end) {
				function below(node) {
					return node.nodeName === 'DIV';
				}
				return Editing.split(Boundaries.range(start, end), {below: below});
			});
		};

		t('split cac',
		  '<div><p><b>one</b>{<i>two</i><i>three</i>}<b>four</b></p></div>',
		  '<div><p><b>one</b></p>{<p><i>two</i><i>three</i></p>}<p><b>four</b></p></div>');

		t('split above incl cac 1',
		  '<div><p><em><b>one</b>{<i>two</i><i>three</i>}<b>four</b></em></p></div>',
		  '<div><p><em><b>one</b></em></p>{<p><em><i>two</i><i>three</i></em></p>}<p><em><b>four</b></em></p></div>');

		t('split above incl cac 2',
		  '<div><p>one<span class="cls">t[]wo</span></p></div>',
		  '<div><p>one<span class="cls">t</span></p>{}<p><span class="cls">wo</span></p></div>');

		t('split above and below cac 1',
		  '<div><p><em><b>one</b>{<i>two</i><i>three</i>}<b>four</b></em></p></div>',
		  '<div><p><em><b>one</b></em></p>{<p><em><i>two</i><i>three</i></em></p>}<p><em><b>four</b></em></p></div>');

		t('split above and below cac 2',
		  '<div><p><em><b>one</b><strong><u>-{<i>two</i></u><u><i>three</i>}-</u></strong><b>four</b></em></p></div>',
		  '<div><p><em><b>one</b><strong><u>-</u></strong></em></p>{<p><em><strong><u><i>two</i></u><u><i>three</i></u></strong></em></p>}<p><em><strong><u>-</u></strong><b>four</b></em></p></div>');

		t('split at start end doesn\'t leave empty nodes 1',
		  '<div><b>one{</b><i>two</i><b>}three</b></div>',
		  '<div><b>one</b>{<i>two</i>}<b>three</b></div>');

		t('split at start end doesn\'t leave empty nodes 2',
		  '<div><b>{one</b><i>two</i><b><em>three</em>}</b></div>',
		  '<div>{<b>one</b><i>two</i><b><em>three</em></b>}</div>');

		t('split collapsed range 1',
		  '<div><b><i>1</i><i>2{}</i><i>3</i></b></div>',
		  '<div><b><i>1</i><i>2</i></b>{}<b><i>3</i></b></div>');

		t('split collapsed range in empty element',
		  '<div><b><i>1</i><i>{}</i><i>3</i></b></div>',
		  '<div><b><i>1</i></b>{}<b><i></i><i>3</i></b></div>');

		t('trim/include the last br if it is the last child of the block',
		  '<div><h1>1{<br/></h1><p>2}<br/></p></div>',
		  '<div><h1>1<br/></h1>{<p>2<br/></p>}</div>');

		t('trim/include the last br if it is the last child of an inline element',
		  '<div><h1>1{<br/></h1><p><b>2}<br/></b></p></div>',
		  '<div><h1>1<br/></h1>{<p><b>2<br/></b></p>}</div>');

		// TODO This test doesn't work on IE because IE automatically strips some
		// spaces and not others. Could be made to work by stripping exactly those
		// whitespace from the expected result
		if (!Browsers.ie) {
			t('split ignores unrendered nodes 1',
			  '<div>  <span> {  </span> <span>text} </span><b> </b> </div>',
			  '<div>{  <span>   </span> <span>text </span><b> </b> }</div>');
		}

		t('split ignores unrendered nodes 2',
		  '<div><i><u><sub>{</sub></u>a</i>b<i>c<u><sub>}</sub></u></i></div>',
		  '<div>{<i><u><sub></sub></u>a</i>b<i>c<u><sub></sub></u></i>}</div>');

		t = function (title, before, after) {
			testMutation('editing.split+format - ' + title, before, after, function (dom, start, end) {
				var range = Boundaries.range(start, end);
				var cac = range.commonAncestorContainer;
				function until(node) {
					return node.nodeName === 'CODE';
				}
				function below(node) {
					return cac === node;
				}
				var boundaries = Editing.split(range, {below: below, until: until});
				return Editing.wrap('B', boundaries[0], boundaries[1]);
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
		  '<p>S<sub>o</sub>{<b><sub><em>m</em></sub>e <i>a<u>b</u></i></b>}<i><u>c</u></i></p>');

		t('don\'t split obstruction on the left; with element siblings on the right',
		  '<p><i><em>-</em><code>Some<em>-{-</em>text</code></i>-<i><em>-</em><em>-</em>}<em>-</em><em>-</em></i></p>',
		  '<p><i><em>-</em></i><i><code>Some<em>-{<b>-</b></em><b>text</b></code></i><b>-<i><em>-</em><em>-</em></i></b>}<i><em>-</em><em>-</em></i></p>');

	  });

}(window.aloha, window.require, window.module, window.test, window.equal, window.deepEqual));
