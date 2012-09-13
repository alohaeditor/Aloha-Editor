Aloha.require(['jquery', 'aloha/ephemera'], function ($, Ephemera) {
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
		Ephemera.markAttribute($(input).find('.attr')[0], 'contentEditable');
		Ephemera.markElement($(input).find('.ephemeral')[0]);
		Ephemera.markWrapper($(input).find('.wrapper')[0]);
		Ephemera.markFiller($(input).find('.filler')[0]);
		Ephemera.classes('aloha-xxx', 'aloha-xxx2');
		Ephemera.attributes('data-xx');
		var result = Ephemera.prune(input);
		equal(result.outerHTML, expected.outerHTML);
	});

	test('internal emap values', function () {
		var input = $('<div><ul><li'
					  + ' nodeIndex23445="xx"'
					  + ' sizCache232="xx"'
					  + ' data-not-removed="not-removed"'
					  + ' sizSetabcd123="xx"'
					  + ' sizCache="xx"'
					  + ' tabIndex="">some text</li></ul>'
					  + '<p hidefocus="xx">'
					  + '<span hideFocus="xx"></span>'
					  + '<span'
					  + ' nodeindexabcd123="xx"'
					  + ' sizcacher44=""'
					  + ' sizsetvok4t43="xx"'
					  + ' jqueryf9jr49="xdvd"'
					  // Interesting - if tabindex="x" the test fails on IE7 (only).
					  // I appears that tabIndex must be numeric.
					  + ' tabindex="99">some text</span>'
					  + '</p></div>')[0];
		$('#test-editable').aloha().append(input);
		var expected = $('<div><ul><li data-not-removed="not-removed">some text</li></ul>'
						 + '<p><span></span><span>some text</span></p></div>')[0];
		var result = Ephemera.prune(input);
		equal(result.outerHTML, expected.outerHTML);
	});
});
