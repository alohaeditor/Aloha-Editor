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
			'disableEnter': false
		},
		editables: {
			'#edit2': {
				'disableEnter': true
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


function doEnterTest(editable, container, offset, shift, twice, reference) {
	Aloha.Log.error(Aloha,"editable : " + editable.attr('id'));
	Aloha.activateEditable(Aloha.getEditableById(editable.attr('id')));
	// set cursor
	TestUtils.setCursor(editable, container, offset);
	// press enter
	TestUtils.pressEnter(editable, shift);
	// possibly again
	if (twice) {
		TestUtils.pressEnter(editable, shift);
	}
	// get the result
	 var result = Aloha.getEditableById(editable.attr('id')).getContents(true);

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
		asyncTest('Start plaintext Enter handling', function(){
			editablecount = 0;
			Aloha.bind("aloha-editable-created", function() {
				editablecount++;
				if (editablecount >= 2) {
					deepEqual(Aloha.getEditableConfig(Aloha.getEditableById('edit').obj),{'disableEnter': false});
					deepEqual(Aloha.getEditableConfig(Aloha.getEditableById('edit2').obj),{'disableEnter': true});
					start();
					$('body').trigger('alohaTestReadyForLaunch');
				}
			});
			$("#edit").aloha();
			$("#edit2").aloha();
		});
	});
	$('body').bind('alohaTestReadyForLaunch', function(){
		module('Plaintext Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-plaintext');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());
				// aloha'fy the editable
			},
			teardown: function() {
				// de-aloha'fy the editable
//				this.edit.mahalo();
//				this.edit2.malaho();
			}
		});
		test('Enter at beginning', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 0, false, false, '#ref-plaintext-start-enter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 0, false, false, '#ref-plaintext');
		});

                // Test pressing Enter twice at beginning of plain text
		test('Double Enter at beginning', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 0, false, true, '#ref-plaintext-start-dblenter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 0, false, true, '#ref-plaintext');
		});

                // Test pressing Enter in the middle of plain text
		test('Enter in the middle', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 10, false, false, '#ref-plaintext-mid-enter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 10, false, false, '#ref-plaintext');
		});

                // Test pressing Enter twice in the middle of plain text
		test('Double Enter in the middle', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 10, false, true, '#ref-plaintext-mid-dblenter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 10, false, true, '#ref-plaintext');
		});

                // Test pressing Enter at the end of plain text
		test('Enter at end', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 18, false, false, '#ref-plaintext-end-enter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 18, false, false, '#ref-plaintext');
		});

                // Test pressing Enter twice at the end of plain text
		test('Double Enter at end', function() {
			doEnterTest(this.edit, this.edit.contents().get(0), 18, false, true, '#ref-plaintext-end-dblenter');
			doEnterTest(this.edit2, this.edit2.contents().get(0), 18, false, true, '#ref-plaintext');
		});
		
		module('Heading Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-heading');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());
				// aloha'fy the editable
			},
			teardown: function() {
				// de-aloha'fy the editable
				//this.edit.mahalo();
			}
		});
		test('Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().get(0), 0, false, false, '#ref-heading-start-enter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().get(0), 0, false, false, '#ref-heading');
		});

		test('Double Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().get(0), 0, false, true, '#ref-heading-start-dblenter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().get(0), 0, false, true, '#ref-heading');
		});

		test('Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().get(0), 3, false, false, '#ref-heading-mid-enter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().get(0), 3, false, false, '#ref-heading');
		});

		test('Double Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().get(0), 3, false, true, '#ref-heading-mid-dblenter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().get(0), 3, false, true, '#ref-heading');
		});

		test('Enter in bold', function() {
			doEnterTest(this.edit, this.edit.find('b').contents().get(0), 2, false, false, '#ref-heading-bold-enter');
			doEnterTest(this.edit2, this.edit2.find('b').contents().get(0), 2, false, false, '#ref-heading');
		});

		test('Double Enter in bold', function() {
			doEnterTest(this.edit, this.edit.find('b').contents().get(0), 2, false, true, '#ref-heading-bold-dblenter');
			doEnterTest(this.edit2, this.edit2.find('b').contents().get(0), 2, false, true, '#ref-heading');
		});

		test('Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().last().get(0), 8, false, false, '#ref-heading-end-enter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().last().get(0), 8, false, false, '#ref-heading');
		});

		test('Double Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('h1').contents().last().get(0), 8, false, true, '#ref-heading-end-dblenter');
			doEnterTest(this.edit2, this.edit2.find('h1').contents().last().get(0), 8, false, true, '#ref-heading');
		});






		module('Paragraph Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-paragraph');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());

				// aloha'fy the editable
//				this.edit.aloha();
			},
			teardown: function() {
				// de-aloha'fy the editable
//				this.edit.mahalo();
			}
		});

		test('Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(0), 0, false, false, '#ref-paragraph-start-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(0), 0, false, false, '#ref-paragraph');
		});

		test('Double Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(0), 0, false, true, '#ref-paragraph-start-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(0), 0, false, true, '#ref-paragraph');
		});

		test('Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 3, false, false, '#ref-paragraph-mid-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 3, false, false, '#ref-paragraph');
		});

		test('Double Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 3, false, true, '#ref-paragraph-mid-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 3, false, true, '#ref-paragraph');
		});

		test('Enter at start of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 0, false, false, '#ref-paragraph-startitalic-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 0, false, false, '#ref-paragraph');
		});

		test('Double Enter at start of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 0, false, true, '#ref-paragraph-startitalic-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 0, false, true, '#ref-paragraph');
		});

		test('Enter in italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 3, false, false, '#ref-paragraph-miditalic-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 3, false, false, '#ref-paragraph');
		});

		test('Double Enter in italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 3, false, true, '#ref-paragraph-miditalic-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 3, false, true, '#ref-paragraph');
		});

		test('Enter at end of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 6, false, false, '#ref-paragraph-enditalic-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 6, false, false, '#ref-paragraph');
		});

		test('Double Enter at end of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 6, false, true, '#ref-paragraph-enditalic-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 6, false, true, '#ref-paragraph');
		});

		test('Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 20, false, false, '#ref-paragraph-end-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 20, false, false, '#ref-paragraph');
		});

		test('Double Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 20, false, true, '#ref-paragraph-end-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 20, false, true, '#ref-paragraph');
		});
			

		module('Paragraph Shift Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-paragraph');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());

				// aloha'fy the editable
//				this.edit.aloha();
			},
			teardown: function() {
				// de-aloha'fy the editable
//				this.edit.mahalo();
			}
		});

		test('Shift Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(0), 0, true, false, '#ref-paragraph-start-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(0), 0, true, false, '#ref-paragraph');
		});

		test('Double Shift Enter at start', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(0), 0, true, true, '#ref-paragraph-start-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(0), 0, true, true, '#ref-paragraph');
		});

		test('Shift Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 3, true, false, '#ref-paragraph-mid-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 3, true, false, '#ref-paragraph');
		});

		test('Double Shift Enter in middle', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 3, true, true, '#ref-paragraph-mid-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 3, true, true, '#ref-paragraph');
		});

		test('Shift Enter at start of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 0, true, false, '#ref-paragraph-startitalic-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 0, true, false, '#ref-paragraph');
		});

		test('Double Shift Enter at start of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 0, true, true, '#ref-paragraph-startitalic-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 0, true, true, '#ref-paragraph');
		});

		test('Shift Enter in italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 3, true, false, '#ref-paragraph-miditalic-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 3, true, false, '#ref-paragraph');
		});

		test('Shift Enter at end of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 6, true, false, '#ref-paragraph-enditalic-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 6, true, false, '#ref-paragraph');
		});

		test('Double Shift Enter at end of italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 6, true, true, '#ref-paragraph-enditalic-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 6, true, true, '#ref-paragraph');
		});

		test('Double Shift Enter in italic', function() {
			doEnterTest(this.edit, this.edit.find('i').contents().get(0), 3, true, true, '#ref-paragraph-miditalic-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('i').contents().get(0), 3, true, true, '#ref-paragraph');
		});

		test('Shift Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 20, true, false, '#ref-paragraph-end-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 20, true, false, '#ref-paragraph');
		});

		test('Double Shift Enter at end', function() {
			doEnterTest(this.edit, this.edit.find('p').contents().get(2), 20, true, true, '#ref-paragraph-end-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('p').contents().get(2), 20, true, true, '#ref-paragraph');
		});
		
		module('List Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-list');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());
				// aloha'fy the editable
//				this.edit.aloha();
			},
			teardown: function() {
				// de-aloha'fy the editable
//				this.edit.mahalo();
			}
		});

		test('Enter at first start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 0, false, false, '#ref-list-firststart-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 0, false, false, '#ref-list');
		});

		test('Double Enter at first start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 0, false, true, '#ref-list-firststart-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 0, false, true, '#ref-list');
		});

		test('Enter at first middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 2, false, false, '#ref-list-firstmid-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 2, false, false, '#ref-list');
		});

		test('Double Enter at first middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 2, false, true, '#ref-list-firstmid-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 2, false, true, '#ref-list');
		});

		test('Enter at first end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 5, false, false, '#ref-list-firstend-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 5, false, false, '#ref-list');
		});

		test('Double Enter at first end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 5, false, true, '#ref-list-firstend-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 5, false, true, '#ref-list');
		});

		test('Enter at second start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 0, false, false, '#ref-list-secondstart-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 0, false, false, '#ref-list');
		});

		test('Double Enter at second start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 0, false, true, '#ref-list-secondstart-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 0, false, true, '#ref-list');
		});

		test('Enter at second middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 3, false, false, '#ref-list-secondmid-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 3, false, false, '#ref-list');
		});

		test('Double Enter at second middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 3, false, true, '#ref-list-secondmid-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 3, false, true, '#ref-list');
		});

		test('Enter at second end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 6, false, false, '#ref-list-secondend-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 6, false, false, '#ref-list');
		});

		test('Double Enter at second end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 6, false, true, '#ref-list-secondend-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 6, false, true, '#ref-list');
		});

		test('Enter at last start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 0, false, false, '#ref-list-laststart-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 0, false, false, '#ref-list');
		});

		test('Double Enter at last start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 0, false, true, '#ref-list-laststart-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 0, false, true, '#ref-list');
		});

		test('Enter at last middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 2, false, false, '#ref-list-lastmid-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 2, false, false, '#ref-list');
		});

		test('Double Enter at last middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 2, false, true, '#ref-list-lastmid-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 2, false, true, '#ref-list');
		});

		test('Enter at last end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 5, false, false, '#ref-list-lastend-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 5, false, false, '#ref-list');
		});

		test('Double Enter at last end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 5, false, true, '#ref-list-lastend-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 5, false, true, '#ref-list');
		});
		module('List Shift Enter Handling', {
			setup: function() {
				// get the editable area and the reference
				this.edit = $('#edit');
				this.edit2 = $('#edit2');
				this.ref = $('#ref-list');
				// fill the editable area with the reference
				this.edit.html(this.ref.html());
				this.edit2.html(this.ref.html());

				// aloha'fy the editable
//				this.edit.aloha();
			},
			teardown: function() {
				// de-aloha'fy the editable
//				this.edit.mahalo();
			}
		});

		test('Enter at first start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 0, true, false, '#ref-list-firststart-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 0, true, false, '#ref-list');
		});

		test('Double Enter at first start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 0, true, true, '#ref-list-firststart-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 0, true, true, '#ref-list');
		});

		test('Enter at first middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 2, true, false, '#ref-list-firstmid-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 2, true, false, '#ref-list');
		});

		test('Double Enter at first middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 2, true, true, '#ref-list-firstmid-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 2, true, true, '#ref-list');
		});

		test('Enter at first end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 5, true, false, '#ref-list-firstend-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 5, true, false, '#ref-list');
		});

		test('Double Enter at first end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(0).contents().get(0), 5, true, true, '#ref-list-firstend-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(0).contents().get(0), 5, true, true, '#ref-list');
		});

		test('Enter at second start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 0, true, false, '#ref-list-secondstart-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 0, true, false, '#ref-list');
		});

		test('Double Enter at second start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 0, true, true, '#ref-list-secondstart-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 0, true, true, '#ref-list');
		});

		test('Enter at second middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 3, true, false, '#ref-list-secondmid-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 3, true, false, '#ref-list');
		});

		test('Double Enter at second middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 3, true, true, '#ref-list-secondmid-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 3, true, true, '#ref-list');
		});

		test('Enter at second end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 6, true, false, '#ref-list-secondend-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 6, true, false, '#ref-list');
		});

		test('Double Enter at second end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(1).contents().get(0), 6, true, true, '#ref-list-secondend-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(1).contents().get(0), 6, true, true, '#ref-list');
		});

		test('Enter at last start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 0, true, false, '#ref-list-laststart-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 0, true, false, '#ref-list');
		});

		test('Double Enter at last start', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 0, true, true, '#ref-list-laststart-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 0, true, true, '#ref-list');
		});

		test('Enter at last middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 2, true, false, '#ref-list-lastmid-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 2, true, false, '#ref-list');
		});

		test('Double Enter at last middle', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 2, true, true, '#ref-list-lastmid-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 2, true, true, '#ref-list');
		});

		test('Enter at last end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 5, true, false, '#ref-list-lastend-shift-enter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 5, true, false, '#ref-list');
		});

		test('Double Enter at last end', function() {
			doEnterTest(this.edit, this.edit.find('li').eq(2).contents().get(0), 5, true, true, '#ref-list-lastend-shift-dblenter');
			doEnterTest(this.edit2, this.edit2.find('li').eq(2).contents().get(0), 5, true, true, '#ref-list');
		});
	});
});
