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
					"allowchars": new RegExp('[0-9]{1}')
				}
			}
		}
	}
};
/**
 * Utility function to trigger a key event for a given key code.
 */
function triggerKeyEvents(field, keyCode, shiftKey, ctrlKey) {
    field = $(field);
    shiftKey = Boolean(shiftKey);
    ctrlKey = Boolean(ctrlKey);

    field.simulate("keydown", { keyCode: keyCode,
                                ctrlKey: ctrlKey,
                                shiftKey: shiftKey });
    field.simulate("keypress", { keyCode: keyCode,
                                 ctrlKey: ctrlKey,
                                 shiftKey: shiftKey });

    applyKeyCodeToValue(field, keyCode);
    
    field.simulate("keyup", { keyCode: keyCode,
                              ctrlKey: ctrlKey,
                              shiftKey: shiftKey });
}

/*
 * Internal function to simulate a key being typed into an edit 
 * field for testing purposes.  Tries to handle cases like 
 * 'backspace' or 'arrow key'.  It's assumed that the cursor is
 * always at the end of the field.
 */
function applyKeyCodeToValue(field, keyCode) {
    field = $(field);

    if ((keyCode >= 32) && (keyCode <= 126)) {
        field.val(field.val() + String.fromCharCode(keyCode));
    }
    else {
        switch(keyCode) {
            case 8:                                 // Backspace
                var     val = field.val();

                if (val.length) {
                    field.val(val.substring(0, val.length - 1));
                }
                break;

            default:
                break;
        }
    }
}
/**
 * Utility function to trigger a key press event for each character
 * in a string.  Each character will be triggered 'keyTiming'
 * milliseconds apart.  The onComplete function will be called 
 * 'keyTiming' milliseconds after the last key is triggered.
 */
function doCharKeypressTest(editable, container, offset, str, reference) {
	var
		keyCode = str.charCodeAt(0),
		field = editable.obj;
	Aloha.Log.error(Aloha,"editable : " + editable.attr('id'));
	Aloha.activateEditable(Aloha.getEditableById(editable.attr('id')));
	// set cursor
	TestUtils.setCursor(editable, container, offset);
    triggerKeyEvents(field, keyCode);
    var result = Aloha.getEditableById(editable.attr('id')).getContents(true);	// get the result
	var expected = $(reference).contents();
	// compare the result with the expected result
	deepEqual(result.extractHTML(), expected.extractHTML(), 'Check Operation Result');
}
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
	editable.simulate('keydown', {keyCode: keycode, charCode: keycode, shiftKey: shiftkey});
	editable.simulate('keypress', {keyCode: keycode, charCode: keycode, shiftKey: shiftkey});
	editable.simulate('keyup', {keyCode: keycode, charCode: keycode, shiftKey: shiftkey});
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
			// giving up for now
			// TODO: talk jqunit about simulating keystrokes
//			doCharKeypressTest(this.edit, this.edit.contents().get(0), 0, '3', '#ref-plaintext-start-autorized');
//			doKeyStrokeTest(this.edit, this.edit.contents().get(0), 0, 51, false, '#ref-plaintext-start-autorized');
//			doKeyStrokeTest(this.edit2, this.edit2.contents().get(0), 0, 51, false, '#ref-plaintext-start-autorized');
		});
	});
});
