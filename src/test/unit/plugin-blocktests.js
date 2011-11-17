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
function( TestUtils ) {
	'use strict';
	var jQuery = Aloha.jQuery;

	var htmlSourceCleanup = function($domNode) {

		var result = $domNode.html().toLowerCase();

		// Internet Explorer does not have quotes around attribute
		// values, so we will add them

		result = result.replace(
			/([\w-]+)\s*=\s*([\w-]+)([\s>])/g, function ( str, $n, $v, $e, offset, s ) {
			return $n + '="' + $v + '"' + $e;
		});
		return style_html( result );
	}

	var tests = [

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


		{ exclude : true } // ... just catch trailing commas
	];

	Aloha.ready( function() {
		var jQuery = Aloha.jQuery,
		    testContainer = jQuery( '#block-outer-container' ),
			testcase,
			start,
			expected;

		for ( var i = 0; i < tests.length; i++ ) {
			testcase = tests[ i ];

			if ( testcase.exclude === true ) {
				continue; // comment in to run all tests
			}

			if ( testcase.module ) {
				module( testcase.module.toUpperCase() + ' :' );
				continue;
			}


			test(
				( testcase.desc || 'Test' ).toUpperCase(),
				testcase.assertions,
				function() {
					// Place test contents into our editable, and activate the editable
					testContainer.html(testcase.start)

					if ( typeof testcase.operation === 'function' ) {
						testcase.operation(testContainer, testcase);
					}

				}
			);
		}
	});
});
