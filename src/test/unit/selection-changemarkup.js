/* selection-changemarkup.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2026 Gentics Software GmbH, Vienna, Austria.
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
/**
 * Tests for Selection.changeMarkup() with a replacing element (p -> h1),
 * when the selection context after applying the markup is incomplete
 * (start or end container missing).
 */
define(['testutils'], function (TestUtils) {
	'use strict';

	Aloha.ready(function () {
		var Selection = Aloha.Selection;

		module('changeMarkup with incomplete selection context', {
			setup: function () {
				this.edit = Aloha.jQuery('#edit');
				this.edit.html('<p>foo</p><h1><span class="preparedForRemoval">bar</span></h1>');
				this.edit.aloha();
				this.originalApplyMarkup = Selection.applyMarkup;
			},
			teardown: function () {
				Selection.applyMarkup = this.originalApplyMarkup;
				this.edit.mahalo();
				this.edit.empty();
			}
		});

		/**
		 * Call changeMarkup(p -> h1) on the text of the paragraph, while applyMarkup
		 * is replaced by the given function, which may break the range context.
		 * @return the thrown error or null
		 */
		function changeToH1(edit, manipulateRange) {
			var text = edit.find('p').contents().get(0);
			var range = TestUtils.generateRange(text, 0, text, 3);
			var original = Selection.applyMarkup;
			Selection.applyMarkup = function (selectionTree, rangeObject, markup, tagComparator, options) {
				original.apply(Selection, arguments);
				manipulateRange(rangeObject);
			};
			try {
				Selection.changeMarkup(range, Aloha.jQuery('<h1></h1>'));
				return { range: range, error: null };
			} catch (e) {
				return { range: range, error: e };
			}
		}

		test('Missing endContainer does not crash', function () {
			var result = changeToH1(this.edit, function (rangeObject) {
				rangeObject.endContainer = null;
			});
			equal(result.error && String(result.error), null, 'changeMarkup must not throw');
		});

		test('Zapped endContainer is moved to its markup parent, when startContainer is missing', function () {
			var zappedEnd = this.edit.find('.preparedForRemoval').get(0);
			var h1 = this.edit.find('h1').get(0);
			var result = changeToH1(this.edit, function (rangeObject) {
				rangeObject.startContainer = null;
				rangeObject.endContainer = zappedEnd;
				rangeObject.endOffset = 0;
			});
			equal(result.error && String(result.error), null, 'changeMarkup must not throw');
			ok(result.range.endContainer === h1, 'endContainer must be the parent <h1> of the removed element');
		});
	});
});
