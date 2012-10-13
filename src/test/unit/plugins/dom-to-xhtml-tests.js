/* dom-to-xhtml-tests.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define(
	[],
function() {
	"use strict";

	/**
	 * Initializes an Aloha editable with the given HTML and passes it to the given callback function.
	 *
	 * @param func
	 *        A callback function that is invoked with an instance of Aloha.Editable as the first argument.
	 * @param editableHtml
	 *        Optionally the HTML to put into the editable before calling $.aloha() on it.
	 *        May be null if the editable should be left as is.
	 * @param id
	 *        Optionally the id of the editable. By default a div with id 'test-editable' will be used.
	 */
	function withEditable(func, editableHtml, id) {
		id = id || 'test-editable';
		var editable = jQuery("#" + id);
		if (null != editableHtml) {
			editable.html(editableHtml);
		}
		editable.aloha();
		var alohaEditable = Aloha.getEditableById(id)
		func(alohaEditable);
		alohaEditable.destroy();
	}

	/**
	 * Tests whether a DOM is serialized correctly.
	 *
	 * Tests the Aloha.Editable.getContents() instance method which is
	 * used to serialize the content of an editable. The dom-to-xhtml
	 * plugin sets a special XHTML content serializer which replaces the
	 * default $.html() serializer used by getContents().
	 *
	 * @param editableHtml
	 *        The HTML to put into the editable before calling getContents().
	 * @param expectedXhtml
	 *        The XHTML expected to be returned by Aloha.Editable.getContents().
	 *        This may be an array of strings, if the result may be one of multiple
	 *        possible values. If an array is passed, at least one of the values in the
	 *        array has to match the resulting XHTML to pass the test. This is useful
	 *        if the expected result may differ between browsers.
	 */
	function testGc(editableHtml, expectedXhtml) {
		withEditable(function(editable){
			var contents = editable.getContents();
			if (jQuery.isArray(expectedXhtml)) {
				var foundEqual = false;
				for (var i = 0; i < expectedXhtml.length; i++) {
					if (contents == expectedXhtml[i]) {
						foundEqual = true;
						break;
					}
				}
				if ( ! foundEqual ) {
					equal(contents, expectedXhtml[0]);
				} else {
					ok(true);
				}
			} else {
				equal(contents, expectedXhtml);
			}
		}, editableHtml);
	}

	/**
	 * Tests whether dynamically set styles are serialized correctly.
	 *
	 * @param styleMap
	 *        A map of styles to set dynamically. Values in the map
	 *        may be arrays, in which case the first value in the array will be used
	 *        to set the style dynamically, and the rest of the values represent
	 *        alternative results at least one of which must match the reparsed
	 *        style to pass the test.
	 * @param elementHtml
	 *        A HTML string representing an element to set the given styles on.
	 */
	function testStyle(styleMap, elementHtml) {
		withEditable(function(editable){
			var element = editable.obj.children().eq(0);
			var jqStyleMap = {};
			for (var style in styleMap) {
				if (styleMap.hasOwnProperty(style)) {
					var styleValue = styleMap[style];
					jqStyleMap[style] = $.isArray(styleValue) ? styleValue[0] : styleValue;
				}
			}
			element.css(jqStyleMap);
			var contents = editable.getContents();
			// After parsing the serialized XHTML, the styles that were
			// dynamically set should be still be there. If not, they were
			// lost during serialization.
			var reparsedElement = $(contents).eq(0);
			for (var style in styleMap) {
				if (styleMap.hasOwnProperty(style)) {
					var reparsedStyleValue = reparsedElement.css(style);
					var styleValue = styleMap[style];
					if ($.isArray(styleValue)) {
						var found = false;
						for (var i = 0; i < styleValue.length; i++) {
							if (reparsedStyleValue == styleValue[i]) {
								found = true;
							}
						}
						if ( ! found ) {
							equal(reparsedStyleValue, styleValue[0]);
						} else {
							ok(true);
						}
					} else {
						equal(reparsedStyleValue, styleValue);
					}
				}
			}
		}, elementHtml);
	}

	Aloha.ready( function() {
		module('Serialization');

		test('links', function() {
			testGc('<a href="http://www.example.com">link</a>',
				   ['<a href="http://www.example.com">link</a>',
					// IE7 adds a trailing slash to the href
					'<a href="http://www.example.com/">link</a>'
				   ]);
			testGc('<a href="http://www.example.com/?#anchor">link</a>', '<a href="http://www.example.com/?#anchor">link</a>');
			// TODO: IE7 fails because it makes a fully qualified URL out of the links. This issue
			// is documented for the nodeToXhtml() method.
			//testGc('<a href="relative/link">link</a>', '<a href="relative/link">link</a>');
			//testGc('<a href="/absolute/link">link</a>', '<a href="/absolute/link">link</a>');
		});
		test('empty elements without closing tag', function() {
			testGc('some <br>text', 'some <br/>text');
			testGc('some<img src="http://www.example.com/img.jpg">text', 'some<img src="http://www.example.com/img.jpg"/>text');
		});
		test('tables', function() {
			testGc('<table><tr><th>one<th>two<tr><td>three<td>four</table>', [
				'<table><tbody><tr><th>one</th><th>two</th></tr><tr><td>three</td><td>four</td></tr></tbody></table>',
				// IE adds spaces after text in each cell except the last one
				'<table><tbody><tr><th>one </th><th>two </th></tr><tr><td>three </td><td>four</td></tr></tbody></table>'
			]);
		});
		test('lists', function() {
			testGc('<ul><li><ol><li>one<li>two</ol></ul>', [
				'<ul><li><ol><li>one</li><li>two</li></ol></li></ul>',
				// IE adds a space after the text in the first list item
				'<ul><li><ol><li>one </li><li>two</li></ol></li></ul>'
			]);
		});
		test('empty elements with closing tag', function() {
			testGc('some<span></span>text', 'some<span></span>text');
			testGc('some<div></div>text', [
				'some<div></div>text',
				// IE adds a space before a div (IE8)
				'some <div></div>text'
			]);
		});
		test('boolean attributes', function() {
			testGc('<input type="checkbox" checked>',
				   [ '<input type="checkbox" checked="checked"/>',
					 // different order than the previous
					 '<input checked="checked" type="checkbox"/>',
					 // IE8 adds the value="on" even though it's not specified
				     '<input type="checkbox" checked="checked" value="on"/>',
					 // the following two are just differently ordered than the last
					 '<input value="on" checked="checked" type="checkbox"/>',
					 '<input type="checkbox" value="on" checked="checked"/>']);
			testGc('<button disabled>',
				   [ '<button disabled="disabled"></button>',
					 // IE8 adds the type="submit" even though it's not specified
				     '<button disabled="disabled" type="submit"></button>' ]);
		});
		test('"pre" preserves spaces tabs and newlines', function() {
			var pre = "<pre>\n"
				+ "		two leading tabs\n"
				+ "        leading whitespace\n"
				+ "</pre>";
			withEditable(function(editable) {
				// On IE8, \n characters become \r characters
				equal(editable.getContents().replace(/\n/g, '\r'),
					   // The newline after the opening pre tag is lost.
					   // This is the same behaviour as with element.innerHTML.
					  ("<pre>		two leading tabs\n"
					   + "        leading whitespace\n"
					   + "</pre>").replace(/\n/g, '\r'));
			}, pre);
			var whiteSpacePre
				= '<span style="white-space: pre">\n'
				+ "		two leading tabs\n"
				+ "        leading whitespace\n"
				+ "</span>";
			withEditable(function(editable) {
				// Serializing a span with "white-space: pre" style on IE8 is unpredictable:
				// the whitespace will most of the time not be preserved, but it sometimes will (loading
				// the same page multiple times yields different results).
				// TODO: This test is disabled. The issue is documented for the nodeToXhtml() method.
				//equal(editable.getContents().replace(/\s/g, ' . '), whiteSpacePre.replace(/\s/g, ' . '));
			}, whiteSpacePre);
		});
		test('special characters in attributes', function() {
			testGc('<img src="http://www.example.com/?one=two&three&&amp;four">',
				   '<img src="http://www.example.com/?one=two&amp;three&amp;&amp;four"/>');
			testGc('<img alt="left << middle >> right">',
				   '<img alt="left &lt;&lt; middle >> right"/>');
			testGc("<img alt='some \"quoted\" text'>",
				   '<img alt="some &quot;quoted&quot; text"/>');
		});
		test('special characters in intra-element text', function() {
			testGc('<span>big < bigger < biggest</span>', '<span>big &lt; bigger &lt; biggest</span>');
			testGc('<span>You&Me&You</span>', '<span>You&amp;Me&amp;You</span>');
		});
		test('script tags', function() {
			// Script tags are not preserved (Chrome).
			// This is the same behaviour as with element.innerHTML (Chrome).
			testGc('<div>pre-script<script> if (1 < 2 && true) { } else { } </script>post-script</div>',
				   '<div>pre-scriptpost-script</div>');
		});
		test('IE conditional includes', function() {
			var conditionalInclude = '<div><!--[if IE 8 ]> <span> some text </span> <![endif]--></div>';
			// IE8 doesn't report conditional comments in contentEditable=true
			// TODO: This test is disabled. The issue is documented for the nodeToXhtml() method.
			//testGc(conditionalInclude, conditionalInclude);
		});
		test('normal comments', function() {
			// IE8 doesn't always report comments inside
			// contentEditable=true correctly. In this example the 'x'
			// before the comment is necessary, otherwise the comment
			// will not appear in the DOM.
			var comment = '<span>x<!-- some comment --></span>';
			testGc(comment, comment);
		});
		test('serializing dynamically set css attributes', function() {
			testStyle({
				// some random css properties
				'color': [ 'green', 'rgb(0, 128, 0)' ],
				'width': '5px'
			}, '<div></div>');
		});
		test('namespaced XML', function() {
			var namespacedXml
				= '<div xmlns:books="urn:loc.gov:books">'
				+ '<books:book xmlns:isbn="urn:ISBN:0-395-36341-6">'
				+ '<isbn:number>1568491379</isbn:number>'
				+ '<books:notes>'
			    // IE8 inserts a space before the p if it's not already there
				+ ' <p xmlns="http://www.w3.org/1999/xhtml">'
				+ 'This is also available <a href="http://www.w3.org/">online</a>.'
				+ '</p>'
				+ '</books:notes>'
				+ '</books:book>'
				+ '</div>';
			testGc(namespacedXml, namespacedXml);
		});
		test('IE unrecognized XML', function() {
			// The x at the beginning is required. If there is some text
			// before unrecognized elements, the DOM structure will
			// incorrect but still predictable. If there is no text
			// before unrecognized elements, the DOM structure will
			// become unpredictable in a way we can't compensate for.
			var unrecognizedXml
				= 'x<ie-unrecognized-1 some-attr="some-value">'
				+ '<ie-unrecognized-2>'
				+ '<ie-unrecognized-3>'
				+ '<span>some text</span>'
				+ '</ie-unrecognized-3>'
				+ '<ie-unrecognized-4>'
				+ 'more text'
				+ ' <span>even more text</span>'
				+ '<!-- comment -->'
				+ '</ie-unrecognized-4>'
				+ '</ie-unrecognized-2>'
				+ '<ie-unrecognized-5>'
				+ '<span> one more text</span>'
				+ '</ie-unrecognized-5>'
				+ '</ie-unrecognized-1>';
			testGc(unrecognizedXml, unrecognizedXml);
		});
		test('classes and styles', function() {
			testGc('<P class="article">', '<p class="article"></p>');
			testGc('<BR class="aloha-end-br">', '<br class="aloha-end-br"/>');
			testGc('<P style="color:red">', ['<p style="color:red"></p>', '<p style="color: red"></p>']);
			testGc('<BR style="color:red">', ['<br style="color:red"/>', '<br style="color: red"/>']);
		});
	});
});
