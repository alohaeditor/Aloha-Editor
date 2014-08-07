require([
	'../src/aloha',
	'../src/boundaries'
], function (
	aloha,
	Boundaries
) {
	'use strict';
	
	var codeEditors = {};

	function getExampleName (textarea) {
		for (var i=textarea.classList.length - 1; i>=0; i--) {
			if (textarea.classList[i] !== 'example') {
				return textarea.classList[i];
			}
		}
	}

	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
	
	window.executeExample = function (example) {
		var code = codeEditors[example].getValue();
		window.event.target.blur();
		eval(code);
	};

	// properly size the height of all textareas
	[].forEach.call(document.querySelectorAll('textarea'), function (textarea) {
		var exampleName = getExampleName(textarea);
		codeEditors[exampleName] = CodeMirror.fromTextArea(textarea);
	});


});