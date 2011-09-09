/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[ 'aloha/jquery'  ],
function( jQuery ) {
	"use strict";
	
	console.log('start tests');
	
	// Test whether Aloha is properly initialized
	asyncTest( 'Aloha Startup Test', function() {
		
		jQuery( 'body' ).bind( 'aloha', function() {
			ok( true, 'Aloha Event was fired');
			jQuery( '#edit' ).aloha();
			jQuery( '#edit2' ).aloha();
			start();
		});
		
		setTimeout( function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 2000);
		
	});
	
	jQuery( 'body' ).bind( 'aloha', function() {
		
		var Aloha = requireAloha('aloha');
		
		asyncTest('Aloha relative bundle plugin resource loading', function() {
			console.log( 'test paths' );
				
			var url = Aloha.getPluginUrl('plugintest1') + '/res/test.json';
			jQuery.ajax({
				url: url,
				dataType: 'json',		
				success: function( data ) {
					ok(true, 'Ressource1 loaded from ' + url);
					// Test if legacy jQuery version is correct
					test('Resource1 data', function() {
						equals(data.data, 'ok', 'Loaded data is correct');
					});
					start();
				},
				error: function( error ) {
					ok(false, 'Failure loading plugin resource. URL was ' + url);
					start();
				}
			});
		});
		
		asyncTest('Aloha absolute bundle plugin resource loading', function() {
			var url = Aloha.getPluginUrl('plugintest2') + '/res/test.json';
			jQuery.ajax({
				url: url,
				dataType: 'json',		
				success: function( data ) {
					ok(true, 'Ressource2 loaded from ' + url);
					// Test if legacy jQuery version is correct
					test('Resource2 data', function() {
						equals(data.data, 'ok', 'Loaded data is correct');
					});
					start();
				},
				error: function( error ) {
					ok(false, 'Failure loading plugin resource. URL was ' + url);
					start();
				}
			});
	
		});
		
		asyncTest('Aloha plugin default localization (fallback)', function() {
			require({
					context: 'aloha',
					paths: Aloha.requirePaths
				},
				['i18n!plugintest2/nls/i18n'],
				function( i18n ) {
					var key = i18n.t('plugin2.test1');
					if ( key == 'fallback' ) {
						ok(true, 'Default key was loaded.');
					} else {
						ok(false, 'Failure loading default language key. Result: ' + key);
					}
					start();
				}
			);
			setTimeout(function() {
				ok(false, 'Localization did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		asyncTest('Aloha plugin german localization', function() {
			require({
					context: 'aloha',
					paths: Aloha.requirePaths
				},
				['i18n!plugintest1/nls/i18n'],
				function( i18n ) {
					var key = i18n.t('plugin1.test1');
					if ( key == 'german' ) {
						ok(true, 'German key was loaded.');
					} else {
						ok(false, 'Failure loading german language key. Result: ' + key);
					}
					start();
				}
			);
			setTimeout(function() {
				ok(false, 'Localization did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		test('Aloha Plugin invocation Test', function() {
			equal(window.AlohaPlugin1, true, 'Invocation of the plugin init method.');
		});
		test('Aloha Plugin module loading of plugins', function() {
			equal(component.doSome(), 'didSome', 'Loaded plugin module.');
		});
	});
});