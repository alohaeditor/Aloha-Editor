(function (aloha) {
	'use strict';

	var Arrays = aloha.arrays;
	var Undo = aloha.undo;
	var Dom = aloha.dom;

	module('undo');

	function content(html) {
		return Arrays.coerce($('<div>' + html + '</div>').contents());
	}

	test('applyChangeSet', function () {
		var editable = document.getElementById('test-editable');

		var changeSet = {
			'changes': [
				{'type': 'insert',
				 'content': content('zero<b>one</b>two<i>three</i>four'),
				 'path': [[0, 'DIV']]},
				{'type': 'insert',
				 'content': content('<u>x</u>'),
				 'path': [[1, 'DIV'], [1, 'B']]},
				{'type': 'insert',
				 'content': content('x'),
				 'path': [[3, 'DIV'], [0, 'I'], [2, '#text']]}
			]
		};

		Undo.applyChangeSet(editable, changeSet);
		equal(editable.innerHTML, 'zero<b>one<u>x</u></b>two<i>thxree</i>four');
	});

	test('Capture, inverseChangeSet', function () {
		var editable = $('#test-editable')[0];
		var controlEditable = Dom.clone(editable);
		var initialChangeSet = {
			'changes': [
				{'type': 'insert',
				 'content': content('zero<b>one</b>two<i>three</i>four'),
				 'path': [[0, 'DIV']]}
			]
		};
		Undo.applyChangeSet(editable, initialChangeSet);
		Undo.applyChangeSet(controlEditable, initialChangeSet);
		var initialEditable = Dom.clone(editable);

		var changeSet = {
			'changes': [
				// Top-levle insert (retained).
				{'type': 'insert',
				 'content': content('<x></x>1<y></y>2<z></z>3'),
				 'path': [[2, 'DIV']]},
				// Insert as a sibling to other inserts.
				{'type': 'insert',
				 'content': content('<b><em></em></b>'),
				 'path': [[5, 'DIV']]},
				// Insert contained in another insert (eliminated).
				{'type': 'insert',
				 'content': content('<i></i>'),
				 'path': [[5, 'DIV'], [0, 'B']]},
				// Delete contained in another insert (eliminated).
				{'type': 'delete',
				 'content': content('<em></em>'),
				 'path': [[5, 'DIV'], [1, 'B']]},
			]
		};

		var context = Undo.Context(editable);
		var capturedFrame = Undo.capture(context, {meta: true}, function () {
			Undo.applyChangeSet(editable, changeSet);
		});
		var capturedChangeSet = Undo.changeSetFromFrame(context, capturedFrame);
		Undo.applyChangeSet(controlEditable, capturedChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);

		var undoChangeSet = Undo.inverseChangeSet(capturedChangeSet);
		Undo.applyChangeSet(editable, undoChangeSet);
		equal(editable.innerHTML, initialEditable.innerHTML);

		var redoChangeSet = Undo.inverseChangeSet(undoChangeSet);
		Undo.applyChangeSet(editable, redoChangeSet);
		equal(editable.innerHTML, controlEditable.innerHTML);
	});

}(window.aloha));
