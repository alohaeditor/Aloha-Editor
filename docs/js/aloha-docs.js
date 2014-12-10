(function (aloha, CodeMirror) {
	'use strict';

	var codeEditors = {};

	aloha.dom.query('textarea', document).forEach(function (textarea) {
		codeEditors[textarea.id] = CodeMirror.fromTextArea(textarea);
	});

	window.executeExample = function (example) {
		window.event.target.blur();
		eval(codeEditors[example].getValue());
	};

}(window.aloha, window.CodeMirror));
