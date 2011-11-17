/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

/**
 * TODOs:
 * - selectRow/selectColumn should take into account the helper row/column.
 *   ie: selectRow(0) and selectColumn(0), should be zero indexed
 */

define(
[ 'testutils', '../../lib/aloha/jquery', 'htmlbeautifier' ],
function( TestUtils) {
	'use strict';

	Aloha.ready(function() {

		var jQuery = Aloha.jQuery,
		    testContainer = jQuery( '#block-outer-container' ),
			testcase,
			BlockManager;

		var tests = [
			{
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

			{ module : 'Initialization' },
			///////////////////////////////////////////////////////////////////////

			{
				exclude   : false,
				desc      : 'A default block is initialized correctly',
				start     : '<div id="myDefaultBlock">Some default block content</div>',
				assertions: 9,
				operation : function(testContainer, testcase) {
					jQuery('#myDefaultBlock').alohaBlock({
						'aloha-block-type': 'DefaultBlock'
					});
					var $block = jQuery('.aloha-block', testContainer);

					// Block Wrapper assertions
					strictEqual($block.attr('contenteditable'), 'false', 'The block div wrapper has not set contenteditable=false.');
					ok($block.hasClass('aloha-block'), 'The block div wrapper does not have the aloha-block CSS class.');
					ok($block.hasClass('aloha-block-DefaultBlock'), 'The block div wrapper does not have the aloha-block-DefaultBlock CSS class.');
					strictEqual($block.attr('data-aloha-block-type'), 'DefaultBlock', 'The block div wrapper does not have the data-aloha-block-type set correctly.');
					equal($block.attr('data-block-type'), undefined, 'The block div wrapper has data-block-type set, although it shall not be used anymore by the framework.');

					// content wrapper assertions
					strictEqual(jQuery('#myDefaultBlock', testContainer).length, 1, 'The "default block" has been duplicated somehow...');
					ok($block.find('#myDefaultBlock').hasClass('aloha-block-inner'), 'The inner wrapper does not have the aloha-block-inner CSS class set.');
					strictEqual(jQuery('.aloha-block #myDefaultBlock', testContainer).length, 1, 'The given div wrapper has not been wrapped by the .aloha-block element');
					strictEqual(jQuery('.aloha-block #myDefaultBlock', testContainer).html(), 'Some default block content', 'The block content has been modified');
				}
			},

			{
				exclude   : false,
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

			{ module : 'Block API' },
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

			{ module : 'BlockManager API' },
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
			{ exclude : true } // ... just catch trailing commas
		];


		var skipAll = false;
		jQuery.each(tests, function(i, testcase) {
			if (skipAll === true) return;
			if (testcase.last === true) {
				skipAll = true;
			}
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
					// Place test contents into our editable, and activate the editable
					testContainer.html(testcase.start);

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
