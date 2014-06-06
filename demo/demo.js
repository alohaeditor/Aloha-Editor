require([
	'../../src/aloha',
	'../../src/boundaries'
], function (
	aloha,
	Boundaries
) {
	'use strict';
	
	var caret = document.querySelector('.aloha-caret');
	var codeEditors = {};

	function getExampleName (textarea) {
		console.log(textarea.className);
		for (var i=textarea.classList.length; i>=0; i++) {
			if (textarea.classList[i] !== 'example') {
				return textarea.classList[i];
			}
		}
	}

	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
	
	window.executeExample = function (example) {
		var code = codeEditors[example + '-code'].getValue();
		window.event.target.blur();
		eval(code);
	};

	// properly size the height of all textareas
	[].forEach.call(document.querySelectorAll('textarea'), function (textarea) {
		var exampleName = getExampleName(textarea);
		codeEditors[exampleName] = CodeMirror.fromTextArea(textarea);
	});


});