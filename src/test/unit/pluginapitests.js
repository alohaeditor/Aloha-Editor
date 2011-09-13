/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[],
function() {
	"use strict";
	
	Aloha.ready( function() {
		
		asyncTest('Aloha plugin defaults and settings', function() {
			var plugin = Aloha.require('plugintest1/plugintest1-plugin');
			equal(plugin.settings.value2, 2, 'defaults');
			equal(plugin.settings.value1, -1, 'settings');
			equal(plugin.settings.value3.valueB, 'B', 'nested defaults');
			equal(plugin.settings.value3.valueA, 'Z', 'nested settings');
			start();
		});
		
		asyncTest('Aloha plugin paths [lib, vendor, nls, res, css]', function() {
			Aloha.require( ['plugintest1/test', 'plugintest1/vendor/test', 'i18n!plugintest1/nls/i18n',
		               'plugintest1/test', 'plugintest1/css/test'],
				function( lib, vendor, i18n, res, css ) {
					ok(true, 'Plugin loaded with all path');
					equal(lib.status, 'ok', 'lib ok');
					equal(vendor.status, 'ok', 'vendor ok');
					equal(typeof i18n.t, 'function', 'nls ok');
					equal(res.status, 'ok', 'res ok');
					equal(css.status, 'ok', 'css ok');
					start();
					clearTimeout( t );
				}
			);
			var t = setTimeout(function() {
				ok(false, 'Aloha plugin localization did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		asyncTest('Aloha relative bundle plugin resource loading', function() {
			var url = Aloha.getPluginUrl('plugintest1') + '/res/test.json';
			jQuery.ajax({
				url: url,
				dataType: 'json',		
				success: function( data ) {
					ok(true, 'Ressource1 loaded from ' + url);
					test( 'Test loaded data', function() {
						equals(data.data, 'ok', 'Loaded data is correct');
					});
					start();
				},
				error: function( error ) {
					ok(false, 'Error: '+ error.statusText + '. URL was ' + url );
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
					equals(data.data, 'ok', 'Loaded data is correct');
					start();
				},
				error: function( error ) {
					ok(false, 'Failure loading plugin resource. URL was ' + url);
					start();
				}
			});
	
		});
		
		asyncTest('Aloha plugin default localization (fallback)', function() {
			Aloha.require( ['i18n!plugintest2/nls/i18n'],
				function( i18n ) {
					var key = i18n.t('plugin2.test1');
					if ( key == 'fallback' ) {
						ok(true, 'Default key was loaded.');
					} else {
						ok(false, 'Failure loading default language key. Result: ' + key);
					}
					start();
					clearTimeout( t );
				}
			);
			var t = setTimeout(function() {
				ok(false, 'Aloha plugin localization did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		asyncTest('Aloha plugin german localization', function() {
			Aloha.require( ['i18n!plugintest1/nls/i18n'],
				function( i18n ) {
					var key = i18n.t('plugin1.test1');
					if ( key == 'german' ) {
						ok(true, 'German key was loaded.');
					} else {
						ok(false, 'Failure loading german language key. Result: ' + key);
					}
					start();
					clearTimeout( t );
				}
			);
			var t = setTimeout(function() {
				ok(false, 'Aloha plugin localization did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		test('Aloha plugin invocation Test', function() {
			equal(window.AlohaPlugin1, true, 'Invocation of the plugin init method.');
		});
		
		asyncTest('Aloha plugin async dynamic module loading', function() {
			Aloha.require( ['plugintest1/component'],
				function( component ) {
					ok(true, 'module loaded.');
					equal(component.doOther(), 'didOther', 'module function present.');
					equal(component.doSome(), 'didSome', 'function from dependend module present.');
					start();
					clearTimeout( t );
				}
			);
			var t = setTimeout(function() {
				ok(false, 'Aloha plugin dynamically async module loading did not return in 5 seconds');
				start();
			}, 
			5000);
		});
		
		asyncTest('Aloha cross plugin async dynamic module loading', function() {
			Aloha.require( ['plugintest2/component'],
				function( component ) {
					equal(component.doSome(), 'didSome', 'Sucessfully dynamically async loaded cross plugin module dependency.');
					start();
					clearTimeout( t );
				}
			);
			var t = setTimeout(function() {
				ok(false, 'Aloha plugin dynamically async module loading did not return in 5 seconds');
				start();
			}, 
			5000);
		});
	});
});