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
			equal(tp.offsetLeft - editor.offsetLeft, left, "left");
			equal(tp.offsetTop - editor.offsetTop, top, "top");
        });
    }

	t('<p>[]one</p>', 9, 0);
	t('<p>one[]      </p>', 9, 18);
	t('<p>one     []   </p>', 9, 18);

	t('<p><br/>[]</p>', 9, 0);
	t('<p style="padding: 10px;">[]one</p>', 19, 10);
	t('<p style="padding: 10px;">[]<br/></p>', 19, 10);

	t('<p>multiline []paragraph test</p>', 19, 0)

	t('<p>one <br/><br/>[]<br/>last</p>', 29, 0)

}(window.aloha));

