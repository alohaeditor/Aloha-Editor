(function ($) {
	'use strict';
	
	// init editables
	function main(aloha) {
	  	[].forEach.call(document.querySelectorAll('.aloha-editable'), aloha);
		
		function execute(actionStack) {
			var cur = aloha,
				last = actionStack.length - 1,
				next,
				editable = aloha.editables.fromElem(aloha.editor, $('.aloha-editable').get(0)),
				range = aloha.ranges.get(0),
				alohaEvent = { 
					editable : editable,
					range: range
				};
			for (var i = 1; i <= last; i++) {
				next = actionStack[i];
				if (cur[next]) {
					if (i === last && cur[next].mutate) {
						cur[next].mutate(alohaEvent);
					} else if (i === last) {
						cur[next](editable.undoContext, range);
					} else {
						cur = cur[next];
					}
				} else {
					return;
				}
			}
		}

		// will bind a ui interaction to the specific aloha functions
		function bind(event) {
			var className = '',
				actionStack = [];
			for (var i = 0; i < this.classList.length; i++) {
				className = this.classList[i];
				if (className !== 'aloha-ui' && className.indexOf('aloha') === 0) {
					execute(className.split('-'));
				}
			}
		}

		$('.aloha-ui').bind('click', bind);
	}


	// load aloha editor
	require(['../../src/aloha'], main);
}($));