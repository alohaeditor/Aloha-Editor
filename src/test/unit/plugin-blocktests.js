/* plugin-blocktests.js is part of Aloha Editor project http://aloha-editor.org
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
/**
 * TODOs:
 * - selectRow/selectColumn should take into account the helper row/column.
 *   ie: selectRow(0) and selectColumn(0), should be zero indexed
 */

define(
[ 'testutils', 'htmlbeautifier' ],
function( TestUtils) {
	'use strict';

	Aloha.ready(function() {

		var jQuery = Aloha.jQuery,
		    testContainer = jQuery( '#block-outer-container' ),
			testcase,
			BlockManager;

		var tests = [
			{
				always: true,
				async: true,
				desc: 'Aloha Dependency Loader',
				assertions: 1,
				operation: function() {
					var timeout = setTimeout(function() {
						ok(false, 'Aloha was not initialized within 10 seconds. Aborting!');
						start();
					}, 10000);
					// All other tests are done when Aloha is ready
					Aloha.require( ['block/blockmanager'],
							function ( AlohaBlockManager ) {
						BlockManager = AlohaBlockManager;
						clearTimeout(timeout);
						ok(true, 'Alohoha Dependencies were loaded');
						start();
					});
				}
			},

			{module : 'Initialization'},
			///////////////////////////////////////////////////////////////////////

			{
				desc      : 'A default block is initialized correctly',
				start     : '<div id="myDefaultBlock">Some default block content</div>',
				assertions: 8,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var $block = jQuery('.aloha-block', testContainer);

					// Block Wrapper assertions
					strictEqual($block.attr('contenteditable'), 'false', 'The block div is contenteditable=false.');
					ok($block.hasClass('aloha-block'), 'The block div has the aloha-block CSS class.');
					ok($block.hasClass('aloha-block-DefaultBlock'), 'The block div has the aloha-block-DefaultBlock CSS class.');
					strictEqual($block.attr('data-aloha-block-type'), 'DefaultBlock', 'The block div wrapper has the data-aloha-block-type set correctly.');
					equal($block.attr('data-block-type'), undefined, 'The block div wrapper does not have data-block-type set, as it shall not be used anymore by the framework.');

					// content wrapper assertions
					ok($block.is('#myDefaultBlock'), 'The given ID is re-used.');
					ok($block.find('.aloha-block-handle'), 'The handles are added.');
					ok($block.html().match(/Some default block content/), 'The block content is still there.');
				}
			},

			{
				desc      : 'Data attributes from inside the element are available through the attr() notation',
				start     : '<div id="myDefaultBlock" data-foo="Bar" data-somePropertyWithUppercase="test2">Some default block content2</div>',
				assertions: 2,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					strictEqual(block.attr('foo'), 'Bar');
					strictEqual(block.attr('somepropertywithuppercase'), 'test2', 'Uppercase properties need to be converted to lowercase.');
				}
			},
			{
				desc      : 'Attributes passed to .alohaBlock() are preserved. The data-attributes take precedence, however',
				start     : '<div id="myDefaultBlock" data-baz="original">Some default block content2</div>',
				assertions: 2,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock',
						'foo': 'someBar',
						'baz': 'Override'
					});
					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					strictEqual(block.attr('foo'), 'someBar');
					strictEqual(block.attr('baz'), 'original');
				}
			},

			{
				exclude: true, // TODO: FIX LATER
				desc      : 'Inline JavaScript is only executed once, and not executed while blockifying an element',
				setup     : function(testContainer) {
					window.thisTestExecutionCount = 0;
					testContainer[0].innerHTML = '<div id="myDefaultBlock">Some default block contesnt<script type="text/javascript">window.thisTestExecutionCount++;</script></div>';
				},
				assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					strictEqual(window.thisTestExecutionCount, 0);
					delete window.thisTestExecutionCount;
				}
			},
			{
				desc      : 'Attached event handlers are not removed',
				start     : '<div id="myDefaultBlock" data-foo="Bar" data-somePropertyWithUppercase="test2">Some default block content2</div>',
				assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').click(function() {
						ok(true);
					})
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					jQuery('#myDefaultBlock').click();
				}
			},
			{
				desc      : 'Trying to create a block from an element which is no div or span throws error',
				start     : '<img id="myDefaultBlock" />',
				assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					strictEqual(jQuery('.aloha-block', testContainer).length, 0, 'Image object has been blockified, although this should not happen.');
				}
			},

			{module : 'Block API'},
			///////////////////////////////////////////////////////////////////////
			{
				exclude   : false,
				desc      : 'fetching attr() with uppercase key is the same as with lowercase key',
				start     : '<div id="myDefaultBlock" data-foo="Bar">Some default block content</div>',
				//assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));

					strictEqual(block.attr('foo'), 'Bar');
					strictEqual(block.attr('FoO'), 'Bar');
				}
			},

			{
				exclude   : false,
				desc      : 'setting attr() with uppercase key is the same as with lowercase key',
				start     : '<div id="myDefaultBlock" data-foo="Bar">Some default block content</div>',
				assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					block.attr('test', 'mytest1');
					block.attr('TeSt', 'mytest2');

					strictEqual(block.attr('test'), 'mytest2');
				}
			},

			{
				exclude   : false,
				desc      : 'setting a key with attr() which starts with "aloha-block-" throws an error and does not save the key',
				start     : '<div id="myDefaultBlock" data-foo="Bar">Some default block content</div>',
				assertions: 2,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					block.attr('aloha-block-test1', 'foo');
					strictEqual(block.attr('aloha-block-test1'), undefined);

					block.attr('aloha-block-type', 'foo');
					strictEqual(block.attr('aloha-block-type'), 'DefaultBlock');
				}
			},

			{
				exclude   : false,
				desc      : 'Selection handling works with non-nested blocks',
				start     : '<div id="block1">Some default block content</div> <div id="block2">Some default block content</div>',
				assertions: 8,
				operation : function(testContainer, testcase) {
					jQuery('#block1').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					jQuery('#block2').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					var block1 = BlockManager.getBlock(jQuery('#block1', testContainer));
					var block2 = BlockManager.getBlock(jQuery('#block2', testContainer));

					ok(!block1.isActive(), 'block 1 is not active');
					ok(!block2.isActive(), 'block 2 is not active');

					block1.activate();
					ok(true, '--> activated block1');

					ok(block1.isActive(), 'block 1 is active after activating it');
					ok(!block2.isActive(), 'block 2 is not active after activating block1');

					block2.activate();
					ok(true, '--> activated block2');

					ok(!block1.isActive(), 'block1 has been deactivated after activating block2');
					ok(block2.isActive(), 'block 2 is active after activating it');
				}
			},

			{module : 'BlockManager API'},
			///////////////////////////////////////////////////////////////////////

			{
				exclude   : false,
				desc      : 'getBlock returns block when passed the block ID, the inner or outer DOM element',
				start     : '<div id="myDefaultBlock">Some default block content</div>',
				assertions: 3,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					var block1 = BlockManager.getBlock(jQuery('.aloha-block', testContainer).attr('id'));
					var block2 = BlockManager.getBlock(jQuery('.aloha-block', testContainer));
					var block3 = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					// Check that the returned objects are always the same
					ok(block1 === block2);
					ok(block2 === block3);
					strictEqual(typeof block1, 'object', 'Blocks were no objects');
				}
			},
			{
				exclude   : false,
				desc      : 'getBlock returns undefined when passed a wrong ID',
				start     : '<div id="myDefaultBlock">Some default block content</div>',
				assertions: 1,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					strictEqual(undefined, BlockManager.getBlock('someUndefinedId'));
				}
			},

			{module : 'Drag/Drop helpers'},
			///////////////////////////////////////////////////////////////////////
			{
				exclude   : false,
				desc      : 'DragDrop handlers',
				start     : '<div id="myDefaultBlock">Some default block content</div>',
				assertions: 7,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					var block = BlockManager.getBlock(jQuery('#myDefaultBlock', testContainer));
					deepEqual(block._dd_splitText('Hello world'), ['Hello', ' world']);
					deepEqual(block._dd_splitText('Hello world '), ['Hello', ' world ']);
					deepEqual(block._dd_splitText(' Hello world'), [' Hello', ' world']);
					deepEqual(block._dd_splitText(' Hello, world'), [' Hello', ', ', 'world']);
					deepEqual(block._dd_splitText(' Hello, world!'), [' Hello', ', ', 'world', '!']);
					deepEqual(block._dd_splitText(' Hello, world...'), [' Hello', ', ', 'world', '...']);
					deepEqual(block._dd_splitText(' Hello, world ...'), [' Hello', ', ', 'world', ' ...']);
				}
			},

			{module : 'Copy/Paste'},
			///////////////////////////////////////////////////////////////////////

			{
				exclude   : false,
				desc      : 'Copy/Paste Setup',
				start     : '<div class="alohaContent"><p><b>Some</b> text before<span id="myDefaultBlock" data-foo="Bar" data-something="Bar">Please click me and press <b>ctrl/cmd+c</b></span>Some text after</p><p class="pasteTarget"><b>Please place the</b> cursor HERE &gt;&lt; and press cmd/crtl v</p><p><b>Some</b> more text</p></div>',
				async     : true,
				operation : function(testContainer, testcase) {

					jQuery('.alohaContent').aloha();

					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					var testTimeout = window.setTimeout(function() {
						test('Copy/Paste tests not run', function() {
							ok(false, 'Manual copy/paste tests were not run');
						});
						start();
					}, 10000);
					var keyDownListener;
					keyDownListener = function(e) {
						if (e.which === 86) { // v pressed (ctrl-v)
							// We wait a little to make sure the new block has been created correctly
							window.setTimeout(function() {
								window.clearTimeout(testTimeout);
								var testResults = [
									{
										actual: (function() {
											var numberOfIdsFound = 0;
											jQuery('span', testContainer).each(function() {
												if (jQuery(this).is('#myDefaultBlock')) {
													numberOfIdsFound++;
												}
											});
											return numberOfIdsFound;
										})(),
										expected: 1,
										message: 'the old ID should not be inside the DOM multiple after pasting'
									},
									{
										 // We use lower case here because IE uses uppercase tags... argh!!
										actual: jQuery('.aloha-block', testContainer)[0].innerHTML.toLowerCase(),
										expected: '<span class="aloha-block-handle aloha-block-draghandle"></span>Please click me and press <b>ctrl/cmd+c</b>'.toLowerCase(),
										message: 'The block markup is as expected'
									},
									{
										actual: jQuery('br', testContainer).length,
										expected: 0,
										message: 'The content should not have any superfluous <br> tags inserted'
									},
								];

								test('Copy/Paste works with inline blocks', function() {
									jQuery.each(testResults, function() {
										strictEqual(this.actual, this.expected, this.message);
									});
								})
								start();
							}, 400);
							jQuery(document).unbind('keydown', keyDownListener);
						}
					};
					jQuery(document).keydown(keyDownListener);
				}
			},

			{module : 'Cut/Paste'},
			///////////////////////////////////////////////////////////////////////

			{
				exclude   : false,
				desc      : 'Cut/Paste Setup',
				start     : '<div class="alohaContent"><p class="src"><b>Some</b> text before<span id="myDefaultBlock" data-foo="Bar" data-something="Bar">Please click me and press<b>ctrl/cmd+x (CUT)</b></span>Some text after</p><p class="pasteTarget"><b>Please place the</b> cursor HERE &gt;&lt; and press cmd/crtl v</p><p><b>Some</b> more text</p></div>',
				async     : true,
				operation : function(testContainer, testcase) {

					jQuery('.alohaContent').aloha();

					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});

					var testTimeout = window.setTimeout(function() {
						test('Cut/Paste tests not run', function() {
							ok(false, 'Manual cut/paste tests were not run');
						});
						start();
					}, 10000);
					var keyDownListener;
					keyDownListener = function(e) {
						if (e.which === 86) { // v pressed (ctrl-v)
							// We wait a little to make sure the new block has been created correctly
							window.setTimeout(function() {
								window.clearTimeout(testTimeout);
								var testResults = [
									{
										actual: (function() {
											var numberOfIdsFound = 0;
											jQuery('span', testContainer).each(function() {
												if (jQuery(this).is('#myDefaultBlock')) {
													numberOfIdsFound++;
												}
											});
											return numberOfIdsFound;
										})(),
										expected: 0,
										message: 'the old ID should not be inside the DOM anymore after cutting'
									},
									{
										 // We use lower case here because IE8 and lower uses uppercase tags... argh!!
										actual: jQuery('.aloha-block', testContainer)[0].innerHTML.toLowerCase(),
										expected: '<span class="aloha-block-handle aloha-block-draghandle"></span>Please click me and press<b>ctrl/cmd+x (CUT)</b>'.toLowerCase(),
										message: 'The block markup is as expected'
									},
									{
										actual: jQuery('br', testContainer).length,
										expected: 0,
										message: 'The content should not have any superfluous <br> tags inserted'
									},
									// We use lower case here because IE8 and lower uses uppercase tags... argh!!
									{
										actual: jQuery('p.src', testContainer).html().toLowerCase(),
										expected: '<b>Some</b> text beforeSome text after'.toLowerCase(),
										message: 'The element should be removed from the source'
									},
								];

								test('Cut/Paste works with inline blocks', function() {
									jQuery.each(testResults, function() {
										strictEqual(this.actual, this.expected, this.message);
									});
								})
								// TODO: make sure the old stuff is removed
								start();
							}, 400);
							jQuery(document).unbind('keydown', keyDownListener);
						}
					};
					jQuery(document).keydown(keyDownListener);
				}
			},
			{exclude : true} // ... just catch trailing commas
		];

		var runOnlyTestId = null;
		for(var i=0; i<tests.length; i++) {
			if (tests[i].only === true) {
				runOnlyTestId = i;
			}
		}

		jQuery.each(tests, function(i, testcase) {
			if (runOnlyTestId !== null && runOnlyTestId !== i && !testcase.always) return;
			if (testcase.exclude === true) {
				return;
			}

			if (testcase.module) {
				module( testcase.module.toUpperCase() + ' :' );
				return;
			}

			test(
				(testcase.desc || 'Test').toUpperCase(),
				testcase.assertions,
				function() {
					if (testcase.setup) {
						testcase.setup(testContainer);
					} else {
						testContainer.html(testcase.start);
					}

					if (testcase.async === true){
						stop();
					}

					if (typeof testcase.operation === 'function') {
						testcase.operation(testContainer, testcase);
					}

				}
			);
		});
	});
});
