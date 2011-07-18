/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

Aloha.settings = {
	logLevels : {
		'error': true,
		'warn':  true,
		'info':  true,
		'debug': true
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
	core: {
		config: {
			'disableEnter': true
		},
		editables: {
			'#edit_notdisabled': {
				'disableEnter': false
			}
		}
	}
};

alohaQuery(document).ready(function($) {
	editablecount = 0;
	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		$('body').bind('aloha',function() {
			ok(true, 'Aloha Event was fired');
			$('body').bind("alohaEditableCreated", function() {
				editablecount++;
				Aloha.Log.info(this,editablecount);
				if (editablecount >= 2) {
					test('Aloha Config global #edit', function() {
						var config = {};
						config = Aloha.getEditableConfig(Aloha.getEditableById('edit').obj);
						deepEqual(config,{'disableEnter': true});
					});
					test('Aloha Config specific #edit_notdisabled', function(){
						var config = {},
						edit_notdisabled = Aloha.getEditableById('edit_notdisabled');
						ok(edit_notdisabled !== null, "#edit_notdisabled == null");
						config = Aloha.getEditableConfig(edit_notdisabled.obj);
						deepEqual(config,{'disableEnter': false});
						
					});			
				}
				// check whether error or warn messages were logged during startup
			});
			$("#edit").aloha();
			$("#edit_notdisabled").aloha();
			start();
		});
		setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
	});

	// All other tests are done when Aloha is ready

});
