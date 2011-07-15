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
	plugins: {
		"inputmask": {
			"config": {},
			"editables": {
				"#edit2": {
					"enableFilter": true,
					"allowchars": new RegExp('[0-9]')
				}
			}
		}
	}
};
/**
 * Do an enter test
 * @param editable the editable
 * @param container cursor container
 * @param offset offset of the cursor position
 * @param shift true for shift enter, false for normal enter
 * @param twice true for pressing enter twice, false for once
 * @param reference result selector
 */


function doKeyStrokeTest(editable, container, offset, keycode, shiftkey, reference) {
	Aloha.Log.error(Aloha,"editable : " + editable.attr('id'));
	Aloha.activateEditable(Aloha.getEditableById(editable.attr('id')));
	// set cursor
	TestUtils.setCursor(editable, container, offset);
	editable.simulate('keydown', {keyCode: keycode});
	editable.simulate('keyup', {keyCode: keycode});
	 var result = Aloha.getEditableById(editable.attr('id')).getContents(true);	// get the result

	var expected = $(reference).contents();

	// compare the result with the expected result
	deepEqual(result.extractHTML(), expected.extractHTML(), 'Check Operation Result');
}

$(document).ready(function() {
	// Test whether Aloha is properly initialized
	/*
	  Note: this test is currently necessary, because it will catch the initial 'aloha' Event.
	  In the event handler of this event, due to a Bug Aloha will NOT YET be initialized, so if any test would fail when run then.
	 */
	asyncTest('Aloha Startup Test', function() {
		var that = this;
		$('body').bind('aloha',function() {
			ok(true, 'Aloha Event was fired');
			clearTimeout(that.timeout);
			start();
		});
		this.timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
	});

	$('body').bind('aloha', function() {
		asyncTest('Start Plugin-InputMask test', function(){
			editablecount = 0;
			Aloha.bind("aloha-editable-created", function() {
				editablecount++;
				if (editablecount >= 2) {
					start();
					$('body').trigger('alohaTestReadyForLaunch');
				}
			});
			$("#edit").aloha();
			$("#edit2").aloha();
		});
	});
	$('body').bind('alohaTestReadyForLaunch', function(){
		module('Filtered input test', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-plaintext');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());
				
			},
			teardown: function() {
				
			}
		});
		test('Insert authorized char at beginning', function() {
			doKeyStrokeTest(this.edit2, this.edit2.contents().get(0), 0, 51, false, '#ref-plaintext-start-autorized');
		});
	});
});
