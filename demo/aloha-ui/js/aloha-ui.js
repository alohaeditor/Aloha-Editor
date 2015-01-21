/**
 * This file is obsolete for the purposes of the UI demo. It is only left here
 * because it is being sourced for alohaeditor.org's front page. Once the
 * landing page is updated, this file should be deleted.
 */
(function (aloha) {

	'use strict';

	var commands = {
		B        : aloha.ui.commands.bold,
		I        : aloha.ui.commands.italic,
		unformat : aloha.ui.commands.unformat
	};

	for (var selector in commands) {
		$('.aloha-action-' + selector)
			.on('click', aloha.ui.command(commands[selector]));
	}

	function middleware(event) {
		$('.aloha-ui .active, .aloha-ui.active').removeClass('active');
		if ('leave' === event.type) {
			return event;
		}
		var states = aloha.ui.states(commands, event);
		for (var selector in states) {
			$('.aloha-action-' + selector).toggleClass('active', states[selector]);
		}
		return event;
	}

	aloha.editor.stack.unshift(middleware);

})(window.aloha);
