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
function( TestUtils, jQueryq ) {
	'use strict';


	//
	//	  NB:
	//	-----------------------------------------------------------------------
	//	  selectRow and selectColumns has an issue where index 0 selects the
	//	  helper row/column instead of the first editable row/column.
	//	  All following tests will work around this fault by using 1-indexing
	//	  with selectcolumns rather than 0 based indexing.
	//	  Where this is done, we note that we have "corrected" the index.
	//	-----------------------------------------------------------------------
	//

	var tests = [

		{ module : 'Initialization' },
		///////////////////////////////////////////////////////////////////////

		{
			exclude   : false,
			desc      : 'Activate a block',
			start     : '<div id="myDefaultBlock">Some default block content</div>',
			expected  : '<foo></foo>',
			operation : function () {
				console.log("Op");
				console.log(jQuery.fn);
				console.log(jQuery('#myDefaultBlock').alohaBlock);
				jQuery('#myDefaultBlock').alohaBlock({
					'block-type': 'DefaultBlock'
				});
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

			start = style_html( testcase.start );
			expected = style_html( testcase.expected );

			// Place test contents into our editable, and activate the editable
			testContainer.html(start)

			if ( typeof testcase.operation === 'function' ) {
				testcase.operation();
			}

			test(
				( testcase.desc || 'Test' ).toUpperCase(),
				{ start: start, expected: expected },
				function() {
					var result = testContainer.html().toLowerCase();

					// Internet Explorer does not have quotes around attribute
					// values, so we will add them

					result = result.replace(
						/([\w-]+)\s*=\s*([\w-]+)([\s>])/g, function ( str, $n, $v, $e, offset, s ) {
						return $n + '="' + $v + '"' + $e;
					});

					result = style_html( result );
					deepEqual( result, expected, 'Check Operation Result' );
				}
			);
		}
	});
});
