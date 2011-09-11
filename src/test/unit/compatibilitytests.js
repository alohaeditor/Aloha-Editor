/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define( [], function() {
	"use strict";

	// Start the tests, when Aloha is ready
	alohaQuery('body').bind('aloha', function() {
		
		// for IE, it is necessary to have this setTimeout. Otherwise, the
		// editable would not be recognized as having contentEditable turned on
		// right after editable.aloha
		setTimeout(function() {

			// Test if jQuery is present
			test( 'jQuery present before .noConflict()', function() {
				equals( beforeNoConflict.fn.jquery, '1.5.1', 'Legacy jQuery version is correct' );
			});
			
			// Test if jQuery has been removed
			test( 'jQuery removed from window', function() {
				equals( typeof afterNoConflict, 'undefined', 'Legacy jQuery version is correct' );
			});
			
			// Test if legacy jQuery version is correct
			test( 'jQuery compatibility test', function() {
				equals( window.jQuery.fn.jquery, '1.2.1', 'Legacy jQuery version is correct' );
			});
		
			// Test if legacy jQuery version is correct
			test( 'alohaQuery test', function() {
				equals( alohaQuery.fn.jquery, '1.5.1', 'Legacy jQuery version is correct' );
			});
		
			// Test if legacy jQuery version is correct
			test( 'Aloha requireAloha("aloha/jquery") test', function() {
				equals( requireAloha("aloha/jquery").fn.jquery, '1.5.1', 'Legacy jQuery version is correct' );
			});
			
			// Test if the jquery plugins necessary for aloha core are attached to the Aloha jQuery object
			test( 'jquery core plugin test', function() {
				equals( typeof alohaQuery.store, 'function', 'Check whether the jQuery plugin "store" was attached to Aloha jQuery' );
				equals( typeof alohaQuery.toJSON, 'function', 'Check whether the jQuery plugin "json" was attached to Aloha jQuery' );
			});
		
			// Test if third party jquery plugins, loaded with the 'jquery-plugin' loader are attached to the Aloha jQuery object
			test( '3rd party jquery plugin test', function() {
				// plugintest2 tries to load a jquery plugin with require in 'aloha' context. 
				equals( typeof alohaQuery().alohaTest, 'function', 'Check whether the jQuery plugin "alohaTest" was attached to Aloha jQuery' );
			});
		}, 1);
	});
});