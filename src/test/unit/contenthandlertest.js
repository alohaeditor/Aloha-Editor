/* contenthandlertest.js is part of Aloha Editor project http://aloha-editor.org
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
['testutils'],
function( TestUtils ) {
	"use strict";
	
	var aQuery = Aloha.jQuery;
	
	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		Aloha.ready( function() {
			clearTimeout( timeout );
			ok( true, 'Aloha Event was fired' );
			start();
		});
	});

	
	// All other tests are done when Aloha is ready
	Aloha.ready( function() {

		var 
			editable = aQuery( '#edit' ),
			converter = aQuery('<div>');
		
		// aloha'fy the editable
		editable.aloha();
		
		for ( var i = 0; i < tests.tests.length; i++ ) {
			var 
				check = tests.tests[i];
			
			if (!check) {
				continue;
			}
			
			var
				desc = converter.text(check.start).html() + ' -> ' + converter.text(check.expected).html(),
				value = ( typeof check.value !== 'undefined') ? check.value : tests.defaultValue,
				name = check.name || '"' + converter.text(value).html() + '": ' + desc;
			
			
			module( 'Commmand ' + (i+1) + ' ' + tests.defaultCommand, {
				setup: function() {
					// fill the editable area with the start value
					editable.html(this.check.start);
					editable.focus();
				},
				teardown: function() {
					// goodbye
				}
			});
			
			test( name, {check:check}, function() {
				var 
					check = this.check,
					command = check.command || tests.defaultCommand,
					value = typeof check.value !== 'undefined' ? check.value : tests.defaultValue,
					expected = aQuery( '<div>' + check.expected + '</div>' ).contents(),
					// place the selection (and remove the selection marker)
					range = TestUtils.rangeFromMarker( editable ),
					result;
				
				range.select();
//				var r = Aloha.createRange();
//				r.setStart( range.startContainer, range.startOffset) ;
//				r.setEnd( range.endContainer, range.endOffset);
//				Aloha.getSelection().removeAllRanges();
//				Aloha.getSelection().addRange(r);
//				Aloha.Selection.updateSelection();

				// execute the command
				Aloha.execCommand( command, false, value );
				
				// place the marker at the selection
				range = rangy.getSelection().getRangeAt(0);
				TestUtils.addBrackets(range);
				//TestUtils.markerFromSelection();
				
				// TODO deactivate the editable 
				result = Aloha.editables[0].getContents( true );

				// compare the result with the expected result
				deepEqual( result.extractHTML(), expected.extractHTML(), 'Check Operation Result' );
			});
		}
	});
});
