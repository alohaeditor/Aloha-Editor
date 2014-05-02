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

	function rawBoundariesFromRange(range) {
		return [
			Boundaries.raw(range.startContainer, range.startOffset),
			Boundaries.raw(range.endContainer, range.endOffset)
		];
	}

	function testMutation(before, expected, mutate) {
		$('#test-editable').html(before);
		var dom = $('#test-editable')[0].firstChild;
		var boundaries = BoundaryMarkers.extract(dom);
		var range = Ranges.fromBoundaries(boundaries[0], boundaries[1]);
		dom = mutate(dom, range) || dom;
		boundaries = rawBoundariesFromRange(range);
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
		var beforeSwitched = switchElemTextSelection(before);
		testMutation(beforeSwitched, function (actual) {
			// Because it's ok for the boundary marker types to differ as long
			// as they come out at the same position, we ignore differences
			// between selection type (text or element boundaries)
			var control = actual === after
			            ? after
			            : actual === before
			            ? before
			            : afterSwitched;
			equal(actual, control, actual + ' ⇒ ' + afterSwitched);
		}, mutate);
	}

	test('ranges.trim()', function () {
		(function t() {
			Array.prototype.forEach.call(arguments, function (unit) {
				testMutationSwitchElemTextSelection(
					unit[0], // input
					unit[1], // expected
					function (dom, range) {
						Ranges.trimClosingOpening(
							range,
							Html.isUnrenderedWhitespace,
							Html.isUnrenderedWhitespace
						);
					}
				);
			});
			return t;
		})(
			['<p>{}</p>',               '<p>{}</p>'],
			['<p>So[]xt.</p>',          '<p>So[]xt.</p>'],
			['<p>So[me te]xt.</p>',     '<p>So[me te]xt.</p>'],
			['<p>{Some text.}</p>',     '<p>{Some text.}</p>'],
			['<p>{}Some text.</p>',     '<p>{}Some text.</p>'],
			['<p>Some text.{}</p>',     '<p>Some text.{}</p>'],
			['<p><b>{</b><i>}</i></p>', '<p><b></b>{}<i></i></p>'], [
				'<p><b>So[me</b><i> </i><b>te]xt.</b></p>',
				'<p><b>So[me</b><i> </i><b>te]xt.</b></p>'
			], [
				'<p><b>Some</b>{<i> </i>}<b>text.</b></p>',
				'<p><b>Some</b>{<i> </i>}<b>text.</b></p>'
			], [
				'<p><b>[Some</b><i> </i><b>text.]</b></p>',
				'<p><b>[Some</b><i> </i><b>text.]</b></p>'
			], [
				'<p><b><i>{</i></b><i><b>}</b></i></p>',
				'<p><b><i></i></b>{}<i><b></b></i></p>'
			], [
				'<p><b><i>one{</i></b><i>two</i><b><i>}three</i></b></p>',
				'<p><b><i>one</i></b>{<i>two</i>}<b><i>three</i></b></p>'
			], [
				'<p><b><i>one{</i>.</b><i>two</i><b>.<i>}three</i></b></p>',
				'<p><b><i>one</i>{.</b><i>two</i><b>.}<i>three</i></b></p>'
			], [
				'<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>',
				'<p><b><i>{one</i></b><i>two</i><b><i>three}</i></b></p>'
			]
		);
	});

}(window.aloha));
