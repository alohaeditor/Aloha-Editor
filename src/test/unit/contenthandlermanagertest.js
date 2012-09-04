/* contenthandlermanagertest.js is part of Aloha Editor project http://aloha-editor.org
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
/*global define: true, Aloha: true, asyncTest: true, window: true, ok: true, start: true, test: true, equal: true, deepEqual: true */
define(
['testutils'],
function (TestUtils) {
	"use strict";

	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function () {
		var timeout = window.setTimeout(function () {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		Aloha.ready(function () {
			window.clearTimeout(timeout);
			ok(true, 'Aloha Event was fired');
			start();
		});
	});

	// All other tests are done when Aloha is ready
	Aloha.ready(function () {
		Aloha.require(['aloha/contenthandlermanager'],
				function (ContentHandlerManager) {
			// first unregister all contenthandlers, that were registered by aloha editor
			var id, ids = ContentHandlerManager.getIds();
			for (id in ids) {
				if (ids.hasOwnProperty(id)) {
					ContentHandlerManager.unregister(ids[id]);
				}
			}
			ContentHandlerManager.register('one',
				ContentHandlerManager.createHandler({
					handleContent: function (content) {
						return content + ',one';
					}
				}));
			ContentHandlerManager.register('two',
				ContentHandlerManager.createHandler({
					handleContent: function (content) {
						return content + ',two';
					}
				}));
			ContentHandlerManager.register('three',
				ContentHandlerManager.createHandler({
					handleContent: function (content) {
						return content + ',three';
					}
				}));
			ContentHandlerManager.register('four',
				ContentHandlerManager.createHandler({
					handleContent: function (content) {
						return content + ',four';
					}
				}));
			test('Test ContentHandlerManager.get', function () {
				ok(ContentHandlerManager.get('one'), 'Found contenthandler "one"');
				ok(ContentHandlerManager.get('two'), 'Found contenthandler "two"');
				ok(ContentHandlerManager.get('three'), 'Found contenthandler "three"');
				ok(ContentHandlerManager.get('four'), 'Found contenthandler "four"');
				equal(ContentHandlerManager.get('five'), undefined, 'Not found non-existent contenthandler "five"');
			});
			test('Test ContentHandlerManager.has', function () {
				equal(ContentHandlerManager.has('one'), true, 'Found contenthandler "one"');
				equal(ContentHandlerManager.has('two'), true, 'Found contenthandler "two"');
				equal(ContentHandlerManager.has('three'), true, 'Found contenthandler "three"');
				equal(ContentHandlerManager.has('four'), true, 'Found contenthandler "four"');
				equal(ContentHandlerManager.has('five'), false, 'Not found non-existent contenthandler "five"');
			});
			test('Test ContentHandlerManager.getEntries', function () {
				var entries = ContentHandlerManager.getEntries();
				ok(entries.one, 'Found contenthandler "one"');
				ok(entries.two, 'Found contenthandler "two"');
				ok(entries.three, 'Found contenthandler "three"');
				ok(entries.four, 'Found contenthandler "four"');
				equal(entries.five, undefined, 'Not found non-existent contenthandler "five"');
			});
			test('Test ContentHandlerManager.getIds', function () {
				deepEqual(ContentHandlerManager.getIds(), ['one', 'two', 'three', 'four'], 'Array of registered ids in correct order');
			});
			test('Test handling content with all handlers', function () {
				var content = 'content';
				var handledContent = ContentHandlerManager.handleContent(content, {});
				equal(handledContent, 'content,one,two,three,four', 'Test handled content');
			});
			var i, perm, perms = TestUtils.permutations(['one', 'two', 'three', 'four']);
			for (i in perms) {
				if (perms.hasOwnProperty(i)) {
					perm = perms[i];
					(function (perm) {
						test('Test handling contenthandlers ' + perm.join(','), function () {
							var content = 'content';
							var expectedContent = content + ',' + perm.join(',');
							var handledContent = ContentHandlerManager.handleContent(content, {contenthandler: perm});
							equal(handledContent, expectedContent, 'Test handled content');
						});
					})(perm);
				}
			}
		});
	});
});