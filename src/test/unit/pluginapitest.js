/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

if (window.Aloha === undefined || window.Aloha === null) {
	window.Aloha = {};		
}

window.Aloha.settings = {
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
	errorhandling : true,
	plugins: {
		"plugintest": {
			'editables': {
				'#edit2': {
					'foo': 'bar'
				},
				'#edit3': {
					'foo': new RegExp(".")
				}
			}
		}
	}
};

require.ready(function() {
	var	$ = window.jQuery,
		$body = $('body');
	
	var editablesCreated = 0;
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
		}, 60000);
	});
	
	// All other tests are done when Aloha is ready
	$('body').bind('alohaEditableCreated', function() {
		
		editablesCreated++;
		if (editablesCreated >= 2) {
			test('Aloha Error Log Test', function() {
				var logHistory = Aloha.Log.getLogHistory();
				equal(logHistory.length, 2, 'Check number of logged messages');
			});
			test('Aloha Plugins test', function(){
				var plugins = Aloha.PluginManager.plugins,
				editable = Aloha.getEditableById('edit'),
				editable2 = Aloha.getEditableById('edit2'),
				editableconfig;
				equal('format' in plugins, false, 'Check if format plugin is absent from registry');
				equal('plugintest' in plugins, true, 'Check if plugintest plugin is present in registry');
				equals(Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit")),
						undefined,'Check if getEditableConfig for edit returns undefined');
				same(Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit2")),
						{foo:"bar"},
						'Check if getEditableConfig for edit2 returns {foo:"bar"}');
				same(Aloha.PluginRegistry.plugins.plugintest.getEditableConfig($("#edit3")),
						{'foo': new RegExp(".")},
						'Check if getEditableConfig for edit3 returns {foo:regexp}');
				
			});
			
		}
		// check whether error or warn messages were logged during startup
	});

});
