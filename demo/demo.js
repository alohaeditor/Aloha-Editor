require([
	'../../src/aloha',
	'../../src/boundaries'
], function (
	aloha,
	Boundaries
) {
	'use strict';
	
	var caret = document.querySelector('.aloha-caret');

	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
	
	window.executeExample = function () {
		var code = window.event.target.previousElementSibling.innerHTML;
		window.event.target.blur();
		eval(code);
	};

	// properly size the height of all textareas
	[].forEach.call(document.querySelectorAll('textarea'), function (textarea) {
		//var lines = textarea.innerHTML.split('\n').length;
		//textarea.rows = lines;
		CodeMirror.fromTextArea(textarea);
	});


});