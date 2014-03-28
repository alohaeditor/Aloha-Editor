(function (aloha) {
	'use strict';

	module('editing');

	var Html = aloha.html;
	var Xhtml = aloha.xhtml;
	var Ranges = aloha.ranges;
	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;

	function switchElemTextSelection(html) {
		return html.replace(/[\{\}\[\]]/g, function (match) {
			return {'{': '[',
			        '}': ']',
			        '[': '{',
			        ']': '}'}[match];
		});
	}

	function testMutation(before, expected, mutate) {
		$('#test-editable').empty().html(before);
		var dom = $('#test-editable')[0].firstChild;
		var boundaries = BoundaryMarkers.extract(dom);
		var range = Ranges.fromBoundaries(boundaries[0], boundaries[1]);
		dom = mutate(dom, range) || dom;
		boundaries = Boundaries.fromRange(range);
		BoundaryMarkers.insert(boundaries[0], boundaries[1]);
		var actual = Xhtml.nodeToXhtml(dom);
		if ($.type(expected) === 'function') {
			expected(actual);
		} else {
			equal(actual, expected, before + ' ⇒ ' + expected);
		}
	}

	function testMutationSwitchElemTextSelection(before, after, mutate) {
		testMutation(before, after, mutate);
		var afterSwitched = switchElemTextSelection(after);
		testMutation(switchElemTextSelection(before), function (actual) {
			if (actual === afterSwitched
					// Because it's ok as long as they come out at the same
					// position, we ignore differences between selection type
					// (text or element boundaries)
				    || actual === after
					// Because we must account for end of text node
					// normalization performed by dom.nodeAtOffset() and
					// dom.isAtEnd()
				    || actual === afterSwitched.replace(/\]/g, '}')
			) {
				if (actual !== afterSwitched) {
					equal(actual, afterSwitched, before + ' ⇒ ' + afterSwitched);
				} else if (actual !== afterSwitched.replace(/\]/g, '}')) {
					equal(
						actual,
						afterSwitched.replace(/\]/g, '}'),
						before + ' ⇒ ' + afterSwitched.replace(/\]/g, '}')
					);
				} else if (actual !== after) {
					equal(actual, after, before + ' ⇒ ' + after);
				}
			}
		}, mutate);
	}

	test('ranges.trim()', function () {
		(function t(before, after) {
			testMutationSwitchElemTextSelection(
				before,
				after,
				function (dom, range) {
					Ranges.trimClosingOpening(
						range,
						Html.isUnrenderedWhitespace,
						Html.isUnrenderedWhitespace
					);
				}
			);
			return t;
		})
		('<p>{}</p>', '<p>{}</p>')
		('<p>So[]xt.</p>', '<p>So[]xt.</p>')
		('<p>So[me te]xt.</p>', '<p>So[me te]xt.</p>')
		('<p>{Some text.}</p>', '<p>{Some text.}</p>')
		('<p>{}Some text.</p>', '<p>{}Some text.</p>')
		('<p>Some text.{}</p>', '<p>Some text.{}</p>')
		('<p><b>{</b><i>}</i></p>', '<p><b></b>{}<i></i></p>')
		(
			'<p><b>So[me</b><i> </i><b>te]xt.</b></p>',
			'<p><b>So[me</b><i> </i><b>te]xt.</b></p>'
		)(
			'<p><b>Some</b>{<i> </i>}<b>text.</b></p>',
			'<p><b>Some</b>{<i> </i>}<b>text.</b></p>'
		)(
			'<p><b>[Some</b><i> </i><b>text.]</b></p>',
			'<p><b>{Some</b><i> </i><b>text.}</b></p>'
		)(
			'<p><b><i>{</i></b><i><b>}</b></i></p>',
			'<p><b><i></i></b>{}<i><b></b></i></p>'
		)(
			'<p><b><i>one{</i></b><i>two</i><b><i>}three</i></b></p>',
			'<p><b><i>one</i></b>{<i>two</i>}<b><i>three</i></b></p>'
		)(
			'<p><b><i>one{</i>.</b><i>two</i><b>.<i>}three</i></b></p>',
			'<p><b><i>one</i>{.</b><i>two</i><b>.}<i>three</i></b></p>'
		)(
			'<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>',
			'<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>'
		);
	});

}(window.aloha));
