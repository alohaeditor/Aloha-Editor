/* commandtest.js is part of Aloha Editor project http://aloha-editor.org
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
	
	var jQuery = window.jQuery;
	var FormatPlugin, ListPlugin;

	var browser, browserversion;
	if (jQuery.browser.msie) {
		browser = "msie";
	} else if (jQuery.browser.webkit) {
		browser = "webkit";
	} else if (jQuery.browser.opera) {
		browser = "opera";
	} else if (jQuery.browser.mozilla) {
		browser = "mozilla";
	}
	browserversion = browser + jQuery.browser.version;

	module('CommandTest');

	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		Aloha.ready( function() {
			clearTimeout(timeout);
			ok(true, 'Alohoha Dependencies were loaded');
			start();
		});
	});

	// All other tests are done when Aloha is ready
	Aloha.ready( function() {

		Aloha.require( ['format/format-plugin', 'list/list-plugin'], function ( Format, List ) {
			FormatPlugin = Format;
			ListPlugin = List;
		});

		var 
			editable = jQuery( '#edit' ),
			converterResult = jQuery('<div>'),
			converter = jQuery('<div>');

		// aloha'fy the editable
		editable.aloha();
		
		for ( var i = 0; i < tests.tests.length; i++ ) {
			var	check = tests.tests[i],
				excluded = false;

			if ( typeof check === 'undefined' ) {
				check = {};
			}

			if ( typeof check.exclude === 'undefined' ) {
				check.exclude = false;
			}

			if ( typeof check.include === 'undefined' ) {
				check.include = false;
			}

			if (check.exclude && typeof check.exclude === 'string') {
				check.exclude = [check.exclude];
			}
			if (check.include && typeof check.include === 'string') {
				check.include = [check.include];
			}
			// if exclude is set, check whether we need to exclude the test
			if (check.exclude && (check.exclude.indexOf(browser) !== -1 || check.exclude.indexOf(browserversion) !== -1)) {
				excluded = true;
			}
			// if include is set, check whether we shall include the test
			if (check.include && check.include.indexOf(browser) === -1 && check.include.indexOf(browserversion) === -1) {
				excluded = true;
			}

			check.value = ( typeof check.value !== 'undefined') ? check.value : tests.defaultValue;
			check.attributes = ( typeof check.attributes !== 'undefined') ? check.attributes : tests.defaultAttributes;

			converter.text(check.start);
			var descStart = converter.html();

			converter.text(check.value);
			var descValue = converter.html();

			converterResult.text(check.execResult);
			var descResult = converterResult.html();

			var descName = '"' + descStart + '" &rarr; "' + descResult + '"';
			if (descValue && descValue !== descStart) {
				descName += ' ("' + descValue +'")';
			}

			var name = check.name ||  descName;
			var moduleName = tests.label || tests.defaultCommand;

			module( moduleName + ' ' + (i+1) + (excluded ? ' (EX)' : ''), {
				setup: function() {
					// fill the editable area with the start value
					editable.html(this.check.start);
					editable.focus();
				},
				teardown: function() {
					// goodbye
				}
			});
			
			if ( excluded ) {
				test( name, {check:check}, function() {
				});
			} else {
				test( name, {check:check}, function() {
					var 
					check = this.check,
					command = check.command || tests.defaultCommand,
					range = TestUtils.addRange( editable ),
					execResult,
					execToggle,
					result,
					r;
					
					r = Aloha.createRange();
					r.setStart( range.startContainer, range.startOffset) ;
					r.setEnd( range.endContainer, range.endOffset);
					Aloha.getSelection().removeAllRanges();
					Aloha.getSelection().addRange(r);
					Aloha.getEditableHost(editable).activate();

					// Start
					if ( typeof check.indetermStart !== 'undefined' ) {
						// query command indeterminacy and compare
						result = Aloha.queryCommandIndeterm( command );
						deepEqual( result, check.indetermStart, 'queryCommandIndeterm start' );
					}
					if ( typeof check.stateStart !== 'undefined' ) {
						// query command state and compare
						result = Aloha.queryCommandState( command );
						deepEqual( result, check.stateStart, 'queryCommanState start' );
					}
					if ( typeof check.valueStart !== 'undefined' ) {
						// query command value and compare
						result = Aloha.queryCommandValue( command );
						deepEqual( result, check.valueStart, 'queryCommandValue start' );
					}
					
					// ExecCommand
					if ( typeof check.execResult !== 'undefined' ) {
						// execute the command
						//Aloha.execCommand( command, false, check.value, range );
						if (command === 'bold') {
							FormatPlugin.addMarkup('b');
						} else if (command === 'removeFormat') {
							FormatPlugin.removeFormat();
						} else if (command === 'outdent') {
							ListPlugin.outdentList()
						} else if (command === 'indent') {
							ListPlugin.indentList();
						} else if (command === 'insertunorderedlist') {
							ListPlugin.transformList('ul');
						} else if (command === 'insertorderedlist') {
							ListPlugin.transformList('ol');
						} else {
							Aloha.execCommand( command, false, check.value, range );
						}

						// place the marker at the selection and add brackets
						range = rangy.getSelection().getRangeAt(0);
						TestUtils.addBrackets(range);
						
						// clone the editable object
						result = Aloha.editables[0].obj.clone(false);
						// get the content as html
						var resultHtml = result.html();
						// set the content back (this will merge adjacent text nodes and remove empty text nodes)
						result.html(resultHtml);
						// get the contents of the editable
						result = result.contents();
						execResult = jQuery( '<div>' + check.execResult + '</div>' );
						
						// remove browser specific elements from expected results
						if (browser) {
							execResult.find('[data-test-exclude~="'+browser+'"]').remove();
						}
						execResult = execResult.contents();
						
						deepEqual( result.extractHTML( check.attributes ), execResult.extractHTML( check.attributes ), 'execCommand result' );
					}
					
					// Result
					if ( typeof check.indetermResult !== 'undefined' ) {
						// query command indeterminacy and compare
						result = Aloha.queryCommandIndeterm( command );
						deepEqual( result, check.indetermResult, 'queryCommandIndeterm result' );
					}
					if ( typeof check.stateResult !== 'undefined' ) {
						// query command state and compare
						result = Aloha.queryCommandState( command );
						deepEqual( result, check.stateResult, 'queryCommanState result' );
					}
					if ( typeof check.valueResult !== 'undefined' ) {
						// query command value and compare
						result = Aloha.queryCommandValue( command );
						deepEqual( result, check.valueResult, 'queryCommandValue result' );
					}
					
					// log expected result + result
					/* // not working now
					if ( typeof execResult === 'object' && typeof result === 'object' ) {
						window.console.log( execResult.html() + ' -- ' + result.html());
					}*/
					
					if ( check.execToggle ) {
						range = TestUtils.addRange( editable );
						
						r = Aloha.createRange();
						r.setStart( range.startContainer, range.startOffset) ;
						r.setEnd( range.endContainer, range.endOffset);
						Aloha.getSelection().removeAllRanges();
						Aloha.getSelection().addRange(r);
						
            // toggle ExecCommand
						if ( typeof check.execToggle !== 'undefined' ) {
							// execute the command
//							result = Aloha.execCommand( command, false, check.value );
							FormatPlugin.addMarkup('b');
							// place the marker at the selection and add brackets
							range = rangy.getSelection().getRangeAt(0);
							TestUtils.addBrackets(range);
							result = Aloha.editables[0].getContents( true );			
							execToggle = jQuery( '<div>' + check.execToggle + '</div>' ).contents();
							deepEqual( result.extractHTML( check.attributes ), execToggle.extractHTML( check.attributes ), 'execCommand toggle result' );
						}
						
						// Toggle result
						if ( typeof check.indetermToggle !== 'undefined' ) {
							// query command indeterminacy and compare
							result = Aloha.queryCommandIndeterm( command );
							deepEqual( result, check.indetermToggle, 'queryCommandIndeterm toggle result' );
						}
						if ( typeof check.stateToggle !== 'undefined' ) {
							// query command state and compare
							result = Aloha.queryCommandState( command );
							deepEqual( result, check.stateToggle, 'queryCommanState toggle result' );
						}
						if ( typeof check.valueResult !== 'undefined' ) {
							// query command value and compare
							result = Aloha.queryCommandValue( command );
							deepEqual( result, check.valueToggle, 'queryCommandValue toggle result' );
						}
					}
					
				});
			}
		}
	});
});
