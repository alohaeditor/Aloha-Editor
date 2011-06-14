/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

Aloha.settings = {
	logLevels : {
		'error': true,
		'warn':  true,
		'info':  false,
		'debug': false
	},
	logHistory : {
		levels : {
			'error' : true,
			'warn' : true,
			'info' : false,
			'debug' : false
		}
	},
	errorhandling : true
};

alohaQuery(document).ready(function($) {

	test('.aloha() is loading', function() {
		var editable = alohaQuery('#edit');
		editable.aloha();
		equals(editable.size(),1, 'Editable was found');
		ok(true, '.aloha() could be called');
	});

	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		$('body').bind('aloha',function() {
			ok(true, 'Aloha Event was fired');
			start();
		});
		setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 5000);
	});

	// All other tests are done when Aloha is ready
	$('body').bind('aloha', function() {
		// check whether error or warn messages were logged during startup
		test('Aloha Error Log Test', function() {
			var logHistory = Aloha.Log.getLogHistory();
			equal(logHistory.length, 2, 'Check number of logged messages');
		});
		test('Aloha Plugins test', function(){
			var plugins = Aloha.PluginRegistry.plugins,
				editable = Aloha.getEditableById('edit'),
				editableconfig;
			equal('format' in plugins, false, 'Check if format plugin is absent from registry');
			equal('plugintest' in plugins, true, 'Check if plugintest plugin is present in registry');
			equals(Aloha.PluginRegistry.plugins.plugintest.getEditableConfig(editable),undefined,'Check if getEditableConfig returns null');
			
		});
	});

});
