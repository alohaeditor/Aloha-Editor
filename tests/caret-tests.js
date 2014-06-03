(function (aloha) {
	'use strict';

	var Boundaries = aloha.boundaries;
	var BoundaryMarkers = aloha.boundarymarkers;
	var Events = aloha.events;

	var editor = document.getElementById('aloha_instance');
	aloha(editor);

    module('caret');

    function t(html, top, left) {
        test(html, function() {
            editor.innerHTML = html;
            var boundaries = BoundaryMarkers.extract(editor);
			Boundaries.select(boundaries[0], boundaries[1]);
			Events.dispatch(document, editor, 'keypress');

			var tp = document.querySelector('.aloha-caret');
			equal(tp.offsetLeft - editor.offsetLeft, left, name + " left");
			equal(tp.offsetTop - editor.offsetTop, top, name + " top");
        });
    }

	t('<p>[]one</p>', 16, 0);

	//testCoverage(test, tested, content);

}(window.aloha));

