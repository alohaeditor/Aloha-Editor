(function (aloha, CodeMirror) {
	'use strict';

	aloha.dom.query('.snippet', document).forEach(function (elem) {
		var code = (elem.textContent || elem.innerText).trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		elem.innerHTML = '';
		CodeMirror(elem, {
			value    : code,
			mode     : aloha.dom.getAttr(elem, 'data-syntax') || 'javascript',
			readOnly : true
		});
		elem.innerHTML = elem.innerHTML
			.replace(/<span class="cm-operator">&lt;\*<\/span>/g, '<u>')
			.replace(/<span class="cm-operator">\*&gt;<\/span>/g, '</u>')
			.replace(/{%/g, '<u>').replace(/%}/g, '</u>');
	});

}(window.aloha, window.CodeMirror));
