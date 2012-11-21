Aloha.require(['jquery', 'aloha/ephemera', 'dom-to-xhtml/dom-to-xhtml'], function ($, Ephemera, DomToXhtml) {
	'use strict';

	module('ephemeral')
	test('prune', function () {
		var input = $('<div data-xx="xx">'
					  + '<p class="someclass aloha-xxx aloha-xxx2">'
					  + '<div class="wrapper"><div class="aloha-xxx"><span class="filler">'
					  + 'some<div class="aloha-xxx"><b class="">text</b></div>text<i>some</i>'
					  + '</span></div></div>'
					  + '</p>'
					  + '<span class="attr" contenteditable="true">other<p class="ephemeral"><b class>te</b></p>xt</span>'
					  + '</div>')[0];
		var expected = $('<div>'
					  + '<p class="someclass">'
					  + '<div>'
					  + 'some<div><b class="">text</b></div>text<i>some</i>'
					  + '</div>'
					  + '</p>'
					  + '<span class="attr">otherxt</span>'
					  + '</div>')[0];
		// IE7, IE8 behave differently if the DOM is inside an editable
		$('#test-editable').aloha().append(input);
		// TODO using jquery-1.7.2's removeAttr method with a value of
		//      'contenteditable' will not remove the attribute but it
		//      will remove the value, which results in
		//      ...<span class="attr" contentediable>...
		//
		//      Aloha monkey patches jquery's removeAttr method to work
		//      around a browser crash. The monkey patched removeAttr
		//      will not work with a value of 'contenteditable', but it
		//      will work with a value of 'contentEditable'. Curiously,
		//      it will work even better, removing the entire attribute,
		//      which results in
		//      ...<span class="attr">...
		Ephemera.markAttr($(input).find('.attr')[0], 'contentEditable');
		Ephemera.markElement($(input).find('.ephemeral')[0]);
		Ephemera.markWrapper($(input).find('.wrapper')[0]);
		Ephemera.markFiller($(input).find('.filler')[0]);
		Ephemera.classes('aloha-xxx', 'aloha-xxx2');
		Ephemera.attributes('data-xx');
		var result = Ephemera.prune(input);
		equal(result.outerHTML, expected.outerHTML);
	});

	test('emap.attrMap and emap.attrRxs', function () {
		var input = $('<div><ul><li'
					  + ' nodeIndex23445="xx"'
					  + ' sizCache232="xx"'
					  + ' data-not-removed="not-removed"'
					  + ' sizSetabcd123="xx"'
					  + ' sizCache="xx"'
					  + ' tabIndex="">some text</li></ul>'
					  + '<table contentEditable="true"><tr><td>some</td><td>text</td></tr></table>'
					  + '<p hidefocus="true">'
					  + '<span hideFocus="true"></span>'
					  + '<span'
					  + ' nodeindexabcd123="xx"'
					  + ' sizcacher44=""'
					  + ' sizsetvok4t43="xx"'
					  + ' jqueryf9jr49="xdvd"'
					  // Interesting - if tabindex="x" the test fails on IE7 (only).
					  // I appears that tabIndex must be numeric.
					  + ' tabindex="99">some text</span>'
					  + '</p></div>')[0];

		// IE7, IE8 behave differently if the DOM is inside an editable
		$('#test-editable').aloha().append(input);

		var expected = $('<div><ul><li data-not-removed="not-removed">some text</li></ul>'
						 + '<table><tr><td>some</td><td>text</td></tr></table>'
						 + '<p><span></span><span>some text</span></p></div>')[0];

		var result = Ephemera.prune(input.cloneNode(true)).outerHTML;
		// IE7/8 refuse to remove the hideFocus field
		if ($.browser.msie && parseInt($.browser.version, 10) < 9) {
			result = result.replace(/\shideFocus/gi, '');
		}
		equal(result, expected.outerHTML);

		// Try to remove the hideFocus field again during serialization
		expected = DomToXhtml.nodeToXhtml(expected);
		result = DomToXhtml.nodeToXhtml(input, Ephemera.ephemera());
		equal(result, expected);
	});
});
