(function (aloha) {
	'use strict';
	
	var codeEditors = {};
	
	window.executeExample = function (example) {
		var code = codeEditors[example].getValue();
		window.event.target.blur();
		eval(code);
	};

	[].forEach.call(document.querySelectorAll('textarea'), function (textarea) {
		var exampleName = textarea.id;
		codeEditors[exampleName] = CodeMirror.fromTextArea(textarea);
	});
}(aloha, CodeMirror));