/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define("pluginapitest",
['require', 'aloha/jquery'],
function(require, jQuery) {
	"use strict";
	
	var	$ = window.jQuery,
		$body = $('body');
	
	console.log('start tests');
//	debugger;
	
	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		
		$('body').bind('aloha',function() {
			ok(true, 'Aloha Event was fired');
			$('#edit').aloha();
			$('#edit2').aloha();
			start();
		});
		
		setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 2000);
		
	});
	
	asyncTest('Aloha relative bundle plugin resource loading', function() {
		var url = Aloha.getPluginUrl('plugintest1') + '/res/test.json';
		$.ajax({
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
		$.ajax({
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
	
	// All other tests are done when Aloha is ready
//	$('body').bind('alohaEditableCreated', function() {
//		
//		editablesCreated++;
//		if (editablesCreated >= 2) {
//			test('Aloha Error Log Test', function() {
//				var logHistory = window.Aloha.Log.getLogHistory();
//				equal(logHistory.length, 2, 'Check number of logged messages');
//			});
//			test('Aloha Plugins test', function() {
//				var plugins = window.Aloha.PluginManager.plugins,
//					editable = window.Aloha.getEditableById('edit'),
//					editable2 = window.Aloha.getEditableById('edit2'),
//					editableconfig;
//				equal('format' in plugins, false, 'Check if format plugin is absent from registry');
//				equal('plugintest' in plugins, true, 'Check if plugintest plugin is present in registry');
//				equals(window.Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit")),
//						undefined,'Check if getEditableConfig for edit returns undefined');
//				same(window.Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit2")),
//						{foo:"bar"},
//						'Check if getEditableConfig for edit2 returns {foo:"bar"}');
//				same(window.Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit3")),
//						{'foo': new RegExp(".")},
//						'Check if getEditableConfig for edit3 returns {foo:regexp}');
//				
//			});
			
//		}
//		// check whether error or warn messages were logged during startup
//	});
});