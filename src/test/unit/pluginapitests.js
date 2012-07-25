/* pluginapitests.js is part of Aloha Editor project http://aloha-editor.org
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
[],
function() {
	"use strict";
	
	Aloha.ready( function() {
	
		var testOrder = [
		     		settingsTest,
		     		pathsTest,
		     		relativResourceTest,
		     		absoluteResourceTest,
		     		defaultLocaleTest,
		     		germanLocaleTest,
		     		asyncModuleTest,
		     		crossAsyncModuleTest
		     	];
		
		function runNextTest () {
			if ( testOrder.length ) {
				var test = testOrder.shift();
				if ( typeof test === 'function' ) {
					test();
				}
			}
		};
		
		module('Plugin API test', {});
		
		test('Aloha plugin invocation Test', function() {
			equal(window.AlohaPlugin1, 'called', 'Checking window.AlohaPlugin1.');
		});
		
		runNextTest();

		function settingsTest() {
			asyncTest( 'Aloha plugin defaults and settings', function() {
				var plugin = Aloha.require( 'plugintest1/plugintest1-plugin');
				ok(plugin.settings.value2 == 2, 'defaults');
				ok(plugin.settings.value1 == -1, 'settings');
				ok(plugin.settings.value3.valueB == 'B', 'nested defaults');
				ok(plugin.settings.value3.valueA == 'Z', 'nested settings');

				equal(plugin.settings.value3.valueC.length, 1, 'nested array settings length');
				equal(plugin.settings.value3.valueC[0], 'X', 'nested array settings');

				equal(plugin.settings.value3.valueD.length, 2, 'nested array defaults length');
				equal(plugin.settings.value3.valueD[0], 'III', 'nested array defaults');
				equal(plugin.settings.value3.valueD[1], 'IV', 'nested array defaults');
				start();
				runNextTest();
			});
		};
		
		function pathsTest() {
			asyncTest('Aloha plugin paths [lib, vendor, nls, res, css]', function() {
				
				Aloha.require( ['plugintest1/test', 'plugintest1/vendor/test', 'i18n!plugintest1/nls/i18n',
			               'plugintest1/test', 'plugintest1/css/test'],	function( lib, vendor, i18n, res, css ) {
					ok(true, 'Plugin loaded with all path');
					ok(lib.status == 'ok', 'lib ok');
					ok(vendor.status == 'ok', 'vendor ok');
					ok(typeof i18n.t == 'function', 'nls ok');
					ok(res.status == 'ok', 'res ok');
					ok(css.status == 'ok', 'css ok');
					start();
					clearTimeout( t );
					runNextTest();
				});
	
				var t = setTimeout(function() {
					ok(false, 'Aloha plugin localization did not return in 5 seconds');
					start();
					runNextTest();
				}, 
				5000);
			});
		};

		function relativResourceTest() {
			asyncTest('Aloha relative bundle plugin resource loading', function() {
				var url = Aloha.getPluginUrl('plugintest1') + '/res/test.json';
				jQuery.ajax({
					url: url,
					dataType: 'json',		
					success: function( data ) {
						ok(true, 'Ressource1 loaded from ' + url);
						ok(data.data == 'ok', 'Loaded data is correct');
						start();
						runNextTest();
					},
					error: function( error ) {
						ok(false, 'Error: '+ error.statusText + '. URL was ' + url );
						start();
						runNextTest();
					}
				});
			});
		}

		
		function absoluteResourceTest() {
			asyncTest('Aloha absolute bundle plugin resource loading', function() {
				var url = Aloha.getPluginUrl('plugintest2') + '/res/test.json';
				jQuery.ajax({
					url: url,
					dataType: 'json',		
					success: function( data ) {
						ok(true, 'Ressource2 loaded from ' + url);
						ok(data.data == 'ok', 'Loaded data is correct');
						start();
						runNextTest();
					},
					error: function( error ) {
						ok(false, 'Failure loading plugin resource. URL was ' + url);
						start();
						runNextTest();
					}
				});
		
			});
		}

		function defaultLocaleTest() {
			asyncTest('Aloha plugin default localization (fallback)', function() {
				Aloha.require( ['i18n!plugintest2/nls/i18n'],
					function( i18n ) {
						var key = i18n.t('plugin2.test1');
						equal( key, 'fallback', 'Fallback key was loaded for plugintest2, key plugin2.test1.');
						start();
						clearTimeout( t );
						runNextTest();
					}
				);
				var t = setTimeout(function() {
					ok(false, 'Aloha plugin localization did not return in 5 seconds');
					start();
					runNextTest();
				}, 
				5000);
			});
		}		

		function germanLocaleTest() {
			asyncTest('Aloha plugin german localization', function() {
				Aloha.require( ['i18n!plugintest1/nls/i18n'],
					function( i18n ) {
						var key = i18n.t('plugin1.test1');
						equal( key, 'german', 'German key was loaded for plugintest1, key plugin1.test1.');
						start();
						clearTimeout( t );
						runNextTest();
					}
				);
				var t = setTimeout(function() {
					ok(false, 'Aloha plugin localization did not return in 5 seconds');
					start();
					runNextTest();
				}, 
				5000);
			});
			
		}
		
		function asyncModuleTest() {
			asyncTest('Aloha plugin async dynamic module loading', function() {
				Aloha.require( ['plugintest1/component'],
					function( component ) {
						ok(true, 'module loaded.');
						ok(component.doOther() == 'didOther', 'module function present.');
						ok(component.doSome() == 'didSome', 'function from dependend module present.');
						start();
						clearTimeout( t );
						runNextTest();
					}
				);
				var t = setTimeout(function() {
					ok(false, 'Aloha plugin dynamically async module loading did not return in 5 seconds');
					start();
					runNextTest();
				}, 
				5000);
			});
		}

		function crossAsyncModuleTest() {
			asyncTest('Aloha cross plugin async dynamic module loading', function() {
				Aloha.require( ['plugintest2/component'],
					function( component ) {
						ok(component.doSome() == 'didSome', 'Sucessfully dynamically async loaded cross plugin module dependency.');
						start();
						clearTimeout( t );
						runNextTest();
					}
				);
				var t = setTimeout(function() {
					ok(false, 'Aloha plugin dynamically async module loading did not return in 5 seconds');
					start();
					runNextTest();
				}, 
				5000);
			});
		}		
		
	});
});